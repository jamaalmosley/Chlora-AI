
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Mail, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function DoctorStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("nurse");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [canManageStaff, setCanManageStaff] = useState(false);

  const fetchStaffData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get doctor's practice and permissions
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('practice_id, role, permissions')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      setPracticeId(staffData.practice_id);
      
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

  const searchUsersByEmail = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      
      // Search for users by email (this would typically be done via a function)
      // For now, we'll search profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .neq('role', 'patient'); // Exclude patients from staff search

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Error",
          description: "Failed to search for users",
          variant: "destructive",
        });
        return;
      }

      // Filter to find matching email - in reality this would be done server-side
      // For demo purposes, we'll just show all non-patient users
      console.log('Search results:', profiles);
      
      toast({
        title: "Search completed",
        description: `Found ${profiles?.length || 0} potential staff members`,
      });

    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addStaffMember = async (userEmail: string) => {
    if (!practiceId || !canManageStaff) return;

    try {
      // In a real implementation, we'd need a function to add staff by email
      // This would involve finding the user by email and creating a staff record
      
      toast({
        title: "Feature Note",
        description: "Staff addition by email requires backend function implementation",
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    }
  };

  const updateStaffRole = async (staffId: string, newRole: string) => {
    if (!canManageStaff) return;

    try {
      const { error } = await supabase
        .from('staff')
        .update({ role: newRole })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff role updated successfully",
      });

      fetchStaffData();

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update staff role",
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <select
                  id="staff-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={searchUsersByEmail}
                  disabled={isSearching}
                  className="w-full bg-medical-primary hover:bg-medical-dark"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "Searching..." : "Search & Add"}
                </Button>
              </div>
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
                    {canManageStaff && staff.role !== 'admin' && (
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStaffRole(staff.id, 'admin')}
                        >
                          Make Admin
                        </Button>
                      </div>
                    )}
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
    </div>
  );
}
