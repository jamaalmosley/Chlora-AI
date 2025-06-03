
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PracticeOwnershipSelection } from "./PracticeOwnershipSelection";
import { DoctorDetailsForm } from "./DoctorDetailsForm";
import { PracticeDetailsForm } from "./PracticeDetailsForm";

interface PhysicianSetupProps {
  onComplete: () => void;
}

export function PhysicianSetup({ onComplete }: PhysicianSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [practiceOwnership, setPracticeOwnership] = useState<'owner' | 'employee'>('owner');
  const [isLoading, setIsLoading] = useState(false);

  // Practice creation form
  const [practiceName, setPracticeName] = useState('');
  const [practiceAddress, setPracticeAddress] = useState('');
  const [practicePhone, setPracticePhone] = useState('');
  const [practiceEmail, setPracticeEmail] = useState('');

  // Doctor details
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleCreatePracticeAndDoctor = async () => {
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

      // Create doctor record
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          specialty,
          license_number: licenseNumber,
        });

      if (doctorError) throw doctorError;

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

      onComplete();
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

  const handleCreateDoctorOnly = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Create doctor record only
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          specialty,
          license_number: licenseNumber,
        });

      if (doctorError) throw doctorError;

      toast({
        title: "Success",
        description: "Your doctor profile has been created. You can now be added to a practice by an administrator.",
      });

      onComplete();
    } catch (err) {
      console.error('Error creating doctor profile:', err);
      toast({
        title: "Error",
        description: "Failed to create doctor profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (practiceOwnership === 'owner') {
      handleCreatePracticeAndDoctor();
    } else {
      handleCreateDoctorOnly();
    }
  };

  if (step === 1) {
    return (
      <PracticeOwnershipSelection
        practiceOwnership={practiceOwnership}
        setPracticeOwnership={setPracticeOwnership}
        onContinue={() => setStep(2)}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-medical-primary">
          {practiceOwnership === 'owner' ? 'Create Your Practice' : 'Complete Your Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DoctorDetailsForm
          specialty={specialty}
          setSpecialty={setSpecialty}
          licenseNumber={licenseNumber}
          setLicenseNumber={setLicenseNumber}
        />

        {practiceOwnership === 'owner' && (
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
        )}

        {practiceOwnership === 'employee' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
            <p className="text-blue-800 text-sm">
              After completing your profile, your practice administrator can add you to their practice using your email address.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !specialty || !licenseNumber || (practiceOwnership === 'owner' && !practiceName)}
            className="flex-1 bg-medical-primary hover:bg-medical-dark"
          >
            {isLoading ? "Creating..." : (practiceOwnership === 'owner' ? "Create Practice" : "Complete Setup")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
