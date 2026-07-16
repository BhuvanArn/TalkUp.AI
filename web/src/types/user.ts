export interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Org role from GET /auth/status: admin | employee | user | none (B4). */
  role?: string | null;
  organizationId?: string | null;
}
