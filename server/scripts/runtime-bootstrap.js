'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function main() {
  await sequelize.sync();
  await sequelize.query(`CREATE TABLE IF NOT EXISTS ai_results (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    input_data JSONB NOT NULL DEFAULT '{}',
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await sequelize.query('CREATE INDEX IF NOT EXISTS ai_results_user_created_idx ON ai_results(user_id, created_at DESC)');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const tenantId = (process.env.TENANT_ID || process.env.SEED_TENANT_ID || '').trim();
  if (!email || password.length < 12 || !tenantId) throw new Error('Runtime admin email, password, and tenant are required');
  const attributes = { email, password: await bcrypt.hash(password, 12), name: process.env.PROVISION_ADMIN_NAME || 'Runtime Admin', role: 'admin', tenantId };
  const existing = await User.findOne({ where: { email } });
  if (existing) await existing.update(attributes); else await User.create(attributes);
  console.log('Runtime schema and admin are ready.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => sequelize.close());
