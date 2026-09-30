/* Nila Inn Residency — Database Seeder
   Seeds the initial administrator credentials into MongoDB.
   Usage: npm run seed */

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './db.js';

const BACKEND_DIR = import.meta.dirname;
const ROOT = path.join(BACKEND_DIR, '..');

const envFiles = [
  path.join(BACKEND_DIR, '.env'),
  path.join(ROOT, '.env')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      process.loadEnvFile(envFile);
      break;
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn('Warning loading env file:', e.message);
    }
  }
}

const adminName = process.env.ADMIN_NAME || 'Admin';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nilainn.com').toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  try {
    await connectDB(process.env.MONGODB_URI, process.env.MONGODB_DB || 'nila_invoice');

    const existing = await User.findOne({ email: adminEmail });
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    if (existing) {
      existing.name = adminName;
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`\n✔ Admin account updated:`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
      });
      console.log(`\n✔ Admin account created:`);
    }

    console.log(`----------------------------------------`);
    console.log(` Email:    ${adminEmail}`);
    console.log(` Password: ${adminPassword}`);
    console.log(`----------------------------------------\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
