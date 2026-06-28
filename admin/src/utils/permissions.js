export const ROLES = {
  STAFF: 'staff',
  OWNER: 'business_owner',
  SUPER_ADMIN: 'super_admin',
};

export function isStaff(user) {
  return user?.role === ROLES.STAFF;
}

export function isOwner(user) {
  return user?.role === ROLES.OWNER;
}

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN;
}

/** Owner and super admin can manage business settings, staff, modules, etc. */
export function canManageBusiness(user) {
  return isOwner(user) || isSuperAdmin(user);
}

export const MANAGER_ROLES = [ROLES.OWNER, ROLES.SUPER_ADMIN];
