
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Plus, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatientProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  address?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: string;
  profiles?: PatientProfile;
}

interface PatientAssignment {
  id: string;
  patient_id: string;
  practice_id: string;
  assigned_date: string;
  status: string;
  patients?: Patient;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [practiceId, setPracticeId] = useState<string | null>(null);

  const fetchPracticeAndPatients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get doctor's practice
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('practice_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      setPracticeId(staffData.practice_id);

      // Get patient assignments for this practice
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('patient_assignments')
        .select(`
          id,
          patient_id,
          practice_id,
          assigned_date,
          status
        `)
        .eq('practice_id', staffData.practice_id)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        return;
      }

      // Get patient details for each assignment
      const patientsWithProfiles = await Promise.all(
        (assignmentData || []).map(async (assignment) => {
          const { data: patientData } = await supabase
            .from('patients')
            .select(`
              id,
              user_id,
              date_of_birth,
              address,
              insurance_provider,
              insurance_number,
              emergency_contact_name,
              emergency_contact_phone,
              status
            `)
            .eq('id', assignment.patient_id)
            .single();

          if (patientData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, phone, avatar_url')
              .eq('id', patientData.user_id)
              .single();

            return {
              ...assignment,
              patients: {
                ...patientData,
                profiles: profileData
              }
            };
          }
          return assignment;
        })
      );

      setAssignments(patientsWithProfiles);

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchPatientsByEmail = async () => {
    if (!searchEmail.trim()) return;

    try {
      setIsSearching(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role
        `)
        .eq('role', 'patient')
        .ilike('id', `%${searchEmail}%`);

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Error",
          description: "Failed to search for patients",
          variant: "destructive",
        });
        return;
      }

      // Search by email in auth.users (this would need a function)
      // For now, we'll search by profile email if it exists
      const { data: userProfiles, error: userError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role
        `)
        .eq('role', 'patient');

      setSearchResults(userProfiles || []);

    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Error",
        description: "Failed to search for patients",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addPatientToPractice = async (patientUserId: string) => {
    if (!practiceId) return;

    try {
      // First get the patient record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', patientUserId)
        .single();

      if (patientError || !patientData) {
        toast({
          title: "Error",
          description: "Patient record not found",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patientData.id,
          practice_id: practiceId,
          assigned_by: user?.id,
          status: 'active'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add patient to practice",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Patient added to practice successfully",
      });

      setSearchResults([]);
      setSearchEmail("");
      fetchPracticeAndPatients();

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add patient to practice",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPracticeAndPatients();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">My Patients</h1>
      </div>

      {/* Add Patient Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Patient to Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by email address..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={searchPatientsByEmail}
              disabled={isSearching}
              className="bg-medical-primary hover:bg-medical-dark"
            >
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Search Results:</h4>
              {searchResults.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{patient.id}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addPatientToPractice(patient.id)}
                    className="bg-medical-primary hover:bg-medical-dark"
                  >
                    Add to Practice
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Current Patients ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {assignment.patients?.profiles?.first_name} {assignment.patients?.profiles?.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {assignment.patients?.profiles?.phone && (
                        <>Phone: {assignment.patients.profiles.phone}</>
                      )}
                    </div>
                    {assignment.patients?.insurance_provider && (
                      <div className="text-sm text-gray-600">
                        Insurance: {assignment.patients.insurance_provider}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      {assignment.status}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      Added: {new Date(assignment.assigned_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No patients assigned to this practice yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
