const store = require('../db/firestoreStore');
const { COLLECTIONS } = store;
const userRepository = require('./userRepository');
const moduleRepository = require('./moduleRepository');

async function populateEntry(entry) {
  if (!entry) return null;
  const [mod, user] = await Promise.all([
    moduleRepository.findById(entry.moduleId),
    userRepository.findById(entry.userId),
  ]);
  return {
    ...entry,
    moduleId: mod || entry.moduleId,
    userId: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email } : entry.userId,
  };
}

class EntryRepository {
  async findById(id) {
    return populateEntry(await store.findById(COLLECTIONS.entries, id));
  }

  async findByBusiness(businessId, filters = {}, page = 1, limit = 20) {
    const merged = { businessId: String(businessId), ...filters };
    const result = await store.find(COLLECTIONS.entries, merged, page, limit, 'entryDate', 'desc');
    const entries = await Promise.all(result.docs.map(populateEntry));
    return { entries, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  async findByModuleAndDate(businessId, moduleId, entryDate) {
    return store.findOne(COLLECTIONS.entries, {
      businessId: String(businessId),
      moduleId: String(moduleId),
      entryDate,
    });
  }

  async create(data) {
    const entry = await store.create(COLLECTIONS.entries, {
      ...data,
      businessId: String(data.businessId),
      moduleId: String(data.moduleId),
      userId: String(data.userId),
      isEdited: false,
      editCount: 0,
    });
    return this.findById(entry._id);
  }

  async update(id, data) {
    await store.updateById(COLLECTIONS.entries, id, data);
    return this.findById(id);
  }

  async countByBusiness(businessId) {
    return store.count(COLLECTIONS.entries, { businessId: String(businessId) });
  }

  async findByDateRange(businessId, moduleId, startDate, endDate) {
    return store.findAll(COLLECTIONS.entries, {
      businessId: String(businessId),
      moduleId: String(moduleId),
      entryDate: { $gte: startDate, $lte: endDate },
    }, { sortField: 'entryDate', sortDir: 'asc' });
  }

  /** Raw entries for analytics — no per-entry population (much faster). */
  async findByBusinessDateRange(businessId, startDate, endDate) {
    return store.findAll(COLLECTIONS.entries, {
      businessId: String(businessId),
      entryDate: { $gte: startDate, $lte: endDate },
    }, { sortField: 'entryDate', sortDir: 'asc' });
  }

  async findByUser(businessId, userId, page = 1, limit = 20) {
    return this.findByBusiness(String(businessId), { userId: String(userId) }, page, limit);
  }
}

module.exports = new EntryRepository();
