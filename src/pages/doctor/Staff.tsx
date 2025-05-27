
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddStaffDialog } from "@/components/Staff/AddStaffDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StaffMember {
  id: string;
  role: string;
  department?: string;
  status: string;
  hire_date?: string;
  permissions: string[];
  profiles: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

export default function DoctorStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [practiceId, setPracticeId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [canManageStaff, setCanManageStaff] = useState(false);

  const fetchStaffData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get doctor's practice and permissions
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('practice_id, role, permissions')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError || !staffData) {
        setError('You are not assigned to any practice');
        return;
      }

      setPracticeId(staffData.practice_id);
      
      // Check if user can manage staff
      const canManage = staffData.role === 'admin' || 
        (staffData.permissions && staffData.permissions.includes('manage_staff'));
      setCanManageStaff(canManage);

      // Get all staff members for this practice
      const { data: staffList, error: staffListError } = await supabase
        .from('staff')
        .select(`
          id,
          role,
          department,
          status,
          hire_date,
          permissions,
          profiles (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('practice_id', staffData.practice_id);

      if (staffListError) {
        setError('Unable to fetch staff members');
        return;
      }

      setStaffMembers(staffList || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ status: 'inactive' })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });

      fetchStaffData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user]);

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
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-medical-primary" />
          <h1 className="text-3xl font-bold text-medical-primary">Staff Management</h1>
        </div>
        {canManageStaff && (
          <Button 
            onClick={() => setAddStaffDialogOpen(true)}
            className="bg-medical-primary hover:bg-medical-dark"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!canManageStaff && (
        <Alert className="mb-6">
          <AlertDescription>
            You don't have permission to manage staff. Contact your practice administrator.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map((staff) => (
          <Card key={staff.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {staff.profiles.first_name} {staff.profiles.last_name}
                </CardTitle>
                {canManageStaff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStaff(staff.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {staff.role}
                </Badge>
                <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                  {staff.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.department && (
                <div className="text-sm">
                  <strong>Department:</strong> {staff.department}
                </div>
              )}

              {staff.profiles.phone && (
                <div className="text-sm">
                  <strong>Phone:</strong> {staff.profiles.phone}
                </div>
              )}

              {staff.hire_date && (
                <div className="text-sm">
                  <strong>Hire Date:</strong> {new Date(staff.hire_date).toLocaleDateString()}
                </div>
              )}

              {staff.permissions && staff.permissions.length > 0 && (
                <div className="text-sm">
                  <strong>Permissions:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {staff.permissions.map((permission, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {staffMembers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-500 mb-4">
            Start by adding staff members to your practice.
          </p>
        </div>
      )}

      <AddStaffDialog
        open={addStaffDialogOpen}
        onOpenChange={setAddStaffDialogOpen}
        onStaffAdded={fetchStaffData}
        practiceId={practiceId}
      />
    </div>
  );
}
