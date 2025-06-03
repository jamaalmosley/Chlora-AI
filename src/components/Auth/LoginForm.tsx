
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicianSetup } from "./PhysicianSetup";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

interface LoginFormProps {
  onDoctorSignupStart?: () => void;
  onSetupComplete?: () => void;
}

export function LoginForm({ onDoctorSignupStart, onSetupComplete }: LoginFormProps) {
  const [showPhysicianSetup, setShowPhysicianSetup] = useState(false);

  const handlePhysicianSetupComplete = () => {
    console.log('Physician setup completed');
    setShowPhysicianSetup(false);
    onSetupComplete?.();
  };

  const handleDoctorSignupStart = () => {
    console.log('LoginForm: Doctor signup started');
    setShowPhysicianSetup(true);
    onDoctorSignupStart?.();
  };

  // Show physician setup if it's a doctor signup
  if (showPhysicianSetup) {
    console.log('Rendering PhysicianSetup component');
    return (
      <div className="w-full max-w-4xl mx-auto">
        <PhysicianSetup onComplete={handlePhysicianSetupComplete} />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-medical-primary">
          Chlora Medical Portal
        </CardTitle>
        <CardDescription className="text-center">
          Access your healthcare account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <SignInForm />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignUpForm 
              onDoctorSignupStart={handleDoctorSignupStart}
              onSetupComplete={onSetupComplete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
