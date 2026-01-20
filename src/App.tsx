import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/Layout/MainLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Patient Pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientChat from "./pages/patient/Chat";
import PatientAppointments from "./pages/patient/Appointments";
import PatientRecords from "./pages/patient/Records";
import PatientMedications from "./pages/patient/Medications";
import PatientProfile from "./pages/patient/Profile";

import AssignedPhysician from "@/pages/patient/AssignedPhysician";
import FindPhysician from "./pages/patient/FindPhysician";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorSchedule from "./pages/doctor/Schedule";
import DoctorSurgeries from "./pages/doctor/Surgeries";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorPractice from "./pages/doctor/Practice";
import DoctorStaff from "./pages/doctor/Staff";
import DoctorAppointments from "./pages/doctor/Appointments";

import DoctorSettings from "./pages/doctor/Settings";
import DoctorChatPage from "./pages/doctor/Chat";
import DoctorTestResults from "./pages/doctor/TestResults";

// Patient Pages (additional)
import PatientSettings from "./pages/patient/Settings";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDoctors from "./pages/admin/Doctors";
import AdminPatients from "./pages/admin/Patients";
import AdminPractices from "./pages/admin/Practices";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [],
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'profile:', profile, 'isLoading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light to-white flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    // Redirect based on role if trying to access unauthorized content
    if (profile.role === 'patient') {
      return <Navigate to="/patient" replace />;
    } else if (profile.role === 'doctor') {
      return <Navigate to="/doctor" replace />;
    } else if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// App content component that uses auth context
const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      
      {/* Patient routes */}
      <Route 
        path="/patient" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/chat" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientChat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/appointments" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAppointments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/records" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientRecords />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/medications" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMedications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/profile" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/physician" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AssignedPhysician />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/find-physician" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <FindPhysician />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/settings" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Doctor routes */}
      <Route 
        path="/doctor" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/patients" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPatients />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/appointments" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/settings" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/schedule" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSchedule />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/practice" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPractice />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/staff" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorStaff />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/surgeries" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSurgeries />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/profile" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/chat" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorChatPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/test-results" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorTestResults />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/practices" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPractices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/doctors" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDoctors />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/patients" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPatients />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <MainLayout>
            <AppContent />
          </MainLayout>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
