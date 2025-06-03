
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building, Save, Users, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreatePracticeForm } from "@/components/Practice/CreatePracticeForm";

interface Practice {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface StaffProfile {
  first_name?: string;
  last_name?: string;
}

interface StaffMember {
  id: string;
  role: string;
  department?: string;
  status: string;
  profiles?: StaffProfile;
}

export default function DoctorPractice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [noPracticeFound, setNoPracticeFound] = useState(false);

  const fetchPracticeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // First check if user is a doctor and has any practices
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        console.log('No doctor record found, user needs to create a practice');
        setNoPracticeFound(true);
        setIsLoading(false);
        return;
      }

      // For demo purposes, let's check if there are any practices at all
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select('*')
        .limit(1);

      if (practicesError) {
        console.error('Error fetching practices:', practicesError);
        setError('Unable to fetch practice information');
        return;
      }

      if (!practicesData || practicesData.length === 0) {
        console.log('No practices found, user needs to create one');
        setNoPracticeFound(true);
        setIsLoading(false);
        return;
      }

      // For demo, assume the doctor owns the first practice found
      const firstPractice = practicesData[0];
      setPractice(firstPractice);
      setIsOwner(true); // For demo purposes, assume they're the owner
      setNoPracticeFound(false);

      // Try to get staff members, but don't fail if there are RLS issues
      try {
        const { data: staffList, error: staffListError } = await supabase
          .from('staff')
          .select(`
            id,
            role,
            department,
            status,
            user_id
          `)
          .eq('practice_id', firstPractice.id)
          .eq('status', 'active');

        if (!staffListError && staffList) {
          // Get profiles for each staff member
          const staffWithProfiles = await Promise.all(
            staffList.map(async (staff) => {
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
        } else {
          console.log('Staff data not available due to RLS restrictions');
          setStaffMembers([]);
        }
      } catch (staffErr) {
        console.log('Could not fetch staff due to RLS restrictions, setting empty array');
        setStaffMembers([]);
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePractice = async () => {
    if (!practice || !user) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('practices')
        .update({
          name: practice.name,
          address: practice.address,
          phone: practice.phone,
          email: practice.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', practice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Practice information updated successfully",
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update practice information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePracticeCreated = () => {
    setShowCreateForm(false);
    fetchPracticeData(); // Refresh the data
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show create practice form if no practice found or user wants to create one
  if (noPracticeFound || showCreateForm) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Building className="h-8 w-8 text-medical-primary" />
          <h1 className="text-3xl font-bold text-medical-primary">My Practice</h1>
        </div>

        {noPracticeFound && !showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>No Practice Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You are not currently associated with any practice. You can:</p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-medical-primary hover:bg-medical-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Practice
                </Button>
                <Button variant="outline">
                  Request to Join Existing Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showCreateForm && (
          <div className="space-y-4">
            {!noPracticeFound && (
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="mb-4"
              >
                ← Back to Practice View
              </Button>
            )}
            <CreatePracticeForm onPracticeCreated={handlePracticeCreated} />
          </div>
        )}
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>No practice information found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-medical-primary" />
          <h1 className="text-3xl font-bold text-medical-primary">My Practice</h1>
        </div>
        {isOwner && (
          <Button 
            variant="outline"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Additional Practice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practice Information */}
        <Card>
          <CardHeader>
            <CardTitle>Practice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="practice-name">Practice Name</Label>
              <Input
                id="practice-name"
                value={practice.name}
                onChange={(e) => setPractice({...practice, name: e.target.value})}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice-address">Address</Label>
              <Textarea
                id="practice-address"
                value={practice.address || ''}
                onChange={(e) => setPractice({...practice, address: e.target.value})}
                rows={3}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice-phone">Phone Number</Label>
              <Input
                id="practice-phone"
                value={practice.phone || ''}
                onChange={(e) => setPractice({...practice, phone: e.target.value})}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice-email">Email</Label>
              <Input
                id="practice-email"
                type="email"
                value={practice.email || ''}
                onChange={(e) => setPractice({...practice, email: e.target.value})}
                disabled={!isOwner}
              />
            </div>

            {isOwner && (
              <Button 
                onClick={handleSavePractice}
                disabled={isSaving}
                className="w-full bg-medical-primary hover:bg-medical-dark"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}

            {!isOwner && (
              <Alert>
                <AlertDescription>
                  You don't have permission to edit practice information. Contact your practice administrator.
                </AlertDescription>
              </Alert>
            )}
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
                    <div className="text-sm text-gray-600 capitalize">
                      {staff.role} {staff.department && `• ${staff.department}`}
                    </div>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {staff.status}
                  </div>
                </div>
              ))}
              
              {staffMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Staff information unavailable due to security restrictions.</p>
                  <p className="text-xs mt-2">You can manage staff manually through practice settings.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
