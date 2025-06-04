
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, UserPlus, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddStaffDialog } from "@/components/Staff/AddStaffDialog";

interface StaffProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface StaffMember {
  id: string;
  role: string;
  department?: string;
  status: string;
  hire_date?: string;
  permissions: string[];
  profiles?: StaffProfile;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  department?: string;
  created_at: string;
  expires_at: string;
}

interface JoinRequest {
  id: string;
  requested_role: string;
  message?: string;
  created_at: string;
  profiles?: StaffProfile;
}

export default function DoctorStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [practiceName, setPracticeName] = useState<string>("");
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchAllData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get doctor's practice and permissions
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          practice_id, 
          role, 
          permissions,
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
      
      // Check permissions
      const canManage = staffData.role === 'admin' || 
        (staffData.permissions && staffData.permissions.includes('manage_staff'));
      setCanManageStaff(canManage);

      // Get all staff members for this practice
      const { data: allStaff, error: staffListError } = await supabase
        .from('staff')
        .select(`
          id,
          role,
          department,
          status,
          hire_date,
          permissions,
          user_id
        `)
        .eq('practice_id', staffData.practice_id);

      if (staffListError) {
        console.error('Error fetching staff list:', staffListError);
        return;
      }

      // Get profiles for each staff member
      const staffWithProfiles = await Promise.all(
        (allStaff || []).map(async (staff) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone')
            .eq('id', staff.user_id)
            .single();

          return {
            ...staff,
            profiles: profileData
          };
        })
      );

      setStaffMembers(staffWithProfiles);

      // Get pending invitations if user can manage staff
      if (canManage) {
        const { data: invitations } = await supabase
          .from('practice_invitations')
          .select('*')
          .eq('practice_id', staffData.practice_id)
          .eq('status', 'pending');

        setPendingInvitations(invitations || []);

        // Get join requests
        const { data: requests } = await supabase
          .from('practice_join_requests')
          .select(`
            id,
            requested_role,
            message,
            created_at,
            user_id
          `)
          .eq('practice_id', staffData.practice_id)
          .eq('status', 'pending');

        if (requests) {
          // Get profiles for join requests
          const requestsWithProfiles = await Promise.all(
            requests.map(async (request) => {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name, phone')
                .eq('id', request.user_id)
                .single();

              return {
                ...request,
                profiles: profileData
              };
            })
          );
          setJoinRequests(requestsWithProfiles);
        }
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const approveJoinRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_join_request', {
        request_id: requestId
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (result.success) {
        toast({
          title: "Success",
          description: "Join request approved successfully",
        });
        fetchAllData();
      } else {
        throw new Error(result.error || 'Failed to approve request');
      }

    } catch (err: any) {
      console.error('Error approving join request:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to approve join request",
        variant: "destructive",
      });
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('practice_join_requests')
        .update({ 
          status: 'rejected', 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Join request rejected",
      });
      fetchAllData();

    } catch (err: any) {
      console.error('Error rejecting join request:', err);
      toast({
        title: "Error",
        description: "Failed to reject join request",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllData();
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
        <h1 className="text-3xl font-bold text-medical-primary">Staff Management</h1>
      </div>

      {!canManageStaff && (
        <Alert>
          <AlertDescription>
            You don't have permission to manage staff. Contact your practice administrator.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Staff Section */}
      {canManageStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Staff Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-medical-primary hover:bg-medical-dark"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Join Requests */}
      {canManageStaff && joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join Requests ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {request.profiles?.first_name} {request.profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Requested role: <Badge variant="outline">{request.requested_role}</Badge>
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
                        onClick={() => approveJoinRequest(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectJoinRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {canManageStaff && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-600">
                        Role: <Badge variant="outline">{invitation.role}</Badge>
                        {invitation.department && (
                          <span className="ml-2">Department: {invitation.department}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Current Staff ({staffMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {staff.profiles?.first_name} {staff.profiles?.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {staff.profiles?.phone && (
                        <>Phone: {staff.profiles.phone}</>
                      )}
                    </div>
                    {staff.department && (
                      <div className="text-sm text-gray-600">
                        Department: {staff.department}
                      </div>
                    )}
                    {staff.hire_date && (
                      <div className="text-sm text-gray-500">
                        Hired: {new Date(staff.hire_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {staff.role}
                      </Badge>
                    </div>
                    <div>
                      <Badge 
                        variant={staff.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {staff.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {staff.permissions && staff.permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Permissions:</div>
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {staffMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No staff members found for this practice.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddStaffDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onStaffAdded={fetchAllData}
        practiceId={practiceId || ""}
        practiceName={practiceName}
      />
    </div>
  );
}
