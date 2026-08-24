export type UserRole = 'PARENT' | 'TEACHER' | 'ADMIN';

export interface AuthUserModel {
  userId: string;
  email: string;
  nombre: string;
  role: UserRole;
  token?: string;
  studentIds?: string[];
  level?: string;
  groups?: string[];
  avatar?: string;
  tempPassword?: boolean;
}
