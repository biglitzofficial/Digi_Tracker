const store = require('../db/firestoreStore');
const { COLLECTIONS } = store;

class BusinessRepository {
  async findById(id) {
    return store.findById(COLLECTIONS.businesses, id);
  }

  async findBySlug(slug) {
    return store.findOne(COLLECTIONS.businesses, { slug });
  }

  async create(data) {
    return store.create(COLLECTIONS.businesses, data);
  }

  async update(id, data) {
    return store.updateById(COLLECTIONS.businesses, id, data);
  }

  async findAll(filters = {}, page = 1, limit = 20) {
    const result = await store.find(COLLECTIONS.businesses, filters, page, limit);
    return { businesses: result.docs, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  async deleteById(id) {
    return store.deleteById(COLLECTIONS.businesses, id);
  }
}

module.exports = new BusinessRepository();
