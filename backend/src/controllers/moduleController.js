const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { moduleService } = require('../services');

const listModules = asyncHandler(async (req, res) => {
  const modules = await moduleService.list(req.businessId, req.query);
  sendSuccess(res, modules);
});

const getModule = asyncHandler(async (req, res) => {
  const mod = await moduleService.getById(req.businessId, req.params.id);
  sendSuccess(res, mod);
});

const createModule = asyncHandler(async (req, res) => {
  const mod = await moduleService.create(req.businessId, req.user._id, req.body);
  sendSuccess(res, mod, 'Module created', 201);
});

const updateModule = asyncHandler(async (req, res) => {
  const mod = await moduleService.update(req.businessId, req.params.id, req.body);
  sendSuccess(res, mod, 'Module updated');
});

const deleteModule = asyncHandler(async (req, res) => {
  await moduleService.deactivate(req.businessId, req.params.id);
  sendSuccess(res, null, 'Module deactivated');
});

module.exports = { listModules, getModule, createModule, updateModule, deleteModule };
