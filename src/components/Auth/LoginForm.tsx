import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicianSetup } from "./PhysicianSetup";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("patient");
  const [showPhysicianSetup, setShowPhysicianSetup] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { signIn, signUp, error, isLoading } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err) {
      // Error is handled in the auth context
    }
  };

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
      
      // If user is signing up as a doctor, show physician setup immediately
      if (role === 'doctor') {
        console.log('Doctor signup successful, showing physician setup');
        setIsSigningUp(false); // Stop loading immediately
        setShowPhysicianSetup(true);
        return; // Don't continue with normal flow
      }
      
      // For non-doctors, normal flow continues
      console.log('Non-doctor signup successful');
      
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      if (role !== 'doctor') {
        setIsSigningUp(false);
      }
    }
  };

  const handlePhysicianSetupComplete = () => {
    console.log('Physician setup completed');
    setShowPhysicianSetup(false);
    // Reset form state
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("patient");
    setIsSigningUp(false);
    // The user will be redirected by the auth context after profile is updated
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
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-medical-primary hover:bg-medical-dark" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
