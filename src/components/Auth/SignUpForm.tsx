
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SignUpFormProps {
  onDoctorSignupStart?: () => void;
  onSetupComplete?: () => void;
}

export function SignUpForm({ onDoctorSignupStart, onSetupComplete }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("patient");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { signUp, error, isLoading } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    
    try {
      console.log('Starting signup process for role:', role);
      
      const result = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: role
      });
      
      console.log('Signup result:', result);
      
      // If user is signing up as a doctor, the needsPracticeSetup will be set by AuthContext
      if (role === 'doctor') {
        console.log('Doctor signup successful, setup flow will be handled by AuthContext');
        onDoctorSignupStart?.();
      }
      
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">I am a:</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor/Physician</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      
      {role === 'doctor' && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">Physician Registration</p>
          <p>After creating your account, you'll be guided through setting up your practice or joining an existing one.</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-medical-primary hover:bg-medical-dark" 
        disabled={isLoading || isSigningUp}
      >
        {isLoading || isSigningUp ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
