import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, FileText } from "lucide-react";
import { InvitePatientDialog } from "@/components/Patient/InvitePatientDialog";
import { AddMedicalRecordDialog } from "@/components/Doctor/AddMedicalRecordDialog";

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
  const [isLoading, setIsLoading] = useState(true);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState<string>("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMedicalRecordDialog, setShowMedicalRecordDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const fetchPracticeAndPatients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get doctor ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor:', doctorError);
        return;
      }

      setDoctorId(doctorData.id);

      // Get doctor's practice
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          practice_id,
          practices(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      setPracticeId(staffData.practice_id);
      setPracticeName(staffData.practices?.name || "");

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
        <CardContent>
          <Button 
            onClick={() => {
              console.log('Invite Patient button clicked');
              console.log('Current practiceId:', practiceId);
              console.log('Current practiceName:', practiceName);
              setShowInviteDialog(true);
            }}
            className="bg-medical-primary hover:bg-medical-dark"
          >
            <Mail className="mr-2 h-4 w-4" />
            Invite Patient
          </Button>
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
                  <div className="text-right space-y-2">
                    <Badge variant="outline" className="mb-2">
                      {assignment.status}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      Added: {new Date(assignment.assigned_date).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPatient({
                          id: assignment.patient_id,
                          name: `${assignment.patients?.profiles?.first_name} ${assignment.patients?.profiles?.last_name}`
                        });
                        setShowMedicalRecordDialog(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Test Results
                    </Button>
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

      {practiceId && (
        <>
          <InvitePatientDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            practiceId={practiceId}
            practiceName={practiceName}
            onPatientAdded={fetchPracticeAndPatients}
          />
          
          {selectedPatient && doctorId && (
            <AddMedicalRecordDialog
              open={showMedicalRecordDialog}
              onOpenChange={setShowMedicalRecordDialog}
              patientId={selectedPatient.id}
              doctorId={doctorId}
              onSuccess={() => {
                toast({
                  title: "Success",
                  description: "Test results uploaded successfully",
                });
                setShowMedicalRecordDialog(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
