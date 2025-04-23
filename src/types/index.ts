
export interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  notes?: string;
  status?: string;
  patientId?: string;
  doctorId?: string;
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
  avatar?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  phoneNumber?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    phoneNumber?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: Medication[];
  upcomingAppointments?: Appointment[];
  pastAppointments?: Appointment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  specialty: string;
  licenseNumber: string;
  patients?: string[];
  schedule?: Record<string, Array<{
    start: string;
    end: string;
    booked: boolean;
    appointmentId?: string;
  }>>;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'doctor';
  content: string;
  timestamp: string;
}
