
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient, Appointment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function PatientDashboard() {
  const { user } = useAuth();
  const patient = mockPatients.find(p => p.id === user?.id) as Patient | undefined;

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
        <p>Loading patient data...</p>
      </div>
    );
  }

  const nextAppointment = patient.upcomingAppointments?.[0];
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <div className="flex items-center p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="mr-3 bg-medical-light p-2 rounded-full">
        <Calendar className="h-5 w-5 text-medical-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{appointment.type} with Dr. Smith</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatDate(appointment.date)} at {appointment.time}</span>
        </div>
      </div>
      <Button size="sm" variant="outline" className="ml-2">
        Details
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {patient.name}</h1>
        <p className="text-gray-600">
          Here's your health overview and upcoming appointments
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-medical-primary" />
              Upcoming Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div>
                <p className="font-medium">{nextAppointment.type}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(nextAppointment.date)} at {nextAppointment.time}
                </p>
                <div className="mt-3">
                  <Link to="/patient/appointments">
                    <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                      View All Appointments
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No upcoming appointments</p>
                <div className="mt-3">
                  <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                    Schedule New Appointment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <FileText className="h-5 w-5 mr-2 text-medical-primary" />
              Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              Access your medical records, test results, and history
            </p>
            <Link to="/patient/records">
              <Button size="sm" variant="outline" className="w-full">
                View Medical Records
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-medical-primary" />
              Medical Assistance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              Have questions? Our AI assistant is here to help
            </p>
            <Link to="/patient/chat">
              <Button size="sm" className="w-full bg-medical-secondary hover:bg-medical-primary">
                Chat with Assistant
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Health Summary</CardTitle>
              <CardDescription>
                Key information about your health status and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Medications</h3>
                  {patient.medications && patient.medications.length > 0 ? (
                    <ul className="mt-1 space-y-2">
                      {patient.medications.map(med => (
                        <li key={med.id} className="p-2 bg-gray-50 rounded-md">
                          <div className="font-medium">{med.name} ({med.dosage})</div>
                          <div className="text-sm text-gray-500">{med.frequency}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic">No current medications</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Medical History</h3>
                  {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                    <ul className="mt-1 list-disc list-inside">
                      {patient.medicalHistory.map((item, i) => (
                        <li key={i} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic">No medical history recorded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-medical-primary" />
                My Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                  <img src="/placeholder.svg" alt="Dr. Sarah Smith" />
                </div>
                <h3 className="font-medium text-lg">Dr. Sarah Smith</h3>
                <p className="text-sm text-gray-500 mb-3">Cardiology</p>
                <Button variant="outline" size="sm" className="w-full mb-2">
                  View Profile
                </Button>
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
