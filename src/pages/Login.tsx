
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { PhysicianSetup } from "@/components/Auth/PhysicianSetup";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { isAuthenticated, profile, isLoading, needsPracticeSetup, setNeedsPracticeSetup, refreshPracticeStatus, error } = useAuth();
  const navigate = useNavigate();
  const [showDoctorSetup, setShowDoctorSetup] = useState(false);

  useEffect(() => {
    console.log('Login component state:', { 
      isAuthenticated, 
      profile: profile?.role, 
      isLoading, 
      needsPracticeSetup, 
      showDoctorSetup,
      error
    });
    
    // Don't do anything while loading
    if (isLoading) {
      return;
    }

    // If there's an authentication error, don't redirect
    if (error) {
      return;
    }

    // If authenticated and we have a profile
    if (isAuthenticated && profile) {
      // Check if doctor needs practice setup
      if (profile.role === 'doctor' && needsPracticeSetup && !showDoctorSetup) {
        console.log('Login: Doctor needs practice setup, showing setup form');
        setShowDoctorSetup(true);
        return;
      }

      // If doctor setup is being shown, don't redirect
      if (showDoctorSetup) {
        return;
      }
      
      // Otherwise, redirect based on role
      console.log('Login: User is authenticated and setup complete, redirecting');
      const userRole = profile.role;
      
      if (userRole === "patient") {
        navigate("/patient", { replace: true });
      } else if (userRole === "doctor") {
        navigate("/doctor", { replace: true });
      } else if (userRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/patient", { replace: true });
      }
    }
  }, [isAuthenticated, profile, isLoading, needsPracticeSetup, showDoctorSetup, navigate, error]);

  const handleSetupComplete = async () => {
    console.log('Login: Doctor setup completed, refreshing practice status');
    setShowDoctorSetup(false);
    setNeedsPracticeSetup(false);
    
    // Refresh the practice status to make sure everything is properly set
    try {
      await refreshPracticeStatus();
    } catch (err) {
      console.error('Login: Error refreshing practice status:', err);
    }
    
    // The redirect will happen in the useEffect above
  };

  const handleDoctorSignupStart = () => {
    console.log('Login: Doctor signup started');
    // Don't immediately show setup - wait for profile and needsPracticeSetup to be set
  };

  // Show loading while checking auth status
  if (isLoading) {
    console.log('Login: Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Show doctor setup if needed
  if (showDoctorSetup && isAuthenticated && profile?.role === 'doctor' && needsPracticeSetup) {
    console.log('Login: Showing doctor setup form');
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-medical-primary mb-1">
              Chlora
            </h1>
            <p className="text-gray-600">
              Complete Your Practice Setup
            </p>
          </div>
          <PhysicianSetup onComplete={handleSetupComplete} />
          <p className="text-center mt-6 text-sm text-gray-500">
            © 2025 Chlora. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // If already authenticated and not a doctor needing setup, show loading while redirecting
  if (isAuthenticated && profile && !needsPracticeSetup) {
    console.log('Login: User authenticated and complete, showing redirect screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    );
  }

  console.log('Login: Showing login form');
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-medical-primary mb-1">
            Chlora
          </h1>
          <p className="text-gray-600">
            Streamlined Healthcare Management
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <LoginForm onDoctorSignupStart={handleDoctorSignupStart} onSetupComplete={handleSetupComplete} />
        <p className="text-center mt-6 text-sm text-gray-500">
          © 2025 Chlora. All rights reserved.
        </p>
      </div>
    </div>
  );
}
