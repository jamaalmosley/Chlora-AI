
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ClipboardList,
  Home,
  MessageSquare,
  Users,
  User,
  Settings,
  LayoutDashboard,
  FileText,
  Clock,
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const patientLinks = [
    {
      name: "Dashboard",
      path: "/patient",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Appointments",
      path: "/patient/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Medical Records",
      path: "/patient/records",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Medications",
      path: "/patient/medications",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      name: "Chat",
      path: "/patient/chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Profile",
      path: "/patient/profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const doctorLinks = [
    {
      name: "Dashboard",
      path: "/doctor",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Schedule",
      path: "/doctor/schedule",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: "Patients",
      path: "/doctor/patients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Surgeries",
      path: "/doctor/surgeries",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      name: "Profile",
      path: "/doctor/profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const adminLinks = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Doctors",
      path: "/admin/doctors",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Patients",
      path: "/admin/patients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const links = {
    patient: patientLinks,
    doctor: doctorLinks,
    admin: adminLinks,
  }[user.role];

  return (
    <div className="hidden md:block w-64 bg-sidebar text-sidebar-foreground border-r border-gray-200">
      <div className="h-full py-6 flex flex-col">
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-sidebar-primary">
            {user.role === "patient"
              ? "Patient Portal"
              : user.role === "doctor"
              ? "Doctor Portal"
              : "Admin Portal"}
          </h2>
        </div>
        <div className="space-y-1 px-3 flex-1">
          {links?.map((link) => (
            <Link to={link.path} key={link.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive(link.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                )}
              >
                {link.icon}
                <span className="ml-2">{link.name}</span>
              </Button>
            </Link>
          ))}
        </div>
        {user.role === "patient" && (
          <div className="p-4 mt-auto">
            <div className="rounded-lg bg-medical-light p-3">
              <h3 className="font-medium text-medical-primary mb-1">Need help?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Use our chatbot for assistance or questions
              </p>
              <Link to="/patient/chat">
                <Button size="sm" className="w-full bg-medical-primary text-white">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Chat
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
