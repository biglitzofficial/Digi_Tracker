const { asyncHandler, sendSuccess, sendPaginated } = require('../utils/helpers');
const { userService } = require('../services');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  sendSuccess(res, user);
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  sendSuccess(res, user, 'Profile updated');
});

const registerFcmToken = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, { fcmToken: req.body.fcmToken });
  sendSuccess(res, { registered: Boolean(user.fcmToken) }, 'FCM token registered');
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listStaff(req.businessId, req.query);
  sendPaginated(res, result.users, {
    total: result.total, page: result.page, limit: result.limit, pages: result.pages,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createStaff(req.businessId, req.body);
  sendSuccess(res, user, 'Staff member created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateStaff(req.businessId, req.params.id, req.body);
  sendSuccess(res, user, 'Staff member updated');
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deactivateStaff(req.businessId, req.params.id, req.user.role);
  sendSuccess(res, null, 'Staff member deactivated');
});

module.exports = { getMe, updateMe, listUsers, createUser, updateUser, deleteUser, registerFcmToken };
