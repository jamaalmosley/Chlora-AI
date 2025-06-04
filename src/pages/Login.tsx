import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { PhysicianSetup } from "@/components/Auth/PhysicianSetup";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { isAuthenticated, profile, isLoading, needsPracticeSetup, setNeedsPracticeSetup } = useAuth();
  const navigate = useNavigate();
  const [showDoctorSetup, setShowDoctorSetup] = useState(false);

  useEffect(() => {
    console.log('Login component - isAuthenticated:', isAuthenticated, 'profile:', profile, 'isLoading:', isLoading, 'needsPracticeSetup:', needsPracticeSetup);
    
    // Don't redirect if we're still loading or if doctor needs practice setup
    if (isLoading || showDoctorSetup) {
      return;
    }
    
    // If authenticated and profile exists
    if (isAuthenticated && profile) {
      // If doctor needs practice setup, show setup instead of redirecting
      if (profile.role === 'doctor' && needsPracticeSetup) {
        console.log('Login: Doctor needs practice setup, showing setup form');
        setShowDoctorSetup(true);
        return;
      }
      
      // Otherwise, redirect based on role
      console.log('Login: User is authenticated and setup complete, preparing redirect');
      const userRole = profile.role;
      console.log('Login: Redirecting user with role:', userRole);
      
      if (userRole === "patient") {
        console.log('Login: Navigating to patient dashboard');
        navigate("/patient", { replace: true });
      } else if (userRole === "doctor") {
        console.log('Login: Navigating to doctor dashboard');
        navigate("/doctor", { replace: true });
      } else if (userRole === "admin") {
        console.log('Login: Navigating to admin dashboard');
        navigate("/admin", { replace: true });
      } else {
        console.log('Login: Unknown role, defaulting to patient dashboard');
        navigate("/patient", { replace: true });
      }
    }
  }, [isAuthenticated, profile, isLoading, needsPracticeSetup, navigate, showDoctorSetup]);

  const handleSetupComplete = () => {
    console.log('Login: Doctor setup completed');
    setShowDoctorSetup(false);
    setNeedsPracticeSetup(false);
    // The redirect will happen in the useEffect above
  };

  const handleDoctorSignupStart = () => {
    console.log('Login: Doctor signup started, will check for practice setup after auth');
    // The needsPracticeSetup check will happen in AuthContext after profile is loaded
  };

  // Show loading while checking auth status
  if (isLoading) {
    console.log('Login: Showing loading screen - auth check in progress');
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Show doctor setup if needed
  if (showDoctorSetup || (isAuthenticated && profile?.role === 'doctor' && needsPracticeSetup)) {
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
    console.log('Login: User authenticated, showing redirect screen');
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
        <LoginForm onDoctorSignupStart={handleDoctorSignupStart} onSetupComplete={handleSetupComplete} />
        <p className="text-center mt-6 text-sm text-gray-500">
          © 2025 Chlora. All rights reserved.
        </p>
      </div>
    </div>
  );
}
