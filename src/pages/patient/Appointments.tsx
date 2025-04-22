
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient, Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Check, AlertCircle } from "lucide-react";

export default function PatientAppointments() {
  const { user } = useAuth();
  const patient = mockPatients.find(p => p.id === user?.id) as Patient | undefined;

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
        <p>Loading appointment data...</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <div 
      key={appointment.id} 
      className="flex items-center p-4 rounded-lg border border-gray-200 bg-white shadow-sm mb-3"
    >
      <div className={`mr-3 p-2 rounded-full ${
        appointment.status === "scheduled" 
          ? "bg-blue-100" 
          : appointment.status === "completed" 
          ? "bg-green-100" 
          : "bg-red-100"
      }`}>
        {appointment.status === "scheduled" ? (
          <Clock className={`h-5 w-5 ${
            appointment.status === "scheduled" ? "text-blue-600" : ""
          }`} />
        ) : appointment.status === "completed" ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">
          {appointment.type} with Dr. Smith
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDate(appointment.date)} at {appointment.time}</span>
        </div>
        {appointment.notes && (
          <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
        )}
      </div>
      <Button size="sm" variant="outline" className="ml-2">
        {appointment.status === "scheduled" ? "Details" : "View Summary"}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
        <p className="text-gray-600">
          View and manage your upcoming and past appointments
        </p>
      </div>
      
      <div className="flex justify-end mb-6">
        <Button className="bg-medical-primary hover:bg-medical-dark">
          Schedule New Appointment
        </Button>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {patient.upcomingAppointments && patient.upcomingAppointments.length > 0 ? (
            patient.upcomingAppointments.map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Upcoming Appointments
                  </h3>
                  <p className="text-gray-500 mb-4">
                    You don't have any upcoming appointments scheduled.
                  </p>
                  <Button className="bg-medical-primary hover:bg-medical-dark">
                    Schedule New Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {patient.pastAppointments && patient.pastAppointments.length > 0 ? (
            patient.pastAppointments.map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    No past appointment records found.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {[...(patient.upcomingAppointments || []), ...(patient.pastAppointments || [])].length > 0 ? (
            [...(patient.upcomingAppointments || []), ...(patient.pastAppointments || [])].map(renderAppointmentCard)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    No appointment records found.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
