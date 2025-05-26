
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();

  const stats = [
    {
      title: "Total Patients",
      value: "1,234",
      description: "Active patients in the system",
      icon: Users,
      trend: "+5.2% from last month"
    },
    {
      title: "Total Doctors",
      value: "45",
      description: "Licensed physicians",
      icon: UserCheck,
      trend: "+2 new this month"
    },
    {
      title: "Appointments Today",
      value: "89",
      description: "Scheduled for today",
      icon: Calendar,
      trend: "12 pending confirmations"
    },
    {
      title: "System Usage",
      value: "94%",
      description: "Platform utilization",
      icon: TrendingUp,
      trend: "+8% from last week"
    }
  ];

  const userName = profile?.first_name || "Admin";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening in your healthcare system today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">New doctor registration</p>
                  <p className="text-xs text-gray-500">Dr. Sarah Johnson joined Cardiology</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">System maintenance completed</p>
                  <p className="text-xs text-gray-500">Database optimization finished</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Appointment surge detected</p>
                  <p className="text-xs text-gray-500">40% increase in bookings today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium">Add Doctor</h3>
                <p className="text-sm text-gray-500">Register new physician</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium">System Reports</h3>
                <p className="text-sm text-gray-500">Generate analytics</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium">User Management</h3>
                <p className="text-sm text-gray-500">Manage user accounts</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium">Settings</h3>
                <p className="text-sm text-gray-500">Configure system</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
