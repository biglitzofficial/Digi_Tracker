const userService = require('./userService');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

jest.mock('../repositories/userRepository');

describe('UserService staff limit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects creating a second active staff member', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.findByBusiness.mockResolvedValue({ users: [{}], total: 1, page: 1, limit: 1, pages: 1 });

    await expect(
      userService.createStaff('biz1', {
        email: 'new@test.com',
        password: 'Password1',
        firstName: 'New',
        lastName: 'Staff',
      })
    ).rejects.toThrow(AppError);

    await expect(
      userService.createStaff('biz1', {
        email: 'new@test.com',
        password: 'Password1',
        firstName: 'New',
        lastName: 'Staff',
      })
    ).rejects.toThrow('one staff member');
  });

  it('allows creating staff when none exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.findByBusiness.mockResolvedValue({ users: [], total: 0, page: 1, limit: 1, pages: 0 });
    userRepository.create.mockResolvedValue({ _id: 'u1', role: 'staff' });

    const user = await userService.createStaff('biz1', {
      email: 'new@test.com',
      password: 'Password1',
      firstName: 'New',
      lastName: 'Staff',
    });

    expect(user.role).toBe('staff');
    expect(userRepository.create).toHaveBeenCalled();
  });
});
