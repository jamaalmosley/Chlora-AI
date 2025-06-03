
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

  // Practice creation form - with demo defaults
  const [practiceName, setPracticeName] = useState('Demo Medical Center');
  const [practiceAddress, setPracticeAddress] = useState('123 Demo Street, Demo City, DC 12345');
  const [practicePhone, setPracticePhone] = useState('(555) 123-4567');
  const [practiceEmail, setPracticeEmail] = useState('contact@demo-medical.com');

  // Doctor details - made optional for demo
  const [specialty, setSpecialty] = useState('General Practice');
  const [licenseNumber, setLicenseNumber] = useState('DEMO-LICENSE-12345');

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
        throw new Error(`Failed to create practice: ${practiceError.message}`);
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
        throw new Error(`Failed to update doctor record: ${doctorError.message}`);
      }
      console.log('Doctor record updated successfully');

      // Add doctor as admin staff to the practice using the security definer function
      console.log('Adding user as admin staff to practice using function:', practiceData.id);
      
      const { data: staffResult, error: staffError } = await supabase
        .rpc('create_staff_record', {
          p_user_id: user.id,
          p_practice_id: practiceData.id,
          p_role: 'admin',
          p_department: 'Administration'
        });

      if (staffError) {
        console.error('Staff creation error:', staffError);
        throw new Error(`Failed to create staff record: ${staffError.message}`);
      }

      console.log('Staff record created successfully with ID:', staffResult);

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
        <p className="text-center text-sm text-gray-600">
          Demo form - all fields are pre-filled with sample data
        </p>
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
