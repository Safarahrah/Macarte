// server/routes/printable.js
const express = require('express');
const { randomUUID } = require('crypto');
const { sanitizeConfig } = require('../../src/printable/shared/sanitize');

module.exports = (db) => {
  const router = express.Router();

  const dbGet = (sql, params) =>
    new Promise((resolve, reject) =>
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

  const dbRun = (sql, params) =>
    new Promise((resolve, reject) =>
      db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));

  // Le token "admin" historique n'a pas d'id utilisateur
  router.use((req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });

  const SLUG_RE = /^[a-z0-9-]{1,50}$/;

  // GET /api/printable/:cardSlug
  router.get('/:cardSlug', async (req, res) => {
    try {
      const cardSlug = String(req.params.cardSlug).toLowerCase();
      if (!SLUG_RE.test(cardSlug)) return res.status(400).json({ error: 'Invalid slug' });

      const row = await dbGet(
        `SELECT pc.*, u.organisation_id FROM printable_cards pc
         JOIN cards c ON c.slug = pc.digital_card_slug AND c.user_id = pc.digital_card_user_id
         JOIN users u ON u.id = pc.user_id
         WHERE pc.digital_card_slug = ? AND pc.user_id = ?
         ORDER BY pc.updated_at DESC
         LIMIT 1`,
        [cardSlug, req.user.id]
      );
      if (!row) return res.status(404).json({ error: 'Printable card not found or access denied' });

           res.json({
        ...row,
        config: JSON.parse(row.config),
        price: process.env.STRIPE_PRICE_AMOUNT || '9.99'
      });
    } catch (err) {
      console.error('[PRINTABLE] GET error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/printable : crée ou met à jour la version imprimable d'une carte
  router.post('/', async (req, res) => {
    try {
      const cardSlug = String(req.body?.cardSlug || '').toLowerCase();
      if (!SLUG_RE.test(cardSlug)) return res.status(400).json({ error: 'Invalid slug' });

      let sanitizedConfig;
      try {
        sanitizedConfig = sanitizeConfig(req.body?.config);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid config' });
      }
      const configJson = JSON.stringify(sanitizedConfig);
      const name = String(sanitizedConfig.digitalCard?.name || '').trim().substring(0, 200);

      // La carte numérique cible doit exister et appartenir à l'utilisateur connecté
      const validCard = await dbGet(
        'SELECT slug FROM cards WHERE slug = ? AND user_id = ?',
        [cardSlug, req.user.id]
      );
      if (!validCard) return res.status(404).json({ error: 'Target digital card not found' });

      const existing = await dbGet(
        'SELECT id FROM printable_cards WHERE digital_card_slug = ? AND user_id = ?',
        [cardSlug, req.user.id]
      );

      let id;
      if (existing) {
        id = existing.id;
        await dbRun(
          `UPDATE printable_cards
           SET config = ?, name = ?, digital_card_user_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [configJson, name, req.user.id, id]
        );
      } else {
        id = randomUUID();
        await dbRun(
          `INSERT INTO printable_cards (id, user_id, name, digital_card_slug, digital_card_user_id, config)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, req.user.id, name, cardSlug, req.user.id, configJson]
        );
      }

res.json({ id, cardSlug, config: sanitizedConfig });
    } catch (err) {
      console.error('[PRINTABLE] POST error:', err);
      res.status(500).json({ error: 'Save failed' });
    }
  });

  return router;
};