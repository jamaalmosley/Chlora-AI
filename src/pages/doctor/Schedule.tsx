
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { NewAppointmentDialog } from "@/components/Appointments/NewAppointmentDialog";

interface Appointment {
  id: string;
  appointment_time: string;
  type: string;
  status: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

const DoctorSchedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  // Define time slots for the schedule
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user) return;
      
      try {
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (doctorError) throw doctorError;
        setDoctorData(doctor);
      } catch (error) {
        console.error('Error loading doctor data:', error);
      }
    };

    if (user) {
      loadDoctorData();
    }
  }, [user]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!date || !doctorData) return;
      
      setIsLoading(true);
      
      try {
        const selectedDate = format(date, 'yyyy-MM-dd');
        
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorData.id)
          .eq('appointment_date', selectedDate)
          .order('appointment_time', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Get patient data for each appointment
        const appointmentsWithPatients = await Promise.all(
          (appointmentsData || []).map(async (apt) => {
            const { data: patient } = await supabase
              .from('patients')
              .select('user_id')
              .eq('id', apt.patient_id)
              .single();

            if (patient) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', patient.user_id)
                .single();

              return {
                ...apt,
                patient: {
                  user: profile || { first_name: '', last_name: '' }
                }
              };
            }

            return {
              ...apt,
              patient: { user: { first_name: '', last_name: '' } }
            };
          })
        );

        setAppointments(appointmentsWithPatients);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (date && doctorData) {
      loadAppointments();
    }
  }, [date, doctorData]);

  const getAppointmentForTimeSlot = (time: string) => {
    return appointments.find(app => app.appointment_time === time);
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      
      toast({
        title: "Appointment deleted",
        description: "The appointment has been successfully removed.",
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddAppointment = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setShowNewAppointmentDialog(true);
  };

  const handleNewAppointment = (newAppointment: any) => {
    // Convert the appointment format and add to list
    const appointmentWithTime = {
      ...newAppointment,
      appointment_time: newAppointment.time,
      patient: {
        user: {
          first_name: newAppointment.patientName.split(' ')[0] || '',
          last_name: newAppointment.patientName.split(' ')[1] || ''
        }
      }
    };
    setAppointments(prev => [...prev, appointmentWithTime]);
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">My Schedule</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar picker */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>
        
        {/* Daily schedule */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Schedule for {date ? format(date, "MMMM d, yyyy") : "Today"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center my-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForTimeSlot(time);
                  
                  return (
                    <div 
                      key={time} 
                      className={cn(
                        "p-3 rounded-md border flex justify-between items-center",
                        appointment ? "bg-medical-light border-medical-primary" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-center">
                        <span className="font-medium w-20">{time}</span>
                        {appointment ? (
                          <div className="ml-4">
                            <p className="font-medium">
                              {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{appointment.type}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 ml-4">Available</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {appointment ? (
                          <>
                            <Button variant="outline" size="sm">View Details</Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteAppointment(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAddAppointment(time)}
                          >
                            Add Appointment
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewAppointmentDialog
        open={showNewAppointmentDialog}
        onOpenChange={setShowNewAppointmentDialog}
        onAppointmentCreated={handleNewAppointment}
        prefilledTime={selectedTimeSlot}
        prefilledDate={date ? format(date, 'yyyy-MM-dd') : ''}
      />
    </div>
  );
};

export default DoctorSchedule;
