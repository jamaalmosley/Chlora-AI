
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login component - isAuthenticated:', isAuthenticated, 'profile:', profile, 'isLoading:', isLoading);
    
    if (isAuthenticated && !isLoading) {
      if (profile) {
        const userRole = profile.role;
        console.log('Redirecting user with role:', userRole);
        
        if (userRole === "patient") {
          navigate("/patient", { replace: true });
        } else if (userRole === "doctor") {
          navigate("/doctor", { replace: true });
        } else if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          // Default to patient if role is unclear
          navigate("/patient", { replace: true });
        }
      } else {
        // If authenticated but no profile yet, wait a bit then default to patient
        const timer = setTimeout(() => {
          console.log('No profile found, defaulting to patient dashboard');
          navigate("/patient", { replace: true });
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, profile, isLoading, navigate]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // If already authenticated, show a brief loading message while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-medical-primary mb-1">
            Chlora
          </h1>
          <p className="text-gray-600">
            Streamlined Healthcare Management
          </p>
        </div>
        <LoginForm />
        <p className="text-center mt-6 text-sm text-gray-500">
          © 2025 Chlora. All rights reserved.
        </p>
      </div>
    </div>
  );
}
