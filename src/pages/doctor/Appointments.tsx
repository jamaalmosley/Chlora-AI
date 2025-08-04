import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus } from "lucide-react";
import { NewAppointmentDialog } from "@/components/Appointments/NewAppointmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);

  // Load doctor data
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

  // Load appointments
  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorData) return;
      
      setIsLoading(true);
      
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorData.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Get patient data for each appointment
        const appointmentsWithPatients: Appointment[] = await Promise.all(
          (appointmentsData || []).map(async (apt) => {
            if (!apt.patient_id) {
              return {
                id: apt.id,
                appointment_date: apt.appointment_date,
                appointment_time: apt.appointment_time,
                type: apt.type,
                status: (apt.status as 'scheduled' | 'completed' | 'cancelled' | 'no-show') || 'scheduled',
                notes: apt.notes,
                patient: { user: { first_name: 'Unknown', last_name: 'Patient' } }
              };
            }

            const { data: patient } = await supabase
              .from('patients')
              .select('user_id')
              .eq('id', apt.patient_id)
              .single();

            if (patient?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', patient.user_id)
                .single();

              return {
                id: apt.id,
                appointment_date: apt.appointment_date,
                appointment_time: apt.appointment_time,
                type: apt.type,
                status: (apt.status as 'scheduled' | 'completed' | 'cancelled' | 'no-show') || 'scheduled',
                notes: apt.notes,
                patient: {
                  user: profile || { first_name: 'Unknown', last_name: 'Patient' }
                }
              };
            }

            return {
              id: apt.id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              type: apt.type,
              status: (apt.status as 'scheduled' | 'completed' | 'cancelled' | 'no-show') || 'scheduled',
              notes: apt.notes,
              patient: { user: { first_name: 'Unknown', last_name: 'Patient' } }
            };
          })
        );

        setAppointments(appointmentsWithPatients);
      } catch (error) {
        console.error('Error loading appointments:', error);
        toast({
          title: "Error",
          description: "Failed to load appointments.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (doctorData) {
      loadAppointments();
    }
  }, [doctorData, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'default';
    }
  };

  const todayAppointments = appointments.filter(apt => 
    apt.appointment_date === new Date().toISOString().split('T')[0]
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) >= new Date()
  );

  const handleNewAppointment = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-medical-primary" />
          <h1 className="text-3xl font-bold text-medical-primary">Appointments</h1>
        </div>
        <Button 
          className="bg-medical-primary hover:bg-medical-dark"
          onClick={() => setShowNewAppointmentDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments.filter(apt => apt.status === 'scheduled').length} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-semibold">{appointment.appointment_time}</div>
                        <div className="text-sm text-gray-500">{appointment.type}</div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for today
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-semibold">{new Date(appointment.appointment_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{appointment.appointment_time}</div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{appointment.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewAppointmentDialog
        open={showNewAppointmentDialog}
        onOpenChange={setShowNewAppointmentDialog}
        onAppointmentCreated={handleNewAppointment}
      />
    </div>
  );
}