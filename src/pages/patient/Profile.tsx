
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UserRound, Mail, Phone, MapPin, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

const PatientProfile = () => {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Find patient data from mock data
      const patient = mockPatients.find(p => p.id === user.id);
      if (patient) {
        setPatientData(patient);
      }
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Patient Data Not Found</h2>
        <p className="text-gray-600 mt-2">We couldn't retrieve your profile information.</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile summary card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={patientData.avatar} alt={patientData.name} />
              <AvatarFallback className="bg-medical-primary text-white text-xl">
                {getInitials(patientData.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-center">{patientData.name}</h2>
            <p className="text-gray-500 mb-4">Patient ID: {patientData.id}</p>
            
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                <span>{patientData.email}</span>
              </div>
              {patientData.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{patientData.phone || patientData.phoneNumber}</span>
                </div>
              )}
              {patientData.address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{patientData.address}</span>
                </div>
              )}
              {patientData.dateOfBirth && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Born {formatDate(patientData.dateOfBirth)}</span>
                </div>
              )}
            </div>
            
            <Button variant="outline" className="mt-6 w-full">
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
                    <p>{patientData.insuranceProvider || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p>{patientData.insuranceNumber || "Not provided"}</p>
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
                {patientData.medicalHistory && patientData.medicalHistory.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {patientData.medicalHistory.map((item, index) => (
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
              {patientData.emergencyContact ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{patientData.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p>{patientData.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{patientData.emergencyContact.phone || patientData.emergencyContact.phoneNumber}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700">
                  <p>No emergency contact provided</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Emergency Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
