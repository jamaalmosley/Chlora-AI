import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building, Save, Users, Plus, DollarSign, BarChart, Settings, Calendar, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreatePracticeForm } from "@/components/Practice/CreatePracticeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AddStaffDialog } from "@/components/Staff/AddStaffDialog";

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
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);

  const fetchPracticeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('DoctorPractice: Starting practice data fetch for user:', user.id);

      // First check if user is a doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        console.log('DoctorPractice: No doctor record found, user needs to create a practice');
        setNoPracticeFound(true);
        setIsLoading(false);
        return;
      }

      console.log('DoctorPractice: Doctor record found:', doctorData);

      // Try to find practices where this user is staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          practices (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (staffError) {
        console.error('DoctorPractice: Error fetching staff data:', staffError);
      }

      console.log('DoctorPractice: Staff data:', staffData);

      let selectedPractice = null;
      let userIsOwner = false;

      if (staffData && staffData.length > 0) {
        // User is staff at a practice
        selectedPractice = staffData[0].practices;
        userIsOwner = staffData[0].role === 'admin';
      }

      if (selectedPractice) {
        setPractice(selectedPractice);
        setIsOwner(userIsOwner);
        setNoPracticeFound(false);

        // Fetch staff members for this practice - simplified query to avoid relation errors
        const { data: allStaffData, error: allStaffError } = await supabase
          .from('staff')
          .select('*')
          .eq('practice_id', selectedPractice.id)
          .eq('status', 'active');

        if (!allStaffError && allStaffData) {
          // Fetch profiles separately to avoid relation issues
          const staffWithProfiles = await Promise.all(
            allStaffData.map(async (staff) => {
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

        console.log('DoctorPractice: Practice setup complete');
      } else {
        setNoPracticeFound(true);
      }

    } catch (err) {
      console.error('DoctorPractice: Unexpected error:', err);
      setError('An unexpected error occurred while loading practice data');
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
        })
        .eq('id', practice.id);

      if (error) {
        console.error('DoctorPractice: Error updating practice:', error);
        throw error;
      }

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

  const handleStaffAdded = () => {
    console.log('DoctorPractice: Staff member added successfully');
    fetchPracticeData(); // Refresh data
  };

  useEffect(() => {
    fetchPracticeData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading practice information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Practice
          </Button>
        </div>
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
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">My Practice</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isOwner ? "default" : "secondary"}>
                {isOwner ? "Owner" : "Staff Member"}
              </Badge>
            </div>
          </div>
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          {isOwner && <TabsTrigger value="financials">Financials</TabsTrigger>}
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Total Patients</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{staffMembers.length + 1}</div>
                    <div className="text-sm text-gray-600">Staff Members</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Today's Appointments</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-600">Pending Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Members ({staffMembers.length + 1})
                </div>
                {isOwner && (
                  <Button 
                    onClick={() => setShowAddStaffDialog(true)}
                    className="bg-medical-primary hover:bg-medical-dark"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Current user */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <div className="font-medium">You ({isOwner ? 'Owner' : 'Staff'})</div>
                    <div className="text-sm text-gray-600">
                      {isOwner ? 'Practice Owner' : 'Doctor'}
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

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
                    <p>No additional staff members</p>
                    {isOwner && (
                      <p className="text-sm mt-2">Click "Add Staff Member" to get started</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="financials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">$0</div>
                  <div className="text-sm text-gray-600">This month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">$0</div>
                  <div className="text-sm text-gray-600">This month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">$0</div>
                  <div className="text-sm text-gray-600">This month</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet</p>
                  <p className="text-sm mt-2">Transaction history will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Practice Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Schedule management coming soon</p>
                  <p className="text-sm mt-2">View your personal schedule in the sidebar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Practice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    Manage Staff Permissions
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Practice Policies
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    Operating Hours
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <DollarSign className="h-6 w-6 mb-2" />
                    Billing Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AddStaffDialog
        open={showAddStaffDialog}
        onOpenChange={setShowAddStaffDialog}
        onStaffAdded={handleStaffAdded}
        practiceId={practice.id}
        practiceName={practice.name}
      />
    </div>
  );
}
