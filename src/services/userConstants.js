// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

// User status
export const USER_STATUS = {
  ACTIVE: 'active',
  BANNED: 'banned'
};

// Provider types
export const PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook'
};

// Role labels for display
export const ROLE_LABELS = {
  [USER_ROLES.STUDENT]: 'Học viên',
  [USER_ROLES.ADMIN]: 'Quản trị viên'
};

// Status labels for display
export const STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Hoạt động',
  [USER_STATUS.BANNED]: 'Bị cấm'
};

// Provider labels for display
export const PROVIDER_LABELS = {
  [PROVIDERS.LOCAL]: 'Email',
  [PROVIDERS.GOOGLE]: 'Google',
  [PROVIDERS.FACEBOOK]: 'Facebook'
};