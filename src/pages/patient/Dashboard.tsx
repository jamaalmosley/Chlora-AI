
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, FileText, Pill, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DatabaseAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  doctor: {
    specialty: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: string;
}

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<DatabaseAppointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patientData, setPatientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch patient data
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (patientError && patientError.code !== 'PGRST116') {
          throw patientError;
        }
        
        setPatientData(patient);

        if (patient) {
          // Fetch upcoming appointments
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              *,
              doctor:doctors(
                specialty,
                user:profiles(first_name, last_name)
              )
            `)
            .eq('patient_id', patient.id)
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .limit(3);

          if (appointmentsError) throw appointmentsError;
          
          // Filter out appointments with invalid doctor data
          const validAppointments = (appointmentsData || []).filter(apt => 
            apt.doctor && apt.doctor.user && apt.doctor.user.first_name
          );
          
          setAppointments(validAppointments);

          // Fetch active medications
          const { data: medicationsData, error: medicationsError } = await supabase
            .from('medications')
            .select('*')
            .eq('patient_id', patient.id)
            .eq('status', 'active')
            .limit(5);

          if (medicationsError) throw medicationsError;
          setMedications(medicationsData || []);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadPatientData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  const userName = profile?.first_name || "Patient";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
        <p className="text-gray-600 mt-2">Here's your health summary for today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medications.length}</div>
            <p className="text-xs text-muted-foreground">Currently prescribed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData?.medical_history?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Records available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-green-600">All clear</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled medical appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appointment.type}</p>
                      <p className="text-sm text-gray-600">
                        Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/patient/appointments">
                  <Button variant="outline" className="w-full">View All Appointments</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming appointments</p>
                <Link to="/patient/appointments">
                  <Button variant="outline" className="mt-2">Schedule Appointment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card>
          <CardHeader>
            <CardTitle>Current Medications</CardTitle>
            <CardDescription>Your active prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-4">
                {medications.map((medication) => (
                  <div key={medication.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{medication.name}</p>
                      <p className="text-sm text-gray-600">{medication.dosage}</p>
                      <p className="text-sm text-gray-500">{medication.frequency}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {medication.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link to="/patient/medications">
                  <Button variant="outline" className="w-full">View All Medications</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active medications</p>
                <Link to="/patient/medications">
                  <Button variant="outline" className="mt-2">View Medications</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/patient/appointments">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Book Appointment</span>
              </Button>
            </Link>
            <Link to="/patient/records">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>View Records</span>
              </Button>
            </Link>
            <Link to="/patient/medications">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Pill className="h-6 w-6 mb-2" />
                <span>Medications</span>
              </Button>
            </Link>
            <Link to="/patient/chat">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Clock className="h-6 w-6 mb-2" />
                <span>Get Help</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
