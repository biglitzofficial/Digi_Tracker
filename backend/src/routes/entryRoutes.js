const { Router } = require('express');
const entryController = require('../controllers/entryController');
const { authenticate, authorize, tenantScope } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { requireActiveSubscription } = require('../middleware/subscription');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/today/status', entryController.getTodayStatus);
router.get('/history/me', entryController.getMyHistory);
router.get('/', entryController.listEntries);
router.get('/:id', entryController.getEntry);
router.post('/', authorize('staff', 'business_owner'), requireActiveSubscription, validate(schemas.createEntry), entryController.createEntry);
router.put('/:id', authorize('staff', 'business_owner'), requireActiveSubscription, validate(schemas.updateEntry), entryController.updateEntry);

module.exports = router;
