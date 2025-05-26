
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface Patient {
  id: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch doctor data
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (doctorError && doctorError.code !== 'PGRST116') {
          throw doctorError;
        }
        
        setDoctorData(doctor);

        if (doctor) {
          // Fetch today's appointments
          const today = new Date().toISOString().split('T')[0];
          const { data: todayAppts, error: todayError } = await supabase
            .from('appointments')
            .select(`
              *,
              patient:patients(
                user:profiles(first_name, last_name)
              )
            `)
            .eq('doctor_id', doctor.id)
            .eq('appointment_date', today)
            .order('appointment_time', { ascending: true });

          if (todayError) throw todayError;
          setTodayAppointments(todayAppts || []);

          // Fetch upcoming appointments
          const { data: upcomingAppts, error: upcomingError } = await supabase
            .from('appointments')
            .select(`
              *,
              patient:patients(
                user:profiles(first_name, last_name)
              )
            `)
            .eq('doctor_id', doctor.id)
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .limit(5);

          if (upcomingError) throw upcomingError;
          setAppointments(upcomingAppts || []);

          // Fetch patient list
          const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select(`
              id,
              user:profiles(first_name, last_name)
            `)
            .in('id', (upcomingAppts || []).map(apt => apt.patient_id));

          if (patientsError) throw patientsError;
          setPatients(patientsData || []);
        }
      } catch (error) {
        console.error('Error loading doctor data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadDoctorData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  const userName = profile?.first_name || "Doctor";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Dr. {userName}!</h1>
        <p className="text-gray-600 mt-2">Here's your practice overview for today.</p>
        {doctorData && (
          <p className="text-sm text-gray-500">Specialty: {doctorData.specialty}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">{doctorData?.status || 'Active'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appointment.appointment_time}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.type}</p>
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
                <Link to="/doctor/schedule">
                  <Button variant="outline" className="w-full">View Full Schedule</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments today</p>
                <Link to="/doctor/schedule">
                  <Button variant="outline" className="mt-2">View Schedule</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Patients with upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {patients.length > 0 ? (
              <div className="space-y-4">
                {patients.slice(0, 5).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {patient.user?.first_name} {patient.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">Patient ID: {patient.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                ))}
                <Link to="/doctor/patients">
                  <Button variant="outline" className="w-full">View All Patients</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patients found</p>
                <Link to="/doctor/patients">
                  <Button variant="outline" className="mt-2">View Patients</Button>
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
            <Link to="/doctor/schedule">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>View Schedule</span>
              </Button>
            </Link>
            <Link to="/doctor/patients">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span>Patient List</span>
              </Button>
            </Link>
            <Link to="/doctor/surgeries">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>Surgeries</span>
              </Button>
            </Link>
            <Link to="/doctor/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Clock className="h-6 w-6 mb-2" />
                <span>Update Profile</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
