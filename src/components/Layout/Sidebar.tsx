import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Building,
  User,
  MessageSquare,
  Search,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
interface NavItem {
  label: string;
  path: string;
  icon: any;
}

export function Sidebar() {
  const { profile } = useAuth();
  const doctorNavigationItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/doctor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Practice",
      path: "/doctor/practice",
      icon: Building,
    },
    {
      label: "Patients",
      path: "/doctor/patients",
      icon: Users,
    },
    {
      label: "Test Results",
      path: "/doctor/test-results",
      icon: FileText,
    },
    {
      label: "Appointments",
      path: "/doctor/appointments",
      icon: Calendar,
    },
    {
      label: "Schedule",
      path: "/doctor/schedule",
      icon: Calendar,
    },
    {
      label: "Chat",
      path: "/doctor/chat",
      icon: MessageSquare,
    },
    {
      label: "Staff",
      path: "/doctor/staff",
      icon: Users,
    },
    {
      label: "Billing",
      path: "/doctor/billing",
      icon: FileText,
    },
    {
      label: "Settings",
      path: "/doctor/settings",
      icon: Settings,
    },
  ];

  const patientNavigationItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/patient/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Profile",
      path: "/patient/profile",
      icon: User,
    },
    {
      label: "Find Physician",
      path: "/patient/find-physician",
      icon: Search,
    },
    {
      label: "Medical Records",
      path: "/patient/records",
      icon: FileText,
    },
    {
      label: "Appointments",
      path: "/patient/appointments",
      icon: Calendar,
    },
    {
      label: "Billing",
      path: "/patient/billing",
      icon: FileText,
    },
    {
      label: "Chat",
      path: "/patient/chat",
      icon: Users,
    },
    {
      label: "Assigned Physician",
      path: "/patient/physician",
      icon: User,
    },
    {
      label: "Settings",
      path: "/patient/settings",
      icon: Settings,
    },
  ];

  const userRole = profile?.role || "doctor";

  const navigationItems =
    userRole === "doctor" ? doctorNavigationItems : patientNavigationItems;

  return (
    <div className="w-64 bg-gray-100 h-screen py-8 px-4">
      <nav className="space-y-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md
              ${
                isActive
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
