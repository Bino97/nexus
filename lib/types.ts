// User types
export interface User {
  id: string;
  username: string;
  name: string | null;
  password_hash: string;
  is_admin: number;
  is_active: number;
  must_change_password: number;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
  created_by: string | null;
}

export interface UserWithoutPassword {
  id: string;
  username: string;
  name: string | null;
  is_admin: number;
  is_active: number;
  must_change_password: number;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
  created_by: string | null;
}

// Application types
export interface Application {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string;
  icon: string | null;
  color: string | null;
  is_active: number;
  sort_order: number;
  uses_nexus_auth: number;
  health_check_enabled: number;
  health_status: 'online' | 'offline' | 'unknown';
  last_health_check: number | null;
  created_at: number;
  updated_at: number;
}

// User App Access
export interface UserAppAccess {
  user_id: string;
  app_id: string;
  granted_at: number;
  granted_by: string | null;
}

// Audit Log
export interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: number;
}

// Settings
export interface Setting {
  key: string;
  value: string;
  updated_at: number;
}

// JWT Token payload
export interface NexusTokenPayload {
  sub: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  mustChangePassword: boolean;
  apps: string[];
  iat: number;
  exp: number;
}

// API Request/Response types
export interface CreateUserRequest {
  username: string;
  name?: string;
  password: string;
  is_admin?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  is_admin?: boolean;
  is_active?: boolean;
  must_change_password?: boolean;
}

export interface CreateAppRequest {
  name: string;
  slug: string;
  description?: string;
  base_url: string;
  icon?: string;
  color?: string;
  uses_nexus_auth?: boolean;
}

export interface UpdateAppRequest {
  name?: string;
  slug?: string;
  description?: string;
  base_url?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
  uses_nexus_auth?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Session user (what we store in context/headers)
export interface SessionUser {
  id: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  mustChangePassword: boolean;
  apps: string[];
}
