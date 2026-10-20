'use strict';

function canAccessPrintableCard(user, row) {
  if (!user || !row) return false;
  if (row.user_id === user.id) return true;
  if (user.role === 'owner' && user.organisationId && row.organisation_id === user.organisationId) {
    return true;
  }
  return false;
}

function canAccessDigitalCard(user, cardRow) {
  if (!user || !cardRow) return false;
  if (cardRow.user_id === user.id) return true;
  if (user.role === 'owner' && user.organisationId && cardRow.organisation_id === user.organisationId) {
    return true;
  }
  return false;
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function loadPrintableCard(db, id) {
  return dbGet(db, `
    SELECT p.*, u.organisation_id
    FROM printable_cards p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `, [id]);
}

async function resolveDigitalTarget(db, user, digitalCard, appUrl) {
  const slug = (digitalCard?.slug || '').trim().toLowerCase();
  if (!slug) {
    return { error: 'Select a digital card before generating a QR code.', status: 400 };
  }
  let card;
  if (digitalCard.userId) {
    card = await dbGet(db, `
      SELECT c.slug, c.user_id, c.short_code, u.organisation_id
      FROM cards c
      JOIN users u ON u.id = c.user_id
      WHERE LOWER(c.slug) = ? AND c.user_id = ?
      LIMIT 1
    `, [slug, digitalCard.userId]);
  } else {
    card = await dbGet(db, `
      SELECT c.slug, c.user_id, c.short_code, u.organisation_id
      FROM cards c
      JOIN users u ON u.id = c.user_id
      WHERE LOWER(c.slug) = ? AND c.user_id = ?
      LIMIT 1
    `, [slug, user.id]);
    if (!card && user.role === 'owner' && user.organisationId) {
      card = await dbGet(db, `
        SELECT c.slug, c.user_id, c.short_code, u.organisation_id
        FROM cards c
        JOIN users u ON u.id = c.user_id
        WHERE LOWER(c.slug) = ? AND u.organisation_id = ?
        LIMIT 1
      `, [slug, user.organisationId]);
    }
  }
  if (!card) {
    return { error: 'Digital card not found. Create a digital card first.', status: 404 };
  }
  if (!canAccessDigitalCard(user, card)) {
    return { error: 'You cannot link another user\'s private digital card.', status: 403 };
  }
  const publicUrl = `${appUrl.replace(/\/$/, '')}/${card.short_code}`;
  return {
    slug: card.slug,
    userId: card.user_id,
    shortCode: card.short_code,
    publicUrl
  };
}

module.exports = {
  canAccessPrintableCard,
  canAccessDigitalCard,
  dbGet,
  dbAll,
  dbRun,
  loadPrintableCard,
  resolveDigitalTarget
};
