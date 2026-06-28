/**
 * One-off: delete a business and all related data by slug.
 * Usage: node src/scripts/deleteBusinessBySlug.js fitness-pro-gym
 */
require('dotenv').config();
const connectDB = require('../config/database');
const store = require('../db/firestoreStore');
const { COLLECTIONS } = store;
const businessRepository = require('../repositories/businessRepository');
const businessService = require('../services/businessService');

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node src/scripts/deleteBusinessBySlug.js <slug>');
    process.exit(1);
  }

  await connectDB();
  const business = await businessRepository.findBySlug(slug);
  if (!business) {
    console.error(`No business found with slug "${slug}"`);
    process.exit(1);
  }

  const result = await businessService.delete(business._id);
  console.log(`Deleted business: ${result.name} (${slug})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
