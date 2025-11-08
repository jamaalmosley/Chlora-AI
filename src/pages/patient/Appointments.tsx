import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookAppointmentDialog } from "@/components/Patient/BookAppointmentDialog";

export default function PatientAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const { data: patientData } = useQuery({
    queryKey: ["patient", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [], isLoading, error: appointmentsError } = useQuery({
    queryKey: ["appointments", patientData?.id],
    queryFn: async () => {
      // Fetch appointments first
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientData?.id)
        .order("appointment_date", { ascending: true });
      
      if (appointmentsError) {
        console.error("Appointments fetch error:", appointmentsError);
        throw appointmentsError;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        return [];
      }

      // Fetch doctor and profile data for each appointment
      const appointmentsWithDoctors = await Promise.all(
        appointmentsData.map(async (apt) => {
          if (!apt.doctor_id) {
            return {
              ...apt,
              doctors: null
            };
          }

          // Fetch doctor data
          const { data: doctor } = await supabase
            .from("doctors")
            .select("id, user_id, specialty")
            .eq("id", apt.doctor_id)
            .single();

          if (doctor?.user_id) {
            // Fetch profile data
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", doctor.user_id)
              .single();

            return {
              ...apt,
              doctors: {
                ...doctor,
                profiles: profile || { first_name: "Unknown", last_name: "Doctor" }
              }
            };
          }

          return {
            ...apt,
            doctors: doctor ? {
              ...doctor,
              profiles: { first_name: "Unknown", last_name: "Doctor" }
            } : null
          };
        })
      );

      return appointmentsWithDoctors;
    },
    enabled: !!patientData?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
        <p>Loading appointments...</p>
      </div>
    );
  }

  if (appointmentsError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">
                Unable to load appointments. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderAppointmentCard = (appointment: any) => {
    const doctorName = appointment.doctors?.profiles
      ? `${appointment.doctors.profiles.first_name} ${appointment.doctors.profiles.last_name}`
      : "Doctor";
    
    return (
      <div 
        key={appointment.id} 
        className="flex items-center p-4 rounded-lg border bg-card shadow-sm mb-3"
      >
        <div className={`mr-3 p-2 rounded-full ${
          appointment.status === "scheduled" 
            ? "bg-primary/10" 
            : appointment.status === "completed" 
            ? "bg-green-100" 
            : "bg-red-100"
        }`}>
          {appointment.status === "scheduled" ? (
            <Clock className="h-5 w-5 text-primary" />
          ) : appointment.status === "completed" ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">
            {appointment.type} with Dr. {doctorName}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {format(new Date(appointment.appointment_date), "MMMM d, yyyy")} at{" "}
              {appointment.appointment_time}
            </span>
          </div>
          {appointment.notes && (
            <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="ml-2">
          {appointment.status === "scheduled" ? "Details" : "View Summary"}
        </Button>
      </div>
    );
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingAppointments = appointments.filter(
    (apt) => apt.appointment_date >= today && apt.status === "scheduled"
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.appointment_date < today || apt.status === "completed"
  );

  const handleAppointmentBooked = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  return (
    <>
      <BookAppointmentDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        onAppointmentBooked={handleAppointmentBooked}
      />
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
        <p className="text-gray-600">
          View and manage your upcoming and past appointments
        </p>
      </div>
      
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => setIsBookingDialogOpen(true)}
          className="bg-medical-primary hover:bg-medical-dark"
        >
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
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(renderAppointmentCard)
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
                  <Button 
                    onClick={() => setIsBookingDialogOpen(true)}
                    className="bg-medical-primary hover:bg-medical-dark"
                  >
                    Schedule New Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map(renderAppointmentCard)
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
          {appointments.length > 0 ? (
            appointments.map(renderAppointmentCard)
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
    </>
  );
}
