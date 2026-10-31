'use strict';

// Design projects API: one generic router (/api/designs) plus one alias per
// module (/api/pockets, /api/logos, /api/flyers, /api/posters,
// /api/social-designs, /api/other-designs) restricted to its own type.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const sharp = require('sharp');
const { body, param, query } = require('express-validator');
const {
  sanitizeDesignData,
  sanitizeSubtype,
  isValidType,
  DESIGN_LIMITS
} = require('../../src/design/shared/sanitize');
const { getModule } = require('../../src/design/shared/modules');
const { dbAll, dbGet, dbRun } = require('../printable-card/access');

const TYPE_ALIASES = {
  pocket: '/api/pockets',
  logo: '/api/logos',
  flyer: '/api/flyers',
  poster: '/api/posters',
  social_design: '/api/social-designs',
  other: '/api/other-designs'
};

const THUMB_PREFIX = 'design-thumb-';
const THUMB_DATA_RE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_THUMB_BYTES = 1.5 * 1024 * 1024;

function canAccessDesign(user, row) {
  if (!user || !row || !user.id) return false;
  if (row.user_id === user.id) return true;
  return Boolean(user.role === 'owner' && user.organisationId && row.owner_org_id === user.organisationId);
}

function parseJson(raw, fallback) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw || fallback);
  } catch (e) {
    return fallback;
  }
}

function toSummary(row) {
  return {
    id: row.id,
    type: row.type,
    subtype: row.subtype || null,
    title: row.title,
    format: row.format || null,
    dimensions: parseJson(row.dimensions, null),
    thumbnail: row.thumbnail || null,
    userId: row.user_id,
    organisationId: row.organisation_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toFull(row) {
  return {
    ...toSummary(row),
    data: sanitizeDesignData(parseJson(row.data, {}), { type: row.type, subtype: row.subtype })
  };
}

function registerDesignRoutes(app, deps) {
  const {
    db,
    requireAuth,
    csrfProtection,
    handleValidationErrors,
    upload,
    verifyUploadedImage,
    UPLOADS_DIR
  } = deps;

  const designLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
  const designUploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 120,
    message: { error: 'Trop d’envois d’images, réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const requireUser = (req, res, next) => {
    if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
    next();
  };

  async function loadDesign(id) {
    return dbGet(db, `
      SELECT d.*, u.organisation_id AS owner_org_id
      FROM design_projects d
      JOIN users u ON u.id = d.user_id
      WHERE d.id = ?
    `, [id]);
  }

  function thumbPath(url) {
    if (!url || !url.startsWith(`/uploads/${THUMB_PREFIX}`)) return null;
    const name = path.basename(url);
    if (name !== url.slice('/uploads/'.length)) return null;
    return path.join(UPLOADS_DIR, name);
  }

  async function removeThumb(url) {
    const file = thumbPath(url);
    if (!file) return;
    try { await fs.promises.unlink(file); } catch (e) { /* already gone */ }
  }

  async function storeThumb(id, dataUrl) {
    if (!dataUrl) return null;
    const match = THUMB_DATA_RE.exec(String(dataUrl));
    if (!match) {
      const err = new Error('Miniature invalide.');
      err.status = 400;
      throw err;
    }
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_THUMB_BYTES) {
      const err = new Error('Miniature trop volumineuse.');
      err.status = 400;
      throw err;
    }
    let out;
    try {
      out = await sharp(buffer, { limitInputPixels: 4096 * 4096 })
        .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (e) {
      const err = new Error('Miniature illisible.');
      err.status = 400;
      throw err;
    }
    const name = `${THUMB_PREFIX}${id}-${Date.now()}.webp`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, name), out);
    return `/uploads/${name}`;
  }

  function prepareDocument(type, subtype, rawData) {
    const data = sanitizeDesignData(rawData, { type, subtype });
    const json = JSON.stringify(data);
    if (Buffer.byteLength(json, 'utf8') > DESIGN_LIMITS.jsonBytes) {
      const err = new Error('Le projet est trop volumineux.');
      err.status = 413;
      throw err;
    }
    return {
      data,
      json,
      dimensions: JSON.stringify({ width: data.width, height: data.height, unit: data.unit, bleed: data.bleed })
    };
  }

  function defaultTitle(type) {
    const mod = getModule(type);
    const label = mod ? mod.singular : 'création';
    return `Nouvelle ${label}`.replace('Nouvelle logo', 'Nouveau logo').replace('Nouvelle flyer', 'Nouveau flyer');
  }

  function createRouter(fixedType) {
    const router = express.Router();
    router.use(requireAuth, requireUser, designLimiter);

    const idValidation = param('id').trim().isUUID().withMessage('Identifiant de projet invalide');
    const typeOf = (req) => fixedType || req.body.type || req.query.type;

    const loadAccessible = async (req, res) => {
      const row = await loadDesign(req.params.id);
      if (!row || (fixedType && row.type !== fixedType)) {
        res.status(404).json({ error: 'Projet introuvable.' });
        return null;
      }
      if (!canAccessDesign(req.user, row)) {
        res.status(403).json({ error: 'Accès refusé.' });
        return null;
      }
      return row;
    };

    if (!fixedType) {
      router.get('/summary', async (req, res, next) => {
        try {
          const scope = scopeClause(req.user);
          const counts = await dbAll(db, `
            SELECT d.type, COUNT(*) AS count FROM design_projects d JOIN users u ON u.id = d.user_id
            WHERE ${scope.sql} GROUP BY d.type
          `, scope.params);
          const recent = await dbAll(db, `
            SELECT d.* FROM design_projects d JOIN users u ON u.id = d.user_id
            WHERE ${scope.sql} ORDER BY d.updated_at DESC LIMIT 8
          `, scope.params);
          const printable = await dbGet(db, `
            SELECT COUNT(*) AS count FROM printable_cards p JOIN users u ON u.id = p.user_id WHERE ${scope.sql.replace(/d\.user_id/g, 'p.user_id')}
          `, scope.params);
          const digital = await dbGet(db, `
            SELECT COUNT(*) AS count FROM cards c JOIN users u ON u.id = c.user_id WHERE ${scope.sql.replace(/d\.user_id/g, 'c.user_id')}
          `, scope.params);
          const byType = {};
          counts.forEach((r) => { byType[r.type] = r.count; });
          byType.printable_card = printable ? printable.count : 0;
          byType.digital_card = digital ? digital.count : 0;
          res.json({ counts: byType, recent: recent.map(toSummary) });
        } catch (err) {
          next(err);
        }
      });

      router.post('/uploads', csrfProtection, designUploadLimiter, upload.single('file'), async (req, res, next) => {
        try {
          if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
          const check = await verifyUploadedImage(req.file);
          if (check.error) return res.status(400).json({ error: check.error });
          const meta = await sharp(req.file.path).metadata();
          res.status(201).json({ url: `/uploads/${req.file.filename}`, width: meta.width || null, height: meta.height || null });
        } catch (err) {
          next(err);
        }
      });
    }

    router.get('/', [
      query('type').optional().isString(),
      query('q').optional().isString().isLength({ max: 120 }),
      query('subtype').optional().isString().isLength({ max: 40 })
    ], handleValidationErrors, async (req, res, next) => {
      try {
        const type = fixedType || req.query.type;
        if (type && !isValidType(type)) return res.status(400).json({ error: 'Type de projet invalide.' });
        const scope = scopeClause(req.user);
        const where = [scope.sql];
        const params = [...scope.params];
        if (type) { where.push('d.type = ?'); params.push(type); }
        if (req.query.subtype) { where.push('d.subtype = ?'); params.push(req.query.subtype); }
        if (req.query.q) { where.push('LOWER(d.title) LIKE ?'); params.push(`%${String(req.query.q).toLowerCase()}%`); }
        const rows = await dbAll(db, `
          SELECT d.id, d.user_id, d.organisation_id, d.type, d.subtype, d.title, d.format, d.dimensions, d.thumbnail, d.created_at, d.updated_at
          FROM design_projects d JOIN users u ON u.id = d.user_id
          WHERE ${where.join(' AND ')}
          ORDER BY d.updated_at DESC
          LIMIT 500
        `, params);
        res.json(rows.map(toSummary));
      } catch (err) {
        next(err);
      }
    });

    router.post('/', csrfProtection, [
      body('title').optional().isString().trim().isLength({ max: DESIGN_LIMITS.title }),
      body('subtype').optional({ nullable: true }).isString().isLength({ max: 40 }),
      body('format').optional({ nullable: true }).isString().isLength({ max: 40 }),
      body('data').optional().isObject(),
      body('thumbnail').optional({ nullable: true }).isString()
    ], handleValidationErrors, async (req, res, next) => {
      const id = crypto.randomUUID();
      let thumbnail = null;
      try {
        const type = typeOf(req);
        if (!isValidType(type)) return res.status(400).json({ error: 'Type de projet invalide.' });
        const subtype = sanitizeSubtype(type, req.body.subtype);
        const doc = prepareDocument(type, subtype, req.body.data);
        const title = (req.body.title || '').trim() || defaultTitle(type);
        thumbnail = await storeThumb(id, req.body.thumbnail);
        await dbRun(db, `
          INSERT INTO design_projects (id, user_id, organisation_id, type, subtype, title, format, dimensions, data, thumbnail)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, req.user.id, req.user.organisationId || null, type, subtype, title, req.body.format || doc.data.formatId, doc.dimensions, doc.json, thumbnail]);
        const row = await loadDesign(id);
        res.status(201).json(toFull(row));
      } catch (err) {
        if (thumbnail) await removeThumb(thumbnail);
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
      }
    });

    router.get('/:id', [idValidation], handleValidationErrors, async (req, res, next) => {
      try {
        const row = await loadAccessible(req, res);
        if (!row) return;
        res.json(toFull(row));
      } catch (err) {
        next(err);
      }
    });

    router.put('/:id', csrfProtection, [
      idValidation,
      body('title').optional().isString().trim().isLength({ min: 1, max: DESIGN_LIMITS.title }),
      body('format').optional({ nullable: true }).isString().isLength({ max: 40 }),
      body('data').optional().isObject(),
      body('thumbnail').optional({ nullable: true }).isString()
    ], handleValidationErrors, async (req, res, next) => {
      let thumbnail = null;
      try {
        const row = await loadAccessible(req, res);
        if (!row) return;
        const doc = req.body.data
          ? prepareDocument(row.type, row.subtype, req.body.data)
          : { json: row.data, dimensions: row.dimensions, data: parseJson(row.data, {}) };
        thumbnail = req.body.thumbnail ? await storeThumb(row.id, req.body.thumbnail) : null;
        await dbRun(db, `
          UPDATE design_projects
          SET title = ?, format = ?, dimensions = ?, data = ?, thumbnail = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          (req.body.title || row.title).trim(),
          req.body.format || (req.body.data ? doc.data.formatId : row.format),
          doc.dimensions,
          doc.json,
          thumbnail || row.thumbnail,
          row.id
        ]);
        if (thumbnail && row.thumbnail) await removeThumb(row.thumbnail);
        res.json(toFull(await loadDesign(row.id)));
      } catch (err) {
        if (thumbnail) await removeThumb(thumbnail);
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
      }
    });

    router.post('/:id/duplicate', csrfProtection, [
      idValidation,
      body('title').optional().isString().trim().isLength({ max: DESIGN_LIMITS.title })
    ], handleValidationErrors, async (req, res, next) => {
      try {
        const row = await loadAccessible(req, res);
        if (!row) return;
        const id = crypto.randomUUID();
        let thumbnail = null;
        const source = thumbPath(row.thumbnail);
        if (source && fs.existsSync(source)) {
          const name = `${THUMB_PREFIX}${id}-${Date.now()}.webp`;
          await fs.promises.copyFile(source, path.join(UPLOADS_DIR, name));
          thumbnail = `/uploads/${name}`;
        }
        const title = (req.body.title || `${row.title} (copie)`).substring(0, DESIGN_LIMITS.title);
        await dbRun(db, `
          INSERT INTO design_projects (id, user_id, organisation_id, type, subtype, title, format, dimensions, data, thumbnail)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, req.user.id, req.user.organisationId || null, row.type, row.subtype, title, row.format, row.dimensions, row.data, thumbnail]);
        res.status(201).json(toFull(await loadDesign(id)));
      } catch (err) {
        next(err);
      }
    });

    router.delete('/:id', csrfProtection, [idValidation], handleValidationErrors, async (req, res, next) => {
      try {
        const row = await loadAccessible(req, res);
        if (!row) return;
        await dbRun(db, 'DELETE FROM design_projects WHERE id = ?', [row.id]);
        await removeThumb(row.thumbnail);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    });

    return router;
  }

  function scopeClause(user) {
    if (user.role === 'owner' && user.organisationId) {
      return { sql: '(d.user_id = ? OR u.organisation_id = ?)', params: [user.id, user.organisationId] };
    }
    return { sql: 'd.user_id = ?', params: [user.id] };
  }

  app.use('/api/designs', createRouter(null));
  Object.entries(TYPE_ALIASES).forEach(([type, mount]) => app.use(mount, createRouter(type)));
}

module.exports = { registerDesignRoutes, canAccessDesign, TYPE_ALIASES };
