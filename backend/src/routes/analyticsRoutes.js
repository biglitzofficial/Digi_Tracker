const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize, tenantScope } = require('../middleware/auth');

const router = Router();

router.use(authenticate, tenantScope, authorize('business_owner', 'super_admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/dashboard', analyticsController.getDashboard);
router.get('/growth', analyticsController.getGrowth);
router.get('/insights', analyticsController.getInsights);
router.get('/charts/:moduleId', analyticsController.getChartData);

module.exports = router;
