
'use strict';

const stripe = require('stripe');

const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();

if (!secretKey) {
  console.warn('[STRIPE] Warning: STRIPE_SECRET_KEY is not defined in environment variables.');
}

/**
 * Centralized Stripe instance.
 * Trimming the key ensures no accidental whitespace causes 'Invalid API Key' errors.
 */
const stripeInstance = stripe(secretKey);

module.exports = stripeInstance;
