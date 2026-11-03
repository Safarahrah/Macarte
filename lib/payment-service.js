'use strict';

const stripe = require('./stripe');

/**
 * Centralized payment service for Stripe Checkout.
 * Works with any entity that has payment tracking columns:
 * - payment_status (TEXT, default 'unpaid')
 * - stripe_session_id (TEXT, optional)
 * - stripe_payment_intent_id (TEXT, optional)
 * - paid_at (DATETIME, optional)
 */

/**
 * Create a Stripe Checkout session for a given entity.
 * @param {Object} params
 * @param {string} params.entityId - ID of the entity (printable card or design project)
 * @param {string} params.entityType - Type: 'printable_card' or 'design_project'
 * @param {string} params.userId - User ID making the purchase
 * @param {string} params.priceId - Stripe Price ID from environment
 * @param {string} params.appUrl - Base URL for success/cancel redirects
 * @param {string} params.redirectPath - Path to redirect after checkout (e.g., '/admin/print')
 * @param {Object} params.metadata - Additional metadata for the session
 * @returns {Promise<{url: string}>}
 */
async function createCheckoutSession({
  entityId,
  entityType,
  userId,
  priceId,
  appUrl,
  redirectPath,
  metadata = {}
}) {
  if (!priceId || !priceId.startsWith('price_')) {
    const error = new Error('STRIPE_PRICE_ID is missing or invalid');
    error.status = 500;
    throw error;
  }

  if (!appUrl) {
    const error = new Error('APP_URL is missing');
    error.status = 500;
    throw error;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${appUrl}${redirectPath}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${redirectPath}?canceled=true`,
    client_reference_id: entityId,
    metadata: {
      entityType,
      entityId,
      userId: String(userId),
      ...metadata
    }
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Update entity with Stripe session ID after creating checkout.
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Table name: 'printable_cards' or 'design_projects'
 * @param {string} entityId - Entity ID
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<void>}
 */
async function updateEntityWithSession(db, tableName, entityId, sessionId) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${tableName} SET stripe_session_id = ? WHERE id = ?`,
      [sessionId, entityId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

/**
 * Check if an entity is already paid.
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Table name
 * @param {string} entityId - Entity ID
 * @returns {Promise<boolean>}
 */
async function isEntityPaid(db, tableName, entityId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT payment_status FROM ${tableName} WHERE id = ?`,
      [entityId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row && row.payment_status === 'paid');
      }
    );
  });
}

/**
 * Mark an entity as paid after successful webhook.
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Table name
 * @param {string} entityId - Entity ID
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<void>}
 */
async function markEntityAsPaid(db, tableName, entityId, paymentIntentId) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${tableName}
       SET payment_status = 'paid',
           stripe_payment_intent_id = ?,
           paid_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [paymentIntentId, entityId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

/**
 * Load an entity with payment status for verification.
 * @param {Object} db - SQLite database instance
 * @param {string} tableName - Table name
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object|null>}
 */
async function loadEntityWithPayment(db, tableName, entityId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, user_id, payment_status, stripe_session_id, stripe_payment_intent_id, paid_at
       FROM ${tableName}
       WHERE id = ?`,
      [entityId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

module.exports = {
  createCheckoutSession,
  updateEntityWithSession,
  isEntityPaid,
  markEntityAsPaid,
  loadEntityWithPayment
};
