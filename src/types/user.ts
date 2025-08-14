export interface User {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  } | null;
}

export interface UserRole {
  id: string;
  name: string;
}
