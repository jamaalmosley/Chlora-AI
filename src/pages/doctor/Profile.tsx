
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Award, Clipboard, MapPin, Users, Clock, Edit, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DoctorData {
  id: string;
  specialty: string;
  license_number: string;
  education: string[] | null;
  certifications: string[] | null;
  working_hours: string | null;
  contact_address: string | null;
  status: string;
}

const DoctorProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    working_hours: '',
    contact_address: ''
  });
  const [educationForm, setEducationForm] = useState({
    education: [] as string[],
    certifications: [] as string[],
    newEducation: '',
    newCertification: ''
  });

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setDoctorData(data);
        setEditForm({
          working_hours: data.working_hours || '',
          contact_address: data.contact_address || ''
        });
        setEducationForm({
          education: data.education || [],
          certifications: data.certifications || [],
          newEducation: '',
          newCertification: ''
        });
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

  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditEducation = () => {
    setIsEducationDialogOpen(true);
  };

  const handleViewSchedule = () => {
    navigate('/doctor/schedule');
  };

  const handleManageAvailability = () => {
    navigate('/doctor/schedule');
  };

  const handleViewPatients = () => {
    navigate('/doctor/patients');
  };

  const handleSaveProfile = async () => {
    if (!doctorData) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          working_hours: editForm.working_hours,
          contact_address: editForm.contact_address
        })
        .eq('id', doctorData.id);

      if (error) throw error;

      setDoctorData(prev => prev ? {
        ...prev,
        working_hours: editForm.working_hours,
        contact_address: editForm.contact_address
      } : null);

      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEducation = async () => {
    if (!doctorData) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          education: educationForm.education,
          certifications: educationForm.certifications
        })
        .eq('id', doctorData.id);

      if (error) throw error;

      setDoctorData(prev => prev ? {
        ...prev,
        education: educationForm.education,
        certifications: educationForm.certifications
      } : null);

      setIsEducationDialogOpen(false);
      toast({
        title: "Success",
        description: "Education and certifications updated successfully.",
      });
    } catch (error) {
      console.error('Error updating education:', error);
      toast({
        title: "Error",
        description: "Failed to update education and certifications.",
        variant: "destructive",
      });
    }
  };

  const addEducation = () => {
    if (educationForm.newEducation.trim()) {
      setEducationForm(prev => ({
        ...prev,
        education: [...prev.education, prev.newEducation.trim()],
        newEducation: ''
      }));
    }
  };

  const removeEducation = (index: number) => {
    setEducationForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (educationForm.newCertification.trim()) {
      setEducationForm(prev => ({
        ...prev,
        certifications: [...prev.certifications, prev.newCertification.trim()],
        newCertification: ''
      }));
    }
  };

  const removeCertification = (index: number) => {
    setEducationForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  if (!doctorData || !profile) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 text-red-500 mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Profile Data Not Found</h2>
        <p className="text-gray-600 mt-2">We couldn't retrieve your profile information.</p>
      </div>
    );
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile summary card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || ""} alt={fullName} />
              <AvatarFallback className="bg-medical-primary text-white text-xl">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-center">{fullName}</h2>
            <Badge className="bg-medical-light text-medical-primary mt-1">
              {doctorData.specialty}
            </Badge>
            <p className="text-gray-500 mt-2">License: {doctorData.license_number}</p>
            
            <div className="w-full space-y-3 mt-6">
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                <span>{user?.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {doctorData.contact_address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{doctorData.contact_address}</span>
                </div>
              )}
            </div>
            
            <Button variant="outline" className="mt-6 w-full" onClick={handleEditProfile}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Professional information */}
        <div className="md:col-span-2 space-y-6">
          {/* Education & Certifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Education & Certifications
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleEditEducation}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Education</h3>
                {doctorData.education && doctorData.education.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {doctorData.education.map((edu, index) => (
                      <li key={index} className="text-gray-800">{edu}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No education information provided</p>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Certifications</h3>
                {doctorData.certifications && doctorData.certifications.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {doctorData.certifications.map((cert, index) => (
                      <li key={index} className="text-gray-800">{cert}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No certifications listed</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Working Hours & Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Working Hours & Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Working Hours</h3>
                <p className="text-gray-800">{doctorData.working_hours || "Not specified"}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Manage Your Schedule</h3>
                  <p className="text-gray-700 text-sm">View and modify your appointments and surgeries</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={handleViewSchedule}>View Schedule</Button>
                  <Button size="sm" onClick={handleManageAvailability}>Manage Availability</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Patient Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Patient Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Manage Your Patients</h3>
                  <p className="text-gray-700 text-sm">Access patient records, charts, and medical history</p>
                </div>
                <Button onClick={handleViewPatients}>View Patients</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="working_hours">Working Hours</Label>
              <Input
                id="working_hours"
                value={editForm.working_hours}
                onChange={(e) => setEditForm(prev => ({ ...prev, working_hours: e.target.value }))}
                placeholder="e.g., Monday-Friday 9AM-5PM"
              />
            </div>
            <div>
              <Label htmlFor="contact_address">Contact Address</Label>
              <Input
                id="contact_address"
                value={editForm.contact_address}
                onChange={(e) => setEditForm(prev => ({ ...prev, contact_address: e.target.value }))}
                placeholder="Practice address"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Education & Certifications Dialog */}
      <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Education & Certifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Education Section */}
            <div>
              <Label className="text-base font-medium">Education</Label>
              <div className="space-y-2 mt-2">
                {educationForm.education.map((edu, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={edu} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={educationForm.newEducation}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, newEducation: e.target.value }))}
                    placeholder="Add new education entry"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addEducation()}
                  />
                  <Button onClick={addEducation} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Certifications Section */}
            <div>
              <Label className="text-base font-medium">Certifications</Label>
              <div className="space-y-2 mt-2">
                {educationForm.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={cert} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCertification(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={educationForm.newCertification}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, newCertification: e.target.value }))}
                    placeholder="Add new certification"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                  />
                  <Button onClick={addCertification} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEducationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEducation}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorProfile;
