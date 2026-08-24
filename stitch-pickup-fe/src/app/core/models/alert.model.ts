export type AlertStatus = 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
export type PickupMethod = 'CAR' | 'WALK';
export type LocalAlertState = 'IDLE' | 'SENDING' | 'QUEUED' | 'CONFIRMED' | 'ERROR';

export interface CreateAlertDto {
  studentId: string;
  status: AlertStatus;
  pickupMethod: PickupMethod;
  clientId?: string;
}

export interface AlertResponse {
  id: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  level: string;
  groupName: string;
  status: AlertStatus;
  pickupMethod: PickupMethod;
  clientId?: string;
  sentAt: string;
  receivedAt?: string;
}

export interface StudentAlertStatus {
  studentId: string;
  lastStatus?: AlertStatus;
  pickupMethod: PickupMethod;
  state: LocalAlertState;
  updatedAt: string;
  errorMessage?: string;
}
