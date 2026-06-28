const slugify = require('slugify');
const moduleRepository = require('../repositories/moduleRepository');
const { seedDefaultModules } = require('../seeds/defaultModules');
const AppError = require('../utils/AppError');

class ModuleService {
  async list(businessId, query = {}) {
    const modules = await moduleRepository.findByBusiness(businessId, {});

    const wantActive = query.isActive === 'true' || query.isActive === true;
    const wantInactive = query.isActive === 'false' || query.isActive === false;

    if (wantActive) return modules.filter((m) => m.isActive !== false);
    if (wantInactive) return modules.filter((m) => m.isActive === false);
    return modules;
  }

  async getById(businessId, moduleId) {
    const mod = await moduleRepository.findById(moduleId);
    if (!mod || mod.businessId.toString() !== businessId) {
      throw new AppError('Module not found', 404);
    }
    return mod;
  }

  async create(businessId, userId, data) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existing = await moduleRepository.findBySlug(businessId, slug);
    if (existing) throw new AppError('Module with this name already exists', 409);

    const fields = data.fields.map((field, index) => ({
      ...field,
      slug: field.slug || slugify(field.name, { lower: true, strict: true }),
      order: field.order ?? index,
    }));

    return moduleRepository.create({
      businessId,
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      color: data.color,
      fields,
      createdBy: userId,
      isActive: true,
      isDefault: false,
    });
  }

  async update(businessId, moduleId, data) {
    const mod = await this.getById(businessId, moduleId);

    if (data.fields) {
      data.fields = data.fields.map((field, index) => ({
        ...field,
        slug: field.slug || slugify(field.name, { lower: true, strict: true }),
        order: field.order ?? index,
      }));
    }

    if (data.name && data.name !== mod.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    return moduleRepository.update(moduleId, data);
  }

  async deactivate(businessId, moduleId) {
    await this.getById(businessId, moduleId);
    return moduleRepository.update(moduleId, { isActive: false });
  }

  async seedDefaults(businessId, userId) {
    if (!businessId) throw new AppError('No business context', 403);
    return seedDefaultModules(businessId, userId, { skipExisting: true });
  }
}

module.exports = new ModuleService();
