export interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  refillsRemaining: number;
  instructions: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  role: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: Medication[];
  upcomingAppointments?: Appointment[];
  pastAppointments?: Appointment[];
}
