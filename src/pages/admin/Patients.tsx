
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  date_of_birth: string | null;
  address: string | null;
  insurance_provider: string | null;
  status: string;
  created_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  user_id: string;
}

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      
      try {
        // First get all users with patient role
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient');

        if (profilesError) throw profilesError;

        // Then get patient-specific data
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*');

        if (patientsError) throw patientsError;

        // Combine the data
        const combinedData = (patientsData || []).map(patient => {
          const profile = profiles?.find(p => p.id === patient.user_id);
          return {
            ...patient,
            user: profile || { id: patient.user_id, first_name: null, last_name: null, phone: null }
          };
        });

        setPatients(combinedData);
        setFilteredPatients(combinedData);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient => {
      const fullName = `${patient.user.first_name || ''} ${patient.user.last_name || ''}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || 
             patient.insurance_provider?.toLowerCase().includes(search) ||
             patient.id.toLowerCase().includes(search);
    });
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus })
        .eq('id', patientId);

      if (error) throw error;

      // Update local state
      setPatients(prev => prev.map(patient => 
        patient.id === patientId ? { ...patient, status: newStatus } : patient
      ));
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
        <p className="text-gray-600 mt-2">View and manage all patients in the system</p>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name, ID, or insurance provider..."
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
            <p className="text-xs text-muted-foreground">Registered patients</p>
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
                        {patient.user.first_name} {patient.user.last_name}
                      </h3>
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>ID: {patient.id.slice(0, 8)}</span>
                      </div>
                      
                      {patient.user.phone && (
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
                      
                      {patient.insurance_provider && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{patient.insurance_provider}</span>
                        </div>
                      )}
                      
                      {patient.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{patient.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {format(new Date(patient.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={patient.status === 'active' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => updatePatientStatus(patient.id, patient.status === 'active' ? 'inactive' : 'active')}
                  >
                    {patient.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
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
                {searchTerm ? 'Try adjusting your search criteria.' : 'No patients have been registered yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
