export interface SchoolGroup {
  id: string;
  level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  name: string;
  active: boolean;
  studentCount: number;
}

export interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  photoUrl?: string;
  authorized: boolean;
}

export interface StudentDetail {
  id: string;
  name: string;
  level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  grade?: string;
  groupId?: string;
  groupName?: string;
  birthday?: string;
  avatarUrl?: string;
  active: boolean;
  teacherNames: string[];
  familyMembers: FamilyMember[];
}

export interface TeacherUser {
  id: string;
  nombre: string;
  email: string;
  role: 'TEACHER' | 'ADMIN';
  level?: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  avatarUrl?: string;
  active: boolean;
  tempPassword?: boolean;
  lastLogin?: string;
  groups: SchoolGroup[];
}

export interface ParentUser {
  id: string;
  nombre: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  tempPassword?: boolean;
  lastLogin?: string;
  students: {
    id: string;
    name: string;
    level: string;
    groupName: string;
  }[];
}

export interface TeacherDeliveryMetric {
  teacherName: string;
  totalDelivered: number;
  avgTimeMinutes: number;
}

export interface KpisData {
  totalAlertsToday: number;
  totalDeliveredToday: number;
  pendingCount: number;
  urgentCount: number;
  avgPickupTimeMinutes: number;
  peakHour: string;
  alertsByLevel: Record<string, number>;
  alertsByMethod: Record<string, number>;
  teacherMetrics?: TeacherDeliveryMetric[];
}

export interface CsvImportResult {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  errorMessages: string[];
}
