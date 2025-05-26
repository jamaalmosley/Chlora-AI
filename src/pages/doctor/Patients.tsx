
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Calendar, FileText, Pill } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  date_of_birth: string | null;
  allergies: string[] | null;
  medical_history: string[] | null;
  status: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  appointments_count?: number;
  medications_count?: number;
  last_appointment?: string;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);

  useEffect(() => {
    const loadDoctorPatients = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // First get the doctor record
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (doctorError) throw doctorError;
        setDoctorData(doctor);

        // Get all patients who have appointments with this doctor
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', doctor.id);

        if (appointmentsError) throw appointmentsError;

        const patientIds = [...new Set(appointments?.map(apt => apt.patient_id) || [])];

        if (patientIds.length > 0) {
          // Get patient details
          const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select(`
              *,
              user:profiles(first_name, last_name, phone)
            `)
            .in('id', patientIds);

          if (patientsError) throw patientsError;

          // Get appointment counts and last appointment for each patient
          const patientsWithStats = await Promise.all(
            (patientsData || []).map(async (patient) => {
              // Count appointments
              const { count: appointmentCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact' })
                .eq('patient_id', patient.id)
                .eq('doctor_id', doctor.id);

              // Count medications prescribed by this doctor
              const { count: medicationCount } = await supabase
                .from('medications')
                .select('*', { count: 'exact' })
                .eq('patient_id', patient.id)
                .eq('prescribed_by', doctor.id);

              // Get last appointment
              const { data: lastAppt } = await supabase
                .from('appointments')
                .select('appointment_date')
                .eq('patient_id', patient.id)
                .eq('doctor_id', doctor.id)
                .order('appointment_date', { ascending: false })
                .limit(1)
                .single();

              return {
                ...patient,
                appointments_count: appointmentCount || 0,
                medications_count: medicationCount || 0,
                last_appointment: lastAppt?.appointment_date || null
              };
            })
          );

          setPatients(patientsWithStats);
          setFilteredPatients(patientsWithStats);
        }
      } catch (error) {
        console.error('Error loading doctor patients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadDoctorPatients();
    }
  }, [user]);

  useEffect(() => {
    const filtered = patients.filter(patient => {
      const fullName = `${patient.user?.first_name || ''} ${patient.user?.last_name || ''}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || patient.id.toLowerCase().includes(search);
    });
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <p className="text-gray-600 mt-2">Patients under your care</p>
        {doctorData && (
          <p className="text-sm text-gray-500">Specialty: {doctorData.specialty}</p>
        )}
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-medical-light rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-medical-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {patient.user?.first_name} {patient.user?.last_name}
                      </h3>
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>ID: {patient.id.slice(0, 8)}</span>
                      </div>
                      
                      {patient.user?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{patient.user.phone}</span>
                        </div>
                      )}
                      
                      {patient.date_of_birth && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Born {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{patient.appointments_count} appointments</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Pill className="h-4 w-4" />
                        <span>{patient.medications_count} medications</span>
                      </div>
                      
                      {patient.last_appointment && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Last visit: {format(new Date(patient.last_appointment), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* Medical Info */}
                    {(patient.allergies?.length || patient.medical_history?.length) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {patient.allergies?.length && (
                          <div>
                            <span className="font-medium text-red-600">Allergies: </span>
                            <span className="text-gray-600">{patient.allergies.join(', ')}</span>
                          </div>
                        )}
                        {patient.medical_history?.length && (
                          <div>
                            <span className="font-medium text-gray-700">History: </span>
                            <span className="text-gray-600">{patient.medical_history.slice(0, 2).join(', ')}</span>
                            {patient.medical_history.length > 2 && <span className="text-gray-400"> +{patient.medical_history.length - 2} more</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    View Records
                  </Button>
                  <Button variant="default" size="sm">
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any patients yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
