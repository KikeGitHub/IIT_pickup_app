export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  photoUrl?: string;
  authorized: boolean;
}

export interface Student {
  id: string;
  name: string;
  level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  grade: string;
  groupName: string;
  birthday?: string;
  gender?: 'M' | 'F' | string;
  curp?: string;
  avatarUrl?: string;
  familyMembers: FamilyMember[];
}
