export interface Permission {
  id: string;
  module: string;
  action: string;
  name?: string;
  description?: string;
  granted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: null | {
    id: string;
    name: string;
    permissions?: Permission[];
  };
}

export interface UserRole {
  id: string;
  name: string;
}
