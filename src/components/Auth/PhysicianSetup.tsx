
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building, UserCheck } from "lucide-react";

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
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-medical-primary">
            Practice Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Do you own a practice or work for someone else?</Label>
            <RadioGroup
              value={practiceOwnership}
              onValueChange={(value) => setPracticeOwnership(value as 'owner' | 'employee')}
              className="mt-3"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-medical-primary" />
                    <div>
                      <div className="font-medium">I own a practice</div>
                      <div className="text-sm text-gray-600">Create and manage your own practice</div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-medical-primary" />
                    <div>
                      <div className="font-medium">I work for someone else</div>
                      <div className="text-sm text-gray-600">Join an existing practice</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            onClick={() => setStep(2)} 
            className="w-full bg-medical-primary hover:bg-medical-dark"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
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
        {/* Doctor Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Doctor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g., Cardiology, Orthopedics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Your medical license number"
                required
              />
            </div>
          </div>
        </div>

        {/* Practice Information (only if owner) */}
        {practiceOwnership === 'owner' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Practice Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="practice-name">Practice Name</Label>
                <Input
                  id="practice-name"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g., Smith Medical Center"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="practice-address">Address</Label>
                <Textarea
                  id="practice-address"
                  value={practiceAddress}
                  onChange={(e) => setPracticeAddress(e.target.value)}
                  placeholder="Full practice address"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="practice-phone">Phone Number</Label>
                  <Input
                    id="practice-phone"
                    value={practicePhone}
                    onChange={(e) => setPracticePhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practice-email">Email</Label>
                  <Input
                    id="practice-email"
                    type="email"
                    value={practiceEmail}
                    onChange={(e) => setPracticeEmail(e.target.value)}
                    placeholder="contact@practice.com"
                  />
                </div>
              </div>
            </div>
          </div>
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
