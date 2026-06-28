require('dotenv').config();
const connectDB = require('../config/database');
const businessRepository = require('../repositories/businessRepository');
const userRepository = require('../repositories/userRepository');
const { seedDefaultModules } = require('./defaultModules');

/**
 * Add missing default modules to existing businesses (safe for production — does not wipe data).
 */
async function run() {
  await connectDB();
  console.log('Adding missing default modules...');

  const { businesses } = await businessRepository.findAll({}, 1, 100);
  if (!businesses.length) {
    console.log('No businesses found. Run npm run seed first.');
    process.exit(1);
  }

  for (const business of businesses) {
    const owner = (await userRepository.findByBusiness(business._id, { role: 'business_owner' }, 1, 1)).users[0];
    const createdBy = owner?._id || business._id;

    const result = await seedDefaultModules(business._id, createdBy, { skipExisting: true });
    console.log(
      `${business.name}: ${result.created} created, ${result.skipped} already existed (${result.total} templates)`
    );
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('seed:modules failed:', err);
  process.exit(1);
});
