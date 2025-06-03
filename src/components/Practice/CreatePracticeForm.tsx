
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

  // Doctor details - made optional for demo
  const [specialty, setSpecialty] = useState('General Practice');
  const [licenseNumber, setLicenseNumber] = useState('DEMO-LICENSE');

  const handleCreatePractice = async () => {
    if (!user) {
      console.error('No user found');
      toast({
        title: "Error",
        description: "You must be logged in to create a practice.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting practice creation for user:', user.id);

    try {
      setIsLoading(true);

      // Create practice first
      console.log('Creating practice with data:', {
        name: practiceName,
        address: practiceAddress,
        phone: practicePhone,
        email: practiceEmail,
      });

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

      if (practiceError) {
        console.error('Practice creation error:', practiceError);
        throw practiceError;
      }

      console.log('Practice created successfully:', practiceData);

      // Update doctor record - always create/update for demo
      console.log('Updating doctor record with:', { specialty, licenseNumber });
      const { error: doctorError } = await supabase
        .from('doctors')
        .upsert({
          user_id: user.id,
          specialty: specialty || 'General Practice',
          license_number: licenseNumber || `DEMO-${user.id.slice(0, 8)}`,
        });

      if (doctorError) {
        console.error('Doctor update error:', doctorError);
        throw doctorError;
      }
      console.log('Doctor record updated successfully');

      // Add doctor as admin staff to the practice
      console.log('Adding user as admin staff to practice:', practiceData.id);
      
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: user.id,
          practice_id: practiceData.id,
          role: 'admin',
          department: 'Administration',
        });

      if (staffError) {
        console.error('Staff creation error:', staffError);
        throw staffError;
      }

      console.log('Staff record created successfully');

      toast({
        title: "Success",
        description: "Your practice has been created successfully!",
      });

      onPracticeCreated();
    } catch (err) {
      console.error('Error creating practice:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create practice. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
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
          disabled={isLoading || !practiceName}
          className="w-full bg-medical-primary hover:bg-medical-dark"
        >
          {isLoading ? "Creating..." : "Create Practice"}
        </Button>
      </CardContent>
    </Card>
  );
}
