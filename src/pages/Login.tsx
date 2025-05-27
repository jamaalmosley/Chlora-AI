
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login component - isAuthenticated:', isAuthenticated, 'profile:', profile, 'isLoading:', isLoading);
    
    // Only redirect if user is authenticated, not loading, has a profile
    if (isAuthenticated && !isLoading && profile) {
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
  }, [isAuthenticated, profile, isLoading, navigate]);

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

  // If already authenticated, show a brief loading message while redirecting
  if (isAuthenticated && profile) {
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
        <LoginForm />
        <p className="text-center mt-6 text-sm text-gray-500">
          © 2025 Chlora. All rights reserved.
        </p>
      </div>
    </div>
  );
}
