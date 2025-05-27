import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Calendar, FileText, Pill, Trash2, Plus, UserPlus, Users, Building } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Patient {
  id: string;
  date_of_birth: string | null;
  allergies: string[] | null;
  medical_history: string[] | null;
  status: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  appointments_count?: number;
  medications_count?: number;
  last_appointment?: string;
}

interface StaffMember {
  id: string;
  role: string;
  department: string | null;
  status: string;
  hire_date: string | null;
  permissions: string[] | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

interface Practice {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [userStaffData, setUserStaffData] = useState<any>(null);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("");
  const [newStaffDepartment, setNewStaffDepartment] = useState("");

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Get the doctor record
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (doctorError) throw doctorError;
        setDoctorData(doctor);

        // Get staff record for this doctor to find their practice
        const { data: staffRecord, error: staffError } = await supabase
          .from('staff')
          .select('*, practices(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (staffError) {
          console.log('No staff record found, doctor not assigned to practice yet');
          return;
        }

        setUserStaffData(staffRecord);
        setPractice(staffRecord.practices);

        // Load practice patients
        const { data: patientAssignments, error: assignmentsError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq('practice_id', staffRecord.practice_id)
          .eq('status', 'active');

        if (assignmentsError) throw assignmentsError;

        const patientIds = patientAssignments?.map(assignment => assignment.patient_id) || [];

        if (patientIds.length > 0) {
          // Get patient details
          const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .in('id', patientIds);

          if (patientsError) throw patientsError;

          // Get profiles and stats for each patient
          const patientsWithStats = await Promise.all(
            (patientsData || []).map(async (patient) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, phone')
                .eq('id', patient.user_id)
                .single();

              const { count: appointmentCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact' })
                .eq('patient_id', patient.id);

              const { count: medicationCount } = await supabase
                .from('medications')
                .select('*', { count: 'exact' })
                .eq('patient_id', patient.id);

              const { data: lastAppt } = await supabase
                .from('appointments')
                .select('appointment_date')
                .eq('patient_id', patient.id)
                .order('appointment_date', { ascending: false })
                .limit(1)
                .single();

              return {
                ...patient,
                user: profile || { first_name: null, last_name: null, phone: null },
                appointments_count: appointmentCount || 0,
                medications_count: medicationCount || 0,
                last_appointment: lastAppt?.appointment_date || null
              };
            })
          );

          setPatients(patientsWithStats);
          setFilteredPatients(patientsWithStats);
        }

        // Load practice staff if user has permissions
        if (staffRecord.permissions?.includes('manage_staff')) {
          const { data: staffData, error: staffDataError } = await supabase
            .from('staff')
            .select('*')
            .eq('practice_id', staffRecord.practice_id);

          if (staffDataError) throw staffDataError;

          const staffWithProfiles = await Promise.all(
            (staffData || []).map(async (staffMember) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, phone')
                .eq('id', staffMember.user_id)
                .single();

              return {
                ...staffMember,
                user: profile || { first_name: null, last_name: null, phone: null }
              };
            })
          );

          setStaff(staffWithProfiles);
        }
      } catch (error) {
        console.error('Error loading doctor data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadDoctorData();
    }
  }, [user]);

  useEffect(() => {
    const filtered = patients.filter(patient => {
      const fullName = `${patient.user?.first_name || ''} ${patient.user?.last_name || ''}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || patient.id.toLowerCase().includes(search);
    });
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const addPatientToGroup = async () => {
    if (!newPatientEmail.trim() || !userStaffData) return;

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `%${newPatientEmail}%`)
        .eq('role', 'patient')
        .single();

      if (profileError) {
        toast({
          title: "Patient not found",
          description: "No patient found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Get the patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (patientError) {
        toast({
          title: "Patient not found",
          description: "No patient record found for this user.",
          variant: "destructive",
        });
        return;
      }

      // Check if already assigned
      const { data: existingAssignment } = await supabase
        .from('patient_assignments')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('practice_id', userStaffData.practice_id)
        .single();

      if (existingAssignment) {
        toast({
          title: "Patient already assigned",
          description: "This patient is already part of your practice.",
          variant: "destructive",
        });
        return;
      }

      // Assign patient to practice
      const { error: assignmentError } = await supabase
        .from('patient_assignments')
        .insert({
          patient_id: patient.id,
          practice_id: userStaffData.practice_id,
          assigned_by: user?.id
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: "Patient added",
        description: "Patient has been added to your practice.",
      });

      setIsAddPatientOpen(false);
      setNewPatientEmail("");
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addStaffMember = async () => {
    if (!newStaffEmail.trim() || !newStaffRole || !userStaffData) return;

    try {
      // Find user by email (in profiles)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `%${newStaffEmail}%`)
        .single();

      if (profileError) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Check if already staff member
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', profile.id)
        .eq('practice_id', userStaffData.practice_id)
        .single();

      if (existingStaff) {
        toast({
          title: "User already staff",
          description: "This user is already a staff member of your practice.",
          variant: "destructive",
        });
        return;
      }

      // Add staff member
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: profile.id,
          practice_id: userStaffData.practice_id,
          role: newStaffRole,
          department: newStaffDepartment || null
        });

      if (staffError) throw staffError;

      toast({
        title: "Staff added",
        description: "Staff member has been added to your practice.",
      });

      setIsAddStaffOpen(false);
      setNewStaffEmail("");
      setNewStaffRole("");
      setNewStaffDepartment("");
      
      // Reload staff list
      window.location.reload();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  if (!userStaffData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Not assigned to a practice</h3>
              <p className="text-gray-600">
                You need to be assigned to a practice by an administrator to manage patients and staff.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManageStaff = userStaffData?.permissions?.includes('manage_staff');
  const canManagePatients = userStaffData?.permissions?.includes('manage_patients');

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Management</h1>
            <p className="text-gray-600 mt-2">Manage patients and staff for {practice?.name}</p>
            {doctorData && (
              <p className="text-sm text-gray-500">Specialty: {doctorData.specialty}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {canManagePatients && (
              <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Patient to Practice</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patientEmail">Patient Email</Label>
                      <Input
                        id="patientEmail"
                        value={newPatientEmail}
                        onChange={(e) => setNewPatientEmail(e.target.value)}
                        placeholder="Enter patient's email address"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addPatientToGroup}>
                        Add Patient
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {canManageStaff && (
              <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Staff Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="staffEmail">Staff Email</Label>
                      <Input
                        id="staffEmail"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="Enter staff member's email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="staffRole">Role</Label>
                      <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="staffDepartment">Department (Optional)</Label>
                      <Input
                        id="staffDepartment"
                        value={newStaffDepartment}
                        onChange={(e) => setNewStaffDepartment(e.target.value)}
                        placeholder="e.g. Emergency, Cardiology"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addStaffMember}>
                        Add Staff Member
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList>
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
          {canManageStaff && (
            <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="patients" className="space-y-6">
          {/* Search and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search patients by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <p className="text-xs text-muted-foreground">In practice</p>
              </CardContent>
            </Card>
          </div>

          {/* Patients List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-medical-light rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-medical-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {patient.user?.first_name} {patient.user?.last_name}
                          </h3>
                          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                            {patient.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>ID: {patient.id.slice(0, 8)}</span>
                          </div>
                          
                          {patient.user?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{patient.user.phone}</span>
                            </div>
                          )}
                          
                          {patient.date_of_birth && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Born {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>{patient.appointments_count} appointments</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Pill className="h-4 w-4" />
                            <span>{patient.medications_count} medications</span>
                          </div>
                          
                          {patient.last_appointment && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Last visit: {format(new Date(patient.last_appointment), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>

                        {/* Medical Info */}
                        {(patient.allergies?.length || patient.medical_history?.length) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {patient.allergies?.length && (
                              <div>
                                <span className="font-medium text-red-600">Allergies: </span>
                                <span className="text-gray-600">{patient.allergies.join(', ')}</span>
                              </div>
                            )}
                            {patient.medical_history?.length && (
                              <div>
                                <span className="font-medium text-gray-700">History: </span>
                                <span className="text-gray-600">{patient.medical_history.slice(0, 2).join(', ')}</span>
                                {patient.medical_history.length > 2 && <span className="text-gray-400"> +{patient.medical_history.length - 2} more</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        View Records
                      </Button>
                      <Button variant="default" size="sm">
                        Schedule Appointment
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removePatient(patient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPatients.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any patients yet.'}
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsAddPatientOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Your First Patient
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageStaff && (
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {staff.map((staffMember) => (
                <Card key={staffMember.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-medical-light rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-medical-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {staffMember.user?.first_name} {staffMember.user?.last_name}
                            </h3>
                            <Badge variant={staffMember.status === 'active' ? 'default' : 'secondary'}>
                              {staffMember.role}
                            </Badge>
                            <Badge variant="outline">
                              {staffMember.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            {staffMember.department && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>{staffMember.department}</span>
                              </div>
                            )}
                            
                            {staffMember.user?.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span>{staffMember.user.phone}</span>
                              </div>
                            )}
                            
                            {staffMember.hire_date && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Hired {format(new Date(staffMember.hire_date), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>

                          {staffMember.permissions && staffMember.permissions.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">Permissions: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {staffMember.permissions.map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit Permissions
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {staff.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members</h3>
                    <p className="text-gray-600">
                      Start by adding staff members to your practice.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsAddStaffOpen(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Add Staff Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
