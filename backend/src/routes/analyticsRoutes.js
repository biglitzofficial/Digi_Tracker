const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize, tenantScope } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get(
  '/admin/business-comparison',
  authorize('super_admin'),
  analyticsController.getAdminBusinessComparison
);

router.get(
  '/admin/staff-performance',
  authorize('super_admin'),
  analyticsController.getAdminStaffPerformance
);

router.use(tenantScope, authorize('business_owner', 'super_admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/dashboard', analyticsController.getDashboard);
router.get('/growth', analyticsController.getGrowth);
router.get('/insights', analyticsController.getInsights);
router.get('/charts/:moduleId', analyticsController.getChartData);

module.exports = router;
