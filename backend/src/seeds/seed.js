require('dotenv').config();
const connectDB = require('../config/database');
const store = require('../db/firestoreStore');
const { COLLECTIONS } = store;
const userRepository = require('../repositories/userRepository');
const businessRepository = require('../repositories/businessRepository');
const moduleRepository = require('../repositories/moduleRepository');
const entryRepository = require('../repositories/entryRepository');
const { planRepository, subscriptionRepository } = require('../repositories/firebaseRepositories');
const { seedDefaultModules } = require('./defaultModules');
const { startOfDay } = require('../utils/dateUtils');

const plans = [
  {
    name: 'Starter',
    slug: 'starter',
    price: 29,
    limits: { maxStaff: 3, maxModules: 5, maxEntriesPerMonth: 500 },
    features: {
      maxStaff: 3, maxModules: 5, maxBranches: 1,
      analytics: true, reports: false, customModules: false,
      rewards: true, whiteLabel: false, apiAccess: false,
    },
  },
  {
    name: 'Professional',
    slug: 'professional',
    price: 79,
    limits: { maxStaff: 15, maxModules: 20, maxEntriesPerMonth: 5000 },
    features: {
      maxStaff: 15, maxModules: 20, maxBranches: 3,
      analytics: true, reports: true, customModules: true,
      rewards: true, whiteLabel: false, apiAccess: false,
    },
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: 199,
    limits: { maxStaff: 100, maxModules: 999, maxEntriesPerMonth: 999999 },
    features: {
      maxStaff: 100, maxModules: 999, maxBranches: 50,
      analytics: true, reports: true, customModules: true,
      rewards: true, whiteLabel: true, apiAccess: true, prioritySupport: true,
    },
  },
];

async function clearAll() {
  for (const col of Object.values(COLLECTIONS)) {
    await store.clearCollection(col);
  }
}

async function seed() {
  await connectDB();
  console.log('Seeding Firestore...');

  await clearAll();

  for (const plan of plans) {
    await planRepository.create(plan);
  }
  console.log('Plans seeded');

  const superAdmin = await userRepository.create({
    email: 'superadmin@digitracker.com',
    password: 'SuperAdmin@123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
  });
  console.log('Super Admin created:', superAdmin.email);

  const business = await businessRepository.create({
    name: 'Fitness Pro Gym',
    slug: 'fitness-pro-gym',
    type: 'gym',
    email: 'owner@fitnesspro.com',
    contactNumber: '+1234567890',
    timezone: 'America/New_York',
    address: { city: 'New York', state: 'NY', country: 'USA' },
    onboardingCompleted: true,
  });

  const owner = await userRepository.create({
    email: 'owner@fitnesspro.com',
    password: 'Owner@123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'business_owner',
    businessId: business._id,
  });

  const staff = await userRepository.create({
    email: 'staff@fitnesspro.com',
    password: 'Staff@123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'staff',
    businessId: business._id,
    rewardPoints: 120,
    currentStreak: 5,
    longestStreak: 12,
  });

  const proPlan = await planRepository.findBySlug('professional');
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  await subscriptionRepository.create({
    businessId: business._id,
    planId: proPlan._id,
    status: 'trial',
    trialEndsAt: trialEnd,
  });

  await seedDefaultModules(business._id, owner._id);

  const modules = await moduleRepository.findByBusiness(business._id);
  const instagram = modules.find((m) => m.slug === 'instagram');
  const whatsapp = modules.find((m) => m.slug === 'whatsapp-community');

  for (let i = 30; i >= 0; i--) {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - i);

    const igFollowers = 1000 + (30 - i) * 15 + Math.floor(Math.random() * 10);
    await entryRepository.create({
      businessId: business._id,
      moduleId: instagram._id,
      userId: staff._id,
      entryDate: date,
      values: [
        { fieldId: 'followers', fieldSlug: 'followers', value: igFollowers },
        { fieldId: 'accounts_reached', fieldSlug: 'accounts_reached', value: igFollowers * 3 },
        { fieldId: 'profile_visits', fieldSlug: 'profile_visits', value: Math.floor(igFollowers * 0.2) },
      ],
    });

    const waMembers = 500 + (30 - i) * 8;
    await entryRepository.create({
      businessId: business._id,
      moduleId: whatsapp._id,
      userId: staff._id,
      entryDate: date,
      values: [
        { fieldId: 'community_members', fieldSlug: 'community_members', value: waMembers },
        { fieldId: 'new_members_joined', fieldSlug: 'new_members_joined', value: Math.floor(Math.random() * 15) + 2 },
      ],
    });
  }

  console.log('Sample entries seeded (31 days)');
  console.log('\n--- Seed Complete ---');
  console.log('Super Admin: superadmin@digitracker.com / SuperAdmin@123');
  console.log('Owner:       owner@fitnesspro.com / Owner@123');
  console.log('Staff:       staff@fitnesspro.com / Staff@123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
