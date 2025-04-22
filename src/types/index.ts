
export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  medicalHistory?: string[];
  upcomingAppointments?: Appointment[];
  pastAppointments?: Appointment[];
  medications?: Medication[];
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  licenseNumber: string;
  patients?: string[];
  schedule?: {
    [key: string]: TimeSlot[];
  };
}

export interface Admin extends User {
  role: 'admin';
  department: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'consultation' | 'surgery' | 'follow-up';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  booked: boolean;
  appointmentId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'doctor';
  content: string;
  timestamp: string;
}
