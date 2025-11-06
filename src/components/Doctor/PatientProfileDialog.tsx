import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";

interface PatientData {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  address: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  medical_history: string[] | null;
  allergies: string[] | null;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface PatientProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

export function PatientProfileDialog({ open, onOpenChange, patientId }: PatientProfileDialogProps) {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patientEmail, setPatientEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!open || !patientId) return;
      
      setIsLoading(true);
      try {
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single();

        if (patientError) throw patientError;
        setPatientData(patient);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, avatar_url")
          .eq("id", patient.user_id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Fetch user email (only accessible to doctors via RLS)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && patient.user_id) {
          // Try to get email from a custom RPC or just skip for now
          // For now we'll just not show email unless we add proper RLS
          setPatientEmail("");
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [open, patientId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Unknown Patient";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Profile</DialogTitle>
        </DialogHeader>

        {patientData && profile ? (
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || ""} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <p className="text-muted-foreground">Patient ID: {patientData.id.slice(0, 8)}</p>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{patientEmail}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {patientData.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{patientData.address}</span>
                  </div>
                )}
                {patientData.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>Born {formatDate(patientData.date_of_birth)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{patientData.insurance_provider || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Policy Number</p>
                    <p className="font-medium">{patientData.insurance_number || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Medical History */}
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Past conditions and procedures</CardDescription>
                </CardHeader>
                <CardContent>
                  {patientData.medical_history && patientData.medical_history.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {patientData.medical_history.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No medical history recorded</p>
                  )}
                </CardContent>
              </Card>

              {/* Allergies */}
              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                  <CardDescription>Known allergies and reactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {patientData.allergies && patientData.allergies.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {patientData.allergies.map((allergy, index) => (
                        <li key={index} className="text-red-600 font-medium">{allergy}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No known allergies</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {patientData.emergency_contact_name ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{patientData.emergency_contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium">{patientData.emergency_contact_relationship}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patientData.emergency_contact_phone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contact provided</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Unable to load patient information
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
