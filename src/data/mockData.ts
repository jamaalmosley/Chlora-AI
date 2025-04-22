
import { User, Patient, Doctor, Admin, Appointment, Medication } from "@/types";

// Mock users for demo purposes
export const mockUsers: User[] = [
  {
    id: "p1",
    email: "patient@example.com",
    name: "John Doe",
    role: "patient",
    avatar: "/placeholder.svg",
  },
  {
    id: "d1",
    email: "doctor@example.com",
    name: "Dr. Sarah Smith",
    role: "doctor",
    avatar: "/placeholder.svg",
  },
  {
    id: "a1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    avatar: "/placeholder.svg",
  },
];

// Mock patients
export const mockPatients: Patient[] = [
  {
    id: "p1",
    email: "patient@example.com",
    name: "John Doe",
    role: "patient",
    avatar: "/placeholder.svg",
    dateOfBirth: "1980-05-15",
    phoneNumber: "555-123-4567",
    address: "123 Main St, Anytown, USA",
    emergencyContact: {
      name: "Jane Doe",
      relationship: "Spouse",
      phoneNumber: "555-987-6543",
    },
    medicalHistory: [
      "Appendectomy (2010)",
      "Hypertension (diagnosed 2015)",
      "Allergic to penicillin",
    ],
    upcomingAppointments: [
      {
        id: "a1",
        patientId: "p1",
        doctorId: "d1",
        date: "2025-05-01",
        time: "10:00 AM",
        status: "scheduled",
        type: "consultation",
      },
    ],
    pastAppointments: [
      {
        id: "a2",
        patientId: "p1",
        doctorId: "d1",
        date: "2025-03-15",
        time: "2:30 PM",
        status: "completed",
        type: "follow-up",
        notes: "Patient recovering well from procedure. Continue current medication.",
      },
    ],
    medications: [
      {
        id: "m1",
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: "2022-01-15",
        prescribedBy: "Dr. Sarah Smith",
      },
    ],
  },
  {
    id: "p2",
    email: "patient2@example.com",
    name: "Emily Johnson",
    role: "patient",
    avatar: "/placeholder.svg",
    dateOfBirth: "1992-09-23",
    phoneNumber: "555-234-5678",
    address: "456 Oak Ave, Somewhere, USA",
    medicalHistory: [
      "Asthma (diagnosed 2005)",
      "Fractured wrist (2018)",
    ],
    upcomingAppointments: [
      {
        id: "a3",
        patientId: "p2",
        doctorId: "d1",
        date: "2025-05-10",
        time: "11:30 AM",
        status: "scheduled",
        type: "follow-up",
      },
    ],
    medications: [
      {
        id: "m2",
        name: "Albuterol",
        dosage: "90mcg",
        frequency: "As needed",
        startDate: "2005-06-10",
        prescribedBy: "Dr. Sarah Smith",
      },
    ],
  },
];

// Mock doctors
export const mockDoctors: Doctor[] = [
  {
    id: "d1",
    email: "doctor@example.com",
    name: "Dr. Sarah Smith",
    role: "doctor",
    avatar: "/placeholder.svg",
    specialty: "Cardiology",
    licenseNumber: "MD12345",
    patients: ["p1", "p2"],
    schedule: {
      "2025-05-01": [
        {
          start: "9:00 AM",
          end: "9:30 AM",
          booked: false,
        },
        {
          start: "10:00 AM",
          end: "10:30 AM",
          booked: true,
          appointmentId: "a1",
        },
        {
          start: "11:00 AM",
          end: "11:30 AM",
          booked: false,
        },
      ],
      "2025-05-10": [
        {
          start: "9:00 AM",
          end: "9:30 AM",
          booked: false,
        },
        {
          start: "10:00 AM",
          end: "10:30 AM",
          booked: false,
        },
        {
          start: "11:00 AM",
          end: "11:30 AM",
          booked: true,
          appointmentId: "a3",
        },
      ],
    },
  },
  {
    id: "d2",
    email: "doctor2@example.com",
    name: "Dr. Michael Johnson",
    role: "doctor",
    avatar: "/placeholder.svg",
    specialty: "Orthopedics",
    licenseNumber: "MD54321",
    schedule: {
      "2025-05-01": [
        {
          start: "1:00 PM",
          end: "1:30 PM",
          booked: false,
        },
        {
          start: "2:00 PM",
          end: "2:30 PM",
          booked: false,
        },
      ],
    },
  },
];

// Mock admins
export const mockAdmins: Admin[] = [
  {
    id: "a1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    avatar: "/placeholder.svg",
    department: "Surgery Department",
  },
];

// Mock appointments (those not already included in patient records)
export const mockAppointments: Appointment[] = [
  // All appointments are already included in patient records
];

// Mock chat messages for patient chat
export const mockChatMessages: { [key: string]: any[] } = {
  "p1": [
    {
      id: "c1",
      sender: "user",
      content: "Hello, I've been experiencing some pain after my last visit.",
      timestamp: "2025-04-18T10:30:00",
    },
    {
      id: "c2",
      sender: "bot",
      content: "I'm sorry to hear that. Could you describe the pain and its location?",
      timestamp: "2025-04-18T10:31:00",
    },
    {
      id: "c3",
      sender: "user",
      content: "It's a dull pain in my lower abdomen, mostly on the right side.",
      timestamp: "2025-04-18T10:32:00",
    },
    {
      id: "c4",
      sender: "bot",
      content: "Thank you for that information. Based on your description, I'll notify Dr. Smith. In the meantime, avoid strenuous activity and apply a heating pad to the area if comfortable. Dr. Smith will follow up with you shortly.",
      timestamp: "2025-04-18T10:33:00",
    },
    {
      id: "c5",
      sender: "doctor",
      content: "Hello John, this is Dr. Smith. I've reviewed your recent messages. Let's schedule a brief follow-up. Could you come in tomorrow at 2 PM?",
      timestamp: "2025-04-18T11:15:00",
    },
  ],
};
