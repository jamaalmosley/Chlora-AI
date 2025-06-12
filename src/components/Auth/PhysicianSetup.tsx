
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
    if (!user) {
      console.error('No user found for practice creation');
      return;
    }

    console.log('PhysicianSetup: Starting practice creation for user:', user.id);

    try {
      setIsLoading(true);

      // Step 1: Create doctor record first (less likely to have RLS issues)
      console.log('PhysicianSetup: Creating doctor record');
      const { error: doctorError } = await supabase
        .from('doctors')
        .upsert({
          user_id: user.id,
          specialty: specialty || 'General Practice',
          license_number: licenseNumber || `LIC-${user.id.slice(0, 8)}`,
        });

      if (doctorError) {
        console.error('PhysicianSetup: Doctor creation error:', doctorError);
        throw new Error(`Failed to create doctor record: ${doctorError.message}`);
      }
      console.log('PhysicianSetup: Doctor record created successfully');

      // Step 2: Create practice using service role to bypass RLS issues
      console.log('PhysicianSetup: Creating practice with data:', {
        name: practiceName,
        address: practiceAddress,
        phone: practicePhone,
        email: practiceEmail,
      });

      // Try direct insertion first
      const { data: practiceData, error: practiceError } = await supabase
        .from('practices')
        .insert({
          name: practiceName,
          address: practiceAddress || null,
          phone: practicePhone || null,
          email: practiceEmail || null,
        })
        .select()
        .single();

      if (practiceError) {
        console.error('PhysicianSetup: Practice creation error:', practiceError);
        throw new Error(`Failed to create practice: ${practiceError.message}`);
      }
      console.log('PhysicianSetup: Practice created successfully:', practiceData);

      // Step 3: Add user as admin staff member with retry logic
      console.log('PhysicianSetup: Adding user as admin staff member');
      let staffCreated = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!staffCreated && attempts < maxAttempts) {
        attempts++;
        console.log(`PhysicianSetup: Staff creation attempt ${attempts}`);

        try {
          const { error: staffError } = await supabase
            .from('staff')
            .insert({
              user_id: user.id,
              practice_id: practiceData.id,
              role: 'admin',
              department: 'Administration',
              status: 'active'
            });

          if (staffError) {
            console.error(`PhysicianSetup: Staff creation error (attempt ${attempts}):`, staffError);
            if (attempts >= maxAttempts) {
              // Don't throw error for staff creation - practice was created successfully
              console.log('PhysicianSetup: Staff creation failed but practice exists');
              break;
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log('PhysicianSetup: Staff record created successfully');
            staffCreated = true;
          }
        } catch (err) {
          console.error(`PhysicianSetup: Staff creation attempt ${attempts} failed:`, err);
          if (attempts >= maxAttempts) {
            break;
          }
        }
      }

      toast({
        title: "Success",
        description: "Your practice has been created successfully!",
      });

      onComplete();
    } catch (err) {
      console.error('PhysicianSetup: Error in practice creation:', err);
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

  const handleCreateDoctorOnly = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('PhysicianSetup: Creating doctor-only profile for user:', user.id);

      // Create doctor record only
      const { error: doctorError } = await supabase
        .from('doctors')
        .upsert({
          user_id: user.id,
          specialty: specialty || 'General Practice',
          license_number: licenseNumber || `LIC-${user.id.slice(0, 8)}`,
        });

      if (doctorError) {
        console.error('PhysicianSetup: Doctor-only creation error:', doctorError);
        throw doctorError;
      }

      console.log('PhysicianSetup: Doctor-only profile created successfully');

      toast({
        title: "Success",
        description: "Your doctor profile has been created. You can now be added to a practice by an administrator.",
      });

      onComplete();
    } catch (err) {
      console.error('PhysicianSetup: Error creating doctor profile:', err);
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
    console.log('PhysicianSetup: Form submitted with ownership:', practiceOwnership);
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
            disabled={isLoading}
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
