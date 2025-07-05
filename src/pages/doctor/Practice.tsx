
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Plus, Search } from "lucide-react";
import { CreatePracticeForm } from "@/components/Practice/CreatePracticeForm";
import { JoinPracticeDialog } from "@/components/Practice/JoinPracticeDialog";

interface Practice {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  role: string;
  status: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export default function DoctorPractice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const fetchPracticeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get doctor's practice through staff table
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          practice_id,
          practices(id, name, address, phone, email, created_at)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (staffError) {
        if (staffError.code !== 'PGRST116') { // Not "not found" error
          console.error('Error fetching staff data:', staffError);
        }
        return;
      }

      if (staffData?.practices) {
        setPractice(staffData.practices as Practice);

        // Get all staff members for this practice
        const { data: allStaff, error: staffListError } = await supabase
          .from('staff')
          .select(`
            id,
            role,
            status,
            user_id
          `)
          .eq('practice_id', staffData.practice_id)
          .eq('status', 'active');

        if (staffListError) {
          console.error('Error fetching staff list:', staffListError);
          return;
        }

        // Get profiles for each staff member
        const staffWithProfiles = await Promise.all(
          (allStaff || []).map(async (staff) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', staff.user_id)
              .single();

            return {
              ...staff,
              profiles: profileData
            };
          })
        );

        setStaffMembers(staffWithProfiles);
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to load practice data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeCreated = (newPractice: Practice) => {
    setPractice(newPractice);
    setShowCreateForm(false);
    fetchPracticeData();
    toast({
      title: "Success",
      description: "Practice created successfully!",
    });
  };

  useEffect(() => {
    fetchPracticeData();
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
        <Building className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">My Practice</h1>
      </div>

      {!practice ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                You're not currently associated with a practice. You can either create a new practice or request to join an existing one.
              </p>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-medical-primary hover:bg-medical-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Practice
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Request to Join Existing Practice
                </Button>
              </div>
            </CardContent>
          </Card>

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <CreatePracticeForm 
                  onSuccess={handlePracticeCreated}
                  onCancel={() => setShowCreateForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Practice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {practice.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practice.address && (
                  <div>
                    <strong>Address:</strong>
                    <p className="text-gray-600">{practice.address}</p>
                  </div>
                )}
                {practice.phone && (
                  <div>
                    <strong>Phone:</strong>
                    <p className="text-gray-600">{practice.phone}</p>
                  </div>
                )}
                {practice.email && (
                  <div>
                    <strong>Email:</strong>
                    <p className="text-gray-600">{practice.email}</p>
                  </div>
                )}
                <div>
                  <strong>Established:</strong>
                  <p className="text-gray-600">
                    {new Date(practice.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members ({staffMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {staff.profiles?.first_name} {staff.profiles?.last_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {staff.role}
                      </Badge>
                      <Badge 
                        variant={staff.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {staff.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {staffMembers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No staff members found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <JoinPracticeDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
      />
    </div>
  );
}
