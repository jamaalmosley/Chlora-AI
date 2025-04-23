
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/Auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "patient") {
        navigate("/patient");
      } else if (user.role === "doctor") {
        navigate("/doctor");
      } else if (user.role === "admin") {
        navigate("/admin");
      }
    }
  }, [isAuthenticated, user, navigate]);

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
