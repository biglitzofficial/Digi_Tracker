const { Router } = require('express');
const businessController = require('../controllers/businessController');
const { authenticate, authorize, tenantScope } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.get('/me', authorize('business_owner', 'staff'), tenantScope, businessController.getMyBusiness);
router.put('/me', authorize('business_owner'), tenantScope, validate(schemas.updateBusiness), businessController.updateMyBusiness);
router.get('/', authorize('super_admin'), businessController.listBusinesses);
router.post('/', authorize('super_admin'), validate(schemas.createBusiness), businessController.createBusiness);
router.get('/:id', authorize('super_admin'), businessController.getBusiness);

module.exports = router;
