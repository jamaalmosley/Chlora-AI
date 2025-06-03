
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DoctorDetailsForm } from "@/components/Auth/DoctorDetailsForm";
import { PracticeDetailsForm } from "@/components/Auth/PracticeDetailsForm";

interface CreatePracticeFormProps {
  onPracticeCreated: () => void;
}

export function CreatePracticeForm({ onPracticeCreated }: CreatePracticeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Practice creation form
  const [practiceName, setPracticeName] = useState('');
  const [practiceAddress, setPracticeAddress] = useState('');
  const [practicePhone, setPracticePhone] = useState('');
  const [practiceEmail, setPracticeEmail] = useState('');

  // Doctor details
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleCreatePractice = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Create practice first
      const { data: practiceData, error: practiceError } = await supabase
        .from('practices')
        .insert({
          name: practiceName,
          address: practiceAddress,
          phone: practicePhone,
          email: practiceEmail,
        })
        .select()
        .single();

      if (practiceError) throw practiceError;

      // Update doctor record if needed
      if (specialty && licenseNumber) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .upsert({
            user_id: user.id,
            specialty,
            license_number: licenseNumber,
          });

        if (doctorError) throw doctorError;
      }

      // Add doctor as admin staff to the practice
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: user.id,
          practice_id: practiceData.id,
          role: 'admin',
          department: 'Administration',
          permissions: ['view_patients', 'manage_patients', 'manage_staff', 'schedule_appointments', 'manage_practice'],
        });

      if (staffError) throw staffError;

      toast({
        title: "Success",
        description: "Your practice has been created successfully!",
      });

      onPracticeCreated();
    } catch (err) {
      console.error('Error creating practice:', err);
      toast({
        title: "Error",
        description: "Failed to create practice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-medical-primary">
          Create Your Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DoctorDetailsForm
          specialty={specialty}
          setSpecialty={setSpecialty}
          licenseNumber={licenseNumber}
          setLicenseNumber={setLicenseNumber}
        />

        <PracticeDetailsForm
          practiceName={practiceName}
          setPracticeName={setPracticeName}
          practiceAddress={practiceAddress}
          setPracticeAddress={setPracticeAddress}
          practicePhone={practicePhone}
          setPracticePhone={setPracticePhone}
          practiceEmail={practiceEmail}
          setPracticeEmail={setPracticeEmail}
        />

        <Button 
          onClick={handleCreatePractice}
          disabled={isLoading || !specialty || !licenseNumber || !practiceName}
          className="w-full bg-medical-primary hover:bg-medical-dark"
        >
          {isLoading ? "Creating..." : "Create Practice"}
        </Button>
      </CardContent>
    </Card>
  );
}
