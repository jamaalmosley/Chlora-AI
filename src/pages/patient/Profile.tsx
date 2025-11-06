
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UserRound, Mail, Phone, MapPin, AlertCircle, Calendar, Edit } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EditProfileDialog } from "@/components/Patient/EditProfileDialog";

interface PatientData {
  id: string;
  date_of_birth: string | null;
  address: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  medical_history: string[] | null;
  allergies: string[] | null;
  status: string;
}

const PatientProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setPatientData(data);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const handleUpdateProfile = (updatedData: PatientData) => {
    setPatientData(updatedData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  if (!patientData || !profile) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Patient Data Not Found</h2>
        <p className="text-gray-600 mt-2">We couldn't retrieve your profile information.</p>
      </div>
    );
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
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
            <p className="text-gray-500 mb-4">Patient ID: {patientData.id}</p>
            
            <div className="w-full space-y-3 mt-4">
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
              {patientData.address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{patientData.address}</span>
                </div>
              )}
              {patientData.date_of_birth && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Born {formatDate(patientData.date_of_birth)}</span>
                </div>
              )}
            </div>
            
            <Button variant="outline" className="mt-6 w-full" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Personal information sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Medical information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>Your health records and important medical details</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Insurance information */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Provider</p>
                    <p>{patientData.insurance_provider || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p>{patientData.insurance_number || "Not provided"}</p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Allergies */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
                {patientData.allergies && patientData.allergies.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {patientData.allergies.map((allergy, index) => (
                      <li key={index} className="text-gray-800">{allergy}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No known allergies</p>
                )}
              </div>
              
              <Separator className="my-4" />
              
              {/* Medical History */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Medical History</h3>
                {patientData.medical_history && patientData.medical_history.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {patientData.medical_history.map((item, index) => (
                      <li key={index} className="text-gray-800">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No medical history recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.emergency_contact_name ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{patientData.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p>{patientData.emergency_contact_relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{patientData.emergency_contact_phone}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700">
                  <p>No emergency contact provided</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {patientData && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          patientData={patientData}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default PatientProfile;
