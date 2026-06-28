const { asyncHandler, sendSuccess, sendPaginated } = require('../utils/helpers');
const { businessService } = require('../services');

const getMyBusiness = asyncHandler(async (req, res) => {
  const business = await businessService.getProfile(req.businessId);
  sendSuccess(res, business);
});

const updateMyBusiness = asyncHandler(async (req, res) => {
  const business = await businessService.updateProfile(req.businessId, req.body);
  sendSuccess(res, business, 'Business updated');
});

const listBusinesses = asyncHandler(async (req, res) => {
  const result = await businessService.listAll(req.query);
  sendPaginated(res, result.businesses, {
    total: result.total, page: result.page, limit: result.limit, pages: result.pages,
  });
});

const getBusiness = asyncHandler(async (req, res) => {
  const business = await businessService.getById(req.params.id);
  sendSuccess(res, business);
});

const createBusiness = asyncHandler(async (req, res) => {
  const result = await businessService.create(req.body);
  sendSuccess(res, result, 'Business created with default modules', 201);
});

const deleteBusiness = asyncHandler(async (req, res) => {
  const result = await businessService.delete(req.params.id);
  sendSuccess(res, result, `Business "${result.name}" deleted`);
});

module.exports = { getMyBusiness, updateMyBusiness, listBusinesses, getBusiness, createBusiness, deleteBusiness };
