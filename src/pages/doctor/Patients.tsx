import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Phone, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  address?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  allergies?: string[];
  medical_history?: string[];
  status?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
}

interface PatientAssignment {
  id: string;
  patient_id: string;
  practice_id: string;
  assigned_date: string;
  status: string;
  patients: Patient;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // First get the doctor's practice
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('practice_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError) {
        console.error('Error fetching staff data:', staffError);
        setError('Unable to fetch practice information');
        return;
      }

      if (!staffData) {
        setError('You are not assigned to any practice');
        return;
      }

      // Get patients assigned to this practice
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('patient_assignments')
        .select(`
          id,
          patient_id,
          practice_id,
          assigned_date,
          status,
          patients!inner (
            id,
            user_id,
            date_of_birth,
            address,
            insurance_provider,
            insurance_number,
            emergency_contact_name,
            emergency_contact_phone,
            allergies,
            medical_history,
            status,
            profiles (
              first_name,
              last_name,
              phone,
              avatar_url
            )
          )
        `)
        .eq('practice_id', staffData.practice_id)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error fetching patients:', assignmentsError);
        setError('Unable to fetch patients');
        return;
      }

      setPatients(assignmentsData || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addPatientByEmail = async () => {
    if (!user || !patientEmail.trim()) return;

    try {
      setIsAddingPatient(true);
      setError(null);

      // Get doctor's practice
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('practice_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError || !staffData) {
        throw new Error('Unable to find your practice');
      }

      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', patientEmail.trim())
        .eq('role', 'patient')
        .single();

      if (profileError || !profileData) {
        throw new Error('Patient not found with this email');
      }

      // Find patient record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', profileData.id)
        .single();

      if (patientError || !patientData) {
        throw new Error('Patient record not found');
      }

      // Check if already assigned
      const { data: existingAssignment } = await supabase
        .from('patient_assignments')
        .select('id')
        .eq('patient_id', patientData.id)
        .eq('practice_id', staffData.practice_id)
        .single();

      if (existingAssignment) {
        throw new Error('Patient is already assigned to this practice');
      }

      // Create assignment
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patientData.id,
          practice_id: staffData.practice_id,
          assigned_by: user.id,
          status: 'active'
        });

      if (assignmentError) {
        throw new Error('Failed to assign patient to practice');
      }

      toast({
        title: "Success",
        description: "Patient added successfully",
      });

      setPatientEmail("");
      setAddPatientDialogOpen(false);
      fetchPatients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add patient';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingPatient(false);
    }
  };

  const handleRemovePatient = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('patient_assignments')
        .update({ status: 'inactive' })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient removed from practice",
      });

      fetchPatients();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove patient",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(assignment => {
    const patient = assignment.patients;
    const fullName = `${patient.profiles?.first_name || ''} ${patient.profiles?.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medical-primary">My Patients</h1>
        <Dialog open={addPatientDialogOpen} onOpenChange={setAddPatientDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-medical-primary hover:bg-medical-dark">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Patient by Email</DialogTitle>
              <DialogDescription>
                Search for a patient by their registered email address to add them to your practice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient-email">Patient Email</Label>
                <Input
                  id="patient-email"
                  type="email"
                  placeholder="patient@example.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={addPatientByEmail} 
                disabled={isAddingPatient || !patientEmail.trim()}
                className="w-full"
              >
                {isAddingPatient ? "Adding..." : "Add Patient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((assignment) => {
          const patient = assignment.patients;
          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {patient.profiles?.first_name} {patient.profiles?.last_name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePatient(assignment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {patient.status || 'Active'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.profiles?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{patient.profiles.phone}</span>
                  </div>
                )}
                
                {patient.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}

                {patient.insurance_provider && (
                  <div className="text-sm text-gray-600">
                    <strong>Insurance:</strong> {patient.insurance_provider}
                  </div>
                )}

                {patient.emergency_contact_name && (
                  <div className="text-sm text-gray-600">
                    <strong>Emergency Contact:</strong> {patient.emergency_contact_name}
                    {patient.emergency_contact_phone && ` (${patient.emergency_contact_phone})`}
                  </div>
                )}

                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="text-sm">
                    <strong className="text-red-600">Allergies:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Added: {new Date(assignment.assigned_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPatients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "No patients match your search." : "Start by adding patients to your practice."}
          </p>
        </div>
      )}
    </div>
  );
}
