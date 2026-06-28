const slugify = require('slugify');
const store = require('../db/firestoreStore');
const { COLLECTIONS } = store;
const businessRepository = require('../repositories/businessRepository');
const userRepository = require('../repositories/userRepository');
const { planRepository, subscriptionRepository } = require('../repositories/firebaseRepositories');
const { seedDefaultModules } = require('../seeds/defaultModules');
const AppError = require('../utils/AppError');

class BusinessService {
  async getProfile(businessId) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new AppError('Business not found', 404);
    return business;
  }

  async updateProfile(businessId, data) {
    return businessRepository.update(businessId, data);
  }

  async listAll(query = {}) {
    const { page = 1, limit = 20, search } = query;
    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return businessRepository.findAll(filters, parseInt(page), parseInt(limit));
  }

  async getById(id) {
    const business = await businessRepository.findById(id);
    if (!business) throw new AppError('Business not found', 404);
    return business;
  }

  /** Super admin: create a business with owner account and default modules. */
  async create(data) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existingBusiness = await businessRepository.findBySlug(slug);
    if (existingBusiness) throw new AppError('Business name already taken', 409);

    const existingOwner = await userRepository.findByEmail(data.ownerEmail);
    if (existingOwner) throw new AppError('Owner email already registered', 409);

    const business = await businessRepository.create({
      name: data.name,
      slug,
      type: data.type,
      email: data.email,
      contactNumber: data.contactNumber || '',
      timezone: data.timezone || 'UTC',
    });

    const owner = await userRepository.create({
      email: data.ownerEmail,
      password: data.ownerPassword,
      firstName: data.ownerFirstName,
      lastName: data.ownerLastName,
      role: 'business_owner',
      businessId: business._id,
    });

    const starterPlan = await planRepository.findBySlug('professional');
    if (starterPlan) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      await subscriptionRepository.create({
        businessId: business._id,
        planId: starterPlan._id,
        status: 'trial',
        trialEndsAt: trialEnd,
      });
    }

    const { created, skipped } = await seedDefaultModules(business._id, owner._id);

    return {
      business,
      owner: {
        _id: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
      },
      modules: { created, skipped },
    };
  }

  /** Super admin: permanently delete a business and all related data. */
  async delete(id) {
    const business = await businessRepository.findById(id);
    if (!business) throw new AppError('Business not found', 404);

    const businessId = String(id);
    const users = await store.findAll(COLLECTIONS.users, { businessId });
    await Promise.all(
      users.map((user) => store.deleteMany(COLLECTIONS.refreshTokens, { userId: String(user._id) }))
    );

    await Promise.all([
      store.deleteMany(COLLECTIONS.users, { businessId }),
      store.deleteMany(COLLECTIONS.modules, { businessId }),
      store.deleteMany(COLLECTIONS.entries, { businessId }),
      store.deleteMany(COLLECTIONS.subscriptions, { businessId }),
      store.deleteMany(COLLECTIONS.rewards, { businessId }),
      store.deleteMany(COLLECTIONS.notifications, { businessId }),
      store.deleteMany(COLLECTIONS.reports, { businessId }),
      store.deleteMany(COLLECTIONS.auditLogs, { businessId }),
    ]);

    await businessRepository.deleteById(id);
    return { name: business.name };
  }
}

module.exports = new BusinessService();
