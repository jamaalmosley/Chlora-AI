
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isNewDoctorSignup, setIsNewDoctorSignup] = useState(false);
  const [needsDoctorSetup, setNeedsDoctorSetup] = useState(false);

  useEffect(() => {
    console.log('Login component - isAuthenticated:', isAuthenticated, 'profile:', profile, 'isLoading:', isLoading);
    
    // Don't redirect if this is a new doctor signup that needs to complete setup
    if (isNewDoctorSignup || needsDoctorSetup) {
      console.log('Login: New doctor signup in progress, not redirecting');
      return;
    }
    
    // Check if authenticated doctor needs setup
    if (isAuthenticated && !isLoading && profile && profile.role === 'doctor') {
      console.log('Login: Checking if doctor needs practice setup');
      checkDoctorPracticeSetup();
      return;
    }
    
    // Only redirect if user is authenticated, not loading, has a profile, and NOT a doctor needing setup
    if (isAuthenticated && !isLoading && profile && !needsDoctorSetup) {
      console.log('Login: User is authenticated, preparing redirect');
      
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
  }, [isAuthenticated, profile, isLoading, navigate, isNewDoctorSignup, needsDoctorSetup]);

  const checkDoctorPracticeSetup = async () => {
    if (!profile) return;
    
    try {
      // Check if doctor is associated with any practice (via staff table)
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('id, practice_id')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No staff record found, needs practice setup
        console.log('Login: Doctor needs practice setup');
        setNeedsDoctorSetup(true);
        setIsNewDoctorSignup(true);
      } else if (staffData) {
        // Doctor is associated with a practice, can proceed to dashboard
        console.log('Login: Doctor practice setup complete, redirecting');
        navigate("/doctor", { replace: true });
      }
    } catch (err) {
      console.error('Error checking doctor practice setup:', err);
    }
  };

  const handleSetupComplete = () => {
    console.log('Login: Setup completed, resetting flags');
    setIsNewDoctorSignup(false);
    setNeedsDoctorSetup(false);
    // After setup is complete, the user will be redirected by the auth context
  };

  const handleDoctorSignupStart = () => {
    console.log('Login: Doctor signup started');
    setIsNewDoctorSignup(true);
    setNeedsDoctorSetup(true);
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

  // If already authenticated and not a new doctor signup, show a brief loading message while redirecting
  if (isAuthenticated && profile && !isNewDoctorSignup && !needsDoctorSetup) {
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
