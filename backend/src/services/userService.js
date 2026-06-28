const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId, data) {
    const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'fcmToken'];
    const update = {};
    allowed.forEach((key) => { if (data[key] !== undefined) update[key] = data[key]; });
    return userRepository.update(userId, update);
  }

  async listStaff(businessId, query = {}) {
    const { page = 1, limit = 20, search, isActive } = query;
    const filters = { role: { $in: ['staff', 'business_owner'] } };
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) {
      filters.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return userRepository.findByBusiness(businessId, filters, parseInt(page), parseInt(limit));
  }

  async createStaff(businessId, data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409);

    return userRepository.create({
      ...data,
      businessId,
      role: 'staff',
    });
  }

  async updateStaff(businessId, staffId, data) {
    const user = await userRepository.findById(staffId);
    if (!user || user.businessId?.toString() !== businessId) {
      throw new AppError('Staff member not found', 404);
    }

    const allowed = ['firstName', 'lastName', 'phone', 'isActive'];
    const update = {};
    allowed.forEach((key) => { if (data[key] !== undefined) update[key] = data[key]; });
    return userRepository.update(staffId, update);
  }

  async deactivateStaff(businessId, staffId, actorRole) {
    const user = await userRepository.findById(staffId);
    if (!user || user.businessId?.toString() !== businessId) {
      throw new AppError('Staff member not found', 404);
    }
    if (user.role === 'business_owner' && actorRole !== 'super_admin') {
      throw new AppError('Cannot deactivate business owner', 403);
    }
    return userRepository.update(staffId, { isActive: false });
  }
}

module.exports = new UserService();
