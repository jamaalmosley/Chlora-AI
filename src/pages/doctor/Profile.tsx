
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Award, Clipboard, MapPin, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            
            <Button variant="outline" className="mt-6 w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Professional information */}
        <div className="md:col-span-2 space-y-6">
          {/* Education & Certifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Education & Certifications
              </CardTitle>
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
                  <Button variant="outline" size="sm">View Schedule</Button>
                  <Button size="sm">Manage Availability</Button>
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
                <Button>View Patients</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
