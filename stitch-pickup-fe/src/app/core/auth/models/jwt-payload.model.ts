export interface JwtPayloadModel {
  sub: string;        // email
  userId: string;
  role: 'PARENT' | 'TEACHER' | 'ADMIN';
  nombre: string;
  studentIds?: string[];
  level?: string;
  groups?: string[];
  tempPassword?: boolean;
  iat: number;
  exp: number;
}
