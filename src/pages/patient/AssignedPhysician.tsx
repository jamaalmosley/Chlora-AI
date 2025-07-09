
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Building, MessageCircle, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhysicianProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface PracticeInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Assignment {
  id: string;
  practice_id: string;
  assigned_date: string;
  status: string;
  practices?: PracticeInfo;
}

interface PhysicianRequest {
  id: string;
  practice_id: string;
  requested_by: string;
  message?: string;
  created_at: string;
  status: string;
  practices?: PracticeInfo;
  profiles?: PhysicianProfile;
}

export default function AssignedPhysician() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [physicianRequests, setPhysicianRequests] = useState<PhysicianRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get patient record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError || !patientData) {
        console.error('Error fetching patient data:', patientError);
        return;
      }

      // Get patient assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('patient_assignments')
        .select(`
          id,
          practice_id,
          assigned_date,
          status,
          practices(name, address, phone, email)
        `)
        .eq('patient_id', patientData.id)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
      } else {
        setAssignments(assignmentData || []);
      }

      // Get physician requests
      const { data: requestData, error: requestError } = await supabase
        .from('physician_patient_requests')
        .select(`
          id,
          practice_id,
          requested_by,
          message,
          created_at,
          status,
          practices(name, address, phone, email)
        `)
        .eq('patient_id', patientData.id)
        .eq('status', 'pending');

      if (!requestError && requestData) {
        // Get profiles for each requesting physician
        const requestsWithProfiles = await Promise.all(
          requestData.map(async (request) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, phone')
              .eq('id', request.requested_by)
              .single();

            return {
              ...request,
              profiles: profileData || undefined
            };
          })
        );
        setPhysicianRequests(requestsWithProfiles);
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to load physician assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResponse = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('physician_patient_requests')
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${accept ? 'accepted' : 'rejected'} successfully`,
      });

      fetchAssignments();

    } catch (err: any) {
      console.error('Error responding to request:', err);
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive",
      });
    }
  };

  const startChat = (practiceId: string) => {
    // This would navigate to a chat interface with the practice
    toast({
      title: "Chat Feature",
      description: "Chat functionality will be implemented soon",
    });
  };

  useEffect(() => {
    fetchAssignments();
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
        <User className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">My Physicians</h1>
      </div>

      {/* Pending Physician Requests */}
      {physicianRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Physician Requests ({physicianRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {physicianRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        Dr. {request.profiles?.first_name} {request.profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.practices?.name}
                      </div>
                      {request.message && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Message:</strong> {request.message}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(request.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestResponse(request.id, false)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Physician Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>My Healthcare Providers ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {assignment.practices?.name}
                    </div>
                    {assignment.practices?.address && (
                      <div className="text-sm text-gray-600 mt-1">
                        {assignment.practices.address}
                      </div>
                    )}
                    {assignment.practices?.phone && (
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {assignment.practices.phone}
                      </div>
                    )}
                    {assignment.practices?.email && (
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {assignment.practices.email}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Patient since: {new Date(assignment.assigned_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="default" className="capitalize">
                      {assignment.status}
                    </Badge>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => startChat(assignment.practice_id)}
                        className="bg-medical-primary hover:bg-medical-dark"
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <div className="text-center py-8">
                <Alert>
                  <AlertDescription>
                    You haven't been assigned to any healthcare providers yet. 
                    Contact your doctor's office to be added to their patient list.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
