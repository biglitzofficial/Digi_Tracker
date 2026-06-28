const { Router } = require('express');
const moduleController = require('../controllers/moduleController');
const { authenticate, authorize, tenantScope, resolveBusinessContext } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = Router();

router.use(authenticate, tenantScope, resolveBusinessContext);

router.get('/', moduleController.listModules);
router.get('/:id', moduleController.getModule);
router.post('/', authorize('business_owner', 'super_admin'), validate(schemas.createModule), moduleController.createModule);
router.put('/:id', authorize('business_owner', 'super_admin'), validate(schemas.updateModule), moduleController.updateModule);
router.delete('/:id', authorize('business_owner', 'super_admin'), moduleController.deleteModule);

module.exports = router;
