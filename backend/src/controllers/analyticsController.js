const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { analyticsService } = require('../services');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboard(req.businessId);
  sendSuccess(res, data);
});

const getGrowth = asyncHandler(async (req, res) => {
  const data = await analyticsService.getGrowth(req.businessId, req.query);
  sendSuccess(res, data);
});

const getInsights = asyncHandler(async (req, res) => {
  const data = await analyticsService.getInsights(req.businessId);
  sendSuccess(res, data);
});

const getChartData = asyncHandler(async (req, res) => {
  const data = await analyticsService.getChartData(req.businessId, req.params.moduleId, req.query);
  sendSuccess(res, data);
});

const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.businessId);
  sendSuccess(res, data);
});

module.exports = { getDashboard, getGrowth, getInsights, getChartData, getOverview };
