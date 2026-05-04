export const ROLES = Object.freeze({
  SEEKER: 'seeker',
  PARENT: 'parent',
  OWNER: 'owner',
  ADMIN: 'admin',
});

const DASHBOARD_PATHS = Object.freeze({
  [ROLES.SEEKER]: '/seeker/dashboard',
  [ROLES.PARENT]: '/parent/dashboard',
  [ROLES.OWNER]: '/owner/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
});

export function roleDashboardPath(role) {
  return DASHBOARD_PATHS[role] ?? '/login';
}

export function roleLabel(role) {
  if (role === ROLES.SEEKER) return 'Seeker';
  if (role === ROLES.PARENT) return 'Parent';
  if (role === ROLES.OWNER) return 'Owner';
  if (role === ROLES.ADMIN) return 'Admin';
  return 'Guest';
}

export function isRoleAllowed(role, allowedRoles = []) {
  return allowedRoles.includes(role);
}
