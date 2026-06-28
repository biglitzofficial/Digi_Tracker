const entryRepository = require('../repositories/entryRepository');
const moduleRepository = require('../repositories/moduleRepository');
const userRepository = require('../repositories/userRepository');
const rewardService = require('./rewardService');
const auditLogRepository = require('../repositories/auditLogRepository');
const { startOfDay } = require('../utils/dateUtils');
const AppError = require('../utils/AppError');

class EntryService {
  async list(businessId, query = {}) {
    const { page = 1, limit = 20, moduleId, userId, startDate, endDate } = query;
    const filters = {};
    if (moduleId) filters.moduleId = moduleId;
    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.entryDate = {};
      if (startDate) filters.entryDate.$gte = startOfDay(new Date(startDate));
      if (endDate) filters.entryDate.$lte = startOfDay(new Date(endDate));
    }
    return entryRepository.findByBusiness(businessId, filters, parseInt(page), parseInt(limit));
  }

  async getById(businessId, entryId) {
    const entry = await entryRepository.findById(entryId);
    if (!entry || String(entry.businessId) !== String(businessId)) {
      throw new AppError('Entry not found', 404);
    }
    return entry;
  }

  async create(businessId, userId, data, ipAddress) {
    const mod = await moduleRepository.findById(data.moduleId);
    if (!mod || String(mod.businessId) !== String(businessId) || !mod.isActive) {
      throw new AppError('Module not found or inactive', 404);
    }

    const entryDate = startOfDay(new Date(data.entryDate));
    const existing = await entryRepository.findByModuleAndDate(businessId, data.moduleId, entryDate);
    if (existing) throw new AppError('Entry already exists for this date and module', 409);

    this._validateFields(mod, data.values);

    const values = data.values.map((v) => {
      const field = mod.fields.find((f) => f.slug === v.fieldSlug);
      return { fieldId: field.slug, fieldSlug: v.fieldSlug, value: v.value };
    });

    const entry = await entryRepository.create({
      businessId,
      moduleId: data.moduleId,
      userId,
      entryDate,
      values,
      notes: data.notes || '',
    });

    await auditLogRepository.create({
      businessId,
      entryId: entry._id,
      userId,
      action: 'create',
      newValues: values,
      ipAddress,
    });

    await rewardService.processDailyEntry(businessId, userId);

    return entryRepository.findById(entry._id);
  }

  async update(businessId, entryId, userId, data, ipAddress, userRole) {
    const entry = await this.getById(businessId, entryId);

    const entryUserId = typeof entry.userId === 'object' ? entry.userId._id : entry.userId;
    if (userRole === 'staff' && String(entryUserId) !== String(userId)) {
      throw new AppError('You can only edit your own entries', 403);
    }

    const today = startOfDay(new Date());
    const entryDay = startOfDay(entry.entryDate);
    if (entryDay.getTime() !== today.getTime() && userRole === 'staff') {
      throw new AppError('Staff can only edit same-day entries', 403);
    }

    const mod = await moduleRepository.findById(typeof entry.moduleId === 'object' ? entry.moduleId._id : entry.moduleId);
    if (data.values) {
      this._validateFields(mod, data.values);
      data.values = data.values.map((v) => {
        const field = mod.fields.find((f) => f.slug === v.fieldSlug);
        return { fieldId: field.slug, fieldSlug: v.fieldSlug, value: v.value };
      });
    }

    const previousValues = entry.values;
    const updated = await entryRepository.update(entryId, {
      ...data,
      isEdited: true,
      editCount: entry.editCount + 1,
    });

    await auditLogRepository.create({
      businessId,
      entryId,
      userId,
      action: 'update',
      previousValues,
      newValues: data.values || previousValues,
      ipAddress,
    });

    if (userRole === 'staff') {
      await rewardService.processAccuracyBonus(businessId, userId);
    }

    return entryRepository.findById(updated._id);
  }

  async getMyHistory(businessId, userId, query = {}) {
    const { page = 1, limit = 20 } = query;
    return entryRepository.findByUser(businessId, userId, parseInt(page), parseInt(limit));
  }

  async getTodayStatus(businessId, userId) {
    const today = startOfDay(new Date());
    const modules = await moduleRepository.findByBusiness(businessId, { isActive: true });
    const { entries } = await entryRepository.findByBusiness(
      businessId,
      { userId, entryDate: today },
      1,
      100
    );

    const entryByModule = new Map(
      entries.map((e) => [e.moduleId._id?.toString() || e.moduleId.toString(), e])
    );

    const status = modules.map((mod) => {
      const entry = entryByModule.get(mod._id.toString());
      return {
        moduleId: mod._id,
        name: mod.name,
        slug: mod.slug,
        icon: mod.icon,
        color: mod.color,
        submitted: Boolean(entry),
        entryId: entry?._id || null,
      };
    });

    const submitted = status.filter((s) => s.submitted).length;
    return {
      date: today,
      total: status.length,
      submitted,
      pending: status.length - submitted,
      completionRate: status.length ? Math.round((submitted / status.length) * 100) : 0,
      modules: status,
    };
  }

  _validateFields(mod, values) {
    const requiredFields = mod.fields.filter((f) => f.required && f.isActive);
    for (const field of requiredFields) {
      const submitted = values.find((v) => v.fieldSlug === field.slug);
      if (!submitted || submitted.value === '' || submitted.value === null) {
        throw new AppError(`Field "${field.name}" is required`, 400);
      }
    }

    for (const val of values) {
      const field = mod.fields.find((f) => f.slug === val.fieldSlug);
      if (!field) throw new AppError(`Unknown field: ${val.fieldSlug}`, 400);

      if (['number', 'currency', 'percentage'].includes(field.type)) {
        const num = parseFloat(val.value);
        if (isNaN(num)) {
          throw new AppError(`Field "${field.name}" must be a number`, 400);
        }
        if (field.type === 'percentage') {
          if (num < 0 || num > 100) {
            throw new AppError(`Field "${field.name}" must be between 0 and 100`, 400);
          }
        } else if (num < 0) {
          throw new AppError(`Field "${field.name}" cannot be negative`, 400);
        }
        continue;
      }
      if (field.type === 'boolean' && typeof val.value !== 'boolean') {
        throw new AppError(`Field "${field.name}" must be true or false`, 400);
      }
      if (field.type === 'dropdown' && field.options.length && !field.options.includes(val.value)) {
        throw new AppError(`Field "${field.name}" must be one of: ${field.options.join(', ')}`, 400);
      }
    }
  }
}

module.exports = new EntryService();
