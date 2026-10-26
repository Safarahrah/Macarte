'use strict';

const crypto = require('crypto');
const { body, param } = require('express-validator');
const { sanitizeConfig } = require('../../src/printable/shared/sanitize');
const { buildLayout } = require('../../src/printable/shared/layout');
const { getExportPixelSize, getPdfPageSizeMm, FORMATS, DEFAULT_DPI } = require('../../src/printable/shared/spec');
const { qrSvg } = require('./qr');
const { renderPdfBuffer, defaultResolveImage } = require('./render-pdf');
const { renderJpgBuffer } = require('./render-jpg');
const stripe = require('../stripe');
const {
  canAccessPrintableCard,
  dbAll,
  dbGet,
  dbRun,
  loadPrintableCard,
  resolveDigitalTarget
} = require('./access');

function parseConfig(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  } catch (err) {
    return {};
  }
}

function fullNameSafe(config) {
  return `${config.fields.firstName || ''} ${config.fields.lastName || ''}`.trim();
}

function registerPrintableCardRoutes(app, deps) {
  const {
    db,
    requireAuth,
    csrfProtection,
    apiLimiter,
    handleValidationErrors,
    APP_URL,
    UPLOADS_DIR
  } = deps;

  const resolveImage = defaultResolveImage(UPLOADS_DIR);
  const idValidation = param('id').trim().isUUID().withMessage('Invalid printable card id');

  app.post(
    '/api/printable-cards/:id/checkout',
    requireAuth,
    apiLimiter,
    csrfProtection,
    [idValidation],
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const row = await loadPrintableCard(db, req.params.id);

        if (!row) {
          return res.status(404).json({
            error: 'Carte imprimable introuvable.'
          });
        }

        if (!canAccessPrintableCard(req.user, row)) {
          return res.status(403).json({
            error: 'Accès refusé.'
          });
        }

        if (row.payment_status === 'paid') {
          return res.status(409).json({
            error: 'Cette carte est déjà payée.'
          });
        }

        const priceId = process.env.STRIPE_PRICE_ID?.trim();

        if (!priceId || !priceId.startsWith('price_')) {
          console.error('[Stripe] STRIPE_PRICE_ID est absent ou invalide.');

          return res.status(500).json({
            error: 'Le prix du paiement est mal configuré.'
          });
        }

        if (!APP_URL) {
          console.error('[Stripe] APP_URL est absent.');

          return res.status(500).json({
            error: 'La configuration du paiement est incomplète.'
          });
        }

        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price: priceId,
              quantity: 1
            }
          ],
          mode: 'payment',
          success_url: `${APP_URL}/admin/print?slug=${encodeURIComponent(row.digital_card_slug || '')}&success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${APP_URL}/admin/print?slug=${encodeURIComponent(row.digital_card_slug || '')}&canceled=true`,
          client_reference_id: row.id,
          metadata: {
            printableCardId: row.id,
            userId: String(req.user.id)
          }
        });

        await dbRun(
          db,
          'UPDATE printable_cards SET stripe_session_id = ? WHERE id = ?',
          [session.id, row.id]
        );

        return res.json({ url: session.url });
      } catch (err) {
        console.error('[Stripe Checkout] Erreur :', {
          type: err.type,
          code: err.code,
          message: err.message
        });

        return next(err);
      }
    }
  );

  app.get('/api/printable-cards', requireAuth, apiLimiter, async (req, res, next) => {
    try {
      let rows;
      if (req.user.role === 'owner' && req.user.organisationId) {
        rows = await dbAll(db, `
          SELECT p.id, p.user_id, p.name, p.digital_card_slug, p.updated_at, p.created_at
          FROM printable_cards p
          JOIN users u ON u.id = p.user_id
          WHERE u.organisation_id = ?
          ORDER BY p.updated_at DESC
        `, [req.user.organisationId]);
      } else {
        rows = await dbAll(db, `
          SELECT p.id, p.user_id, p.name, p.digital_card_slug, p.updated_at, p.created_at
          FROM printable_cards p
          WHERE p.user_id = ?
          ORDER BY p.updated_at DESC
        `, [req.user.id]);
      }
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/printable-cards/meta/formats', requireAuth, apiLimiter, (req, res) => {
    res.json({
      formats: FORMATS,
      defaultDpi: DEFAULT_DPI,
      colorNote: 'Exports use RGB. They are print-ready for size and bleed, not PDF/X or CMYK.'
    });
  });

  app.post('/api/printable-cards/resolve-qr', requireAuth, apiLimiter, csrfProtection, [
    body('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug'),
    body('userId').optional({ nullable: true }).isString().isLength({ max: 80 })
  ], handleValidationErrors, async (req, res, next) => {
    try {
      const target = await resolveDigitalTarget(db, req.user, {
        slug: req.body.slug,
        userId: req.body.userId
      }, APP_URL);
      if (target.error) return res.status(target.status).json({ error: target.error });
      res.json({
        ...target,
        qrSvg: qrSvg(target.publicUrl, 256)
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/printable-cards/export', requireAuth, apiLimiter, csrfProtection, [
    body('format').isIn(['pdf', 'jpg']).withMessage('format must be pdf or jpg'),
    body('side').optional().isIn(['front', 'back', 'both']),
    body('cropMarks').optional().isBoolean(),
    body('includeBleed').optional().isBoolean(),
    body('dpi').optional().isInt({ min: 300, max: 600 }),
    body('config').isObject()
  ], handleValidationErrors, async (req, res, next) => {
    try {
      const config = sanitizeConfig(req.body.config);
      const target = await resolveDigitalTarget(db, req.user, config.digitalCard, APP_URL);
      if (target.error) {
        return res.status(target.status).json({
          error: target.error,
          needsDigitalCard: true
        });
      }

      // Verify payment status
      const cardRow = await dbGet(db, 'SELECT payment_status FROM printable_cards WHERE digital_card_slug = ? AND user_id = ?', [target.slug, req.user.id]);
      if (!cardRow || cardRow.payment_status !== 'paid') {
        return res.status(402).json({ error: 'Payment required to export high-resolution files.' });
      }

      config.digitalCard = {
        slug: target.slug,
        userId: target.userId,
        shortCode: target.shortCode,
        name: config.digitalCard.name
      };
      const layout = buildLayout(config, target.publicUrl);
      const cropMarks = Boolean(req.body.cropMarks);
      const includeBleed = req.body.includeBleed !== false;
      const dpi = Number(req.body.dpi) || DEFAULT_DPI;
      const side = req.body.side || (config.doubleSided ? 'both' : 'front');
      const filenameBase = (fullNameSafe(config) || 'business-card').replace(/[^a-z0-9-_]+/gi, '-');

      if (req.body.format === 'pdf') {
        const sides = side === 'both' ? (layout.sides.back ? ['front', 'back'] : ['front']) : [side];
        if (side === 'back' && !layout.sides.back) {
          return res.status(400).json({ error: 'Back side is disabled for this card.' });
        }
        const pdf = await renderPdfBuffer(layout, { cropMarks, sides, resolveImage });
        const page = getPdfPageSizeMm(config.formatId, { cropMarks });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
        res.setHeader('X-Print-Width-Mm', String(page.widthMm));
        res.setHeader('X-Print-Height-Mm', String(page.heightMm));
        res.setHeader('X-Print-Public-Url', target.publicUrl);
        return res.send(pdf);
      }

      if (side === 'both') {
        return res.status(400).json({ error: 'JPG export supports one face at a time. Download front and back separately.' });
      }
      if (side === 'back' && !layout.sides.back) {
        return res.status(400).json({ error: 'Back side is disabled for this card.' });
      }
      const jpg = await renderJpgBuffer(layout, side, { includeBleed, dpi, resolveImage });
      const pixels = getExportPixelSize(config.formatId, { includeBleed, dpi });
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${side}.jpg"`);
      res.setHeader('X-Print-Width-Px', String(pixels.widthPx));
      res.setHeader('X-Print-Height-Px', String(pixels.heightPx));
      res.setHeader('X-Print-Public-Url', target.publicUrl);
      return res.send(jpg);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/printable-cards', requireAuth, apiLimiter, csrfProtection, [
    body('name').optional().trim().isLength({ max: 120 }),
    body('config').optional().isObject()
  ], handleValidationErrors, async (req, res, next) => {
    try {
      const id = crypto.randomUUID();
      const config = sanitizeConfig(req.body.config);
      const name = (req.body.name || `${config.fields.firstName} ${config.fields.lastName}`.trim() || 'Printable card').substring(0, 120);
      await dbRun(db, `
        INSERT INTO printable_cards (id, user_id, name, digital_card_slug, digital_card_user_id, config)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        req.user.id,
        name,
        config.digitalCard.slug || null,
        config.digitalCard.userId || null,
        JSON.stringify(config)
      ]);
      res.status(201).json({ id, name, config });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/printable-cards/:id', requireAuth, apiLimiter, [idValidation], handleValidationErrors, async (req, res, next) => {
    try {
      const row = await loadPrintableCard(db, req.params.id);
      if (!row) return res.status(404).json({ error: 'Printable card not found' });
      if (!canAccessPrintableCard(req.user, row)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const config = sanitizeConfig(parseConfig(row.config));
      let publicUrl = null;
      if (config.digitalCard?.slug) {
        const target = await resolveDigitalTarget(db, req.user, config.digitalCard, APP_URL);
        if (!target.error) publicUrl = target.publicUrl;
      }
      res.json({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        config,
        publicUrl,
        payment_status: row.payment_status,
        price: process.env.STRIPE_PRICE_AMOUNT || '9.99',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/printable-cards/:id', requireAuth, apiLimiter, csrfProtection, [
    idValidation,
    body('name').optional().trim().isLength({ max: 120 }),
    body('config').optional().isObject()
  ], handleValidationErrors, async (req, res, next) => {
    try {
      const row = await loadPrintableCard(db, req.params.id);
      if (!row) return res.status(404).json({ error: 'Printable card not found' });
      if (!canAccessPrintableCard(req.user, row)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const config = sanitizeConfig(req.body.config || parseConfig(row.config));
      const name = (req.body.name || row.name || 'Printable card').substring(0, 120);
      await dbRun(db, `
        UPDATE printable_cards
        SET name = ?, digital_card_slug = ?, digital_card_user_id = ?, config = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name,
        config.digitalCard.slug || null,
        config.digitalCard.userId || null,
        JSON.stringify(config),
        row.id
      ]);
      res.json({ id: row.id, name, config });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/printable-cards/:id', requireAuth, apiLimiter, csrfProtection, [idValidation], handleValidationErrors, async (req, res, next) => {
    try {
      const row = await loadPrintableCard(db, req.params.id);
      if (!row) return res.status(404).json({ error: 'Printable card not found' });
      if (!canAccessPrintableCard(req.user, row)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      await dbRun(db, 'DELETE FROM printable_cards WHERE id = ?', [row.id]);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = {
  registerPrintableCardRoutes
};