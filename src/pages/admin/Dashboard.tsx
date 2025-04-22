
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, ChartBar, Settings, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Practice Management Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {user?.name}. Here's your practice overview.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-medical-primary" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">24</div>
            <p className="text-sm text-gray-500">Active staff members</p>
            <div className="mt-3">
              <Link to="/admin/doctors">
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  Manage Staff
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-medical-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">18</div>
            <p className="text-sm text-gray-500">Appointments scheduled</p>
            <div className="mt-3">
              <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                View Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-medical-primary" />
              Surgeries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">5</div>
            <p className="text-sm text-gray-500">This week</p>
            <div className="mt-3">
              <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                View Surgeries
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-medical-primary" />
              Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">876</div>
            <p className="text-sm text-gray-500">Registered patients</p>
            <div className="mt-3">
              <Link to="/admin/patients">
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  View Patients
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <ChartBar className="h-5 w-5 mr-2 text-medical-primary" />
                Practice Performance
              </CardTitle>
              <CardDescription>
                Monthly overview of appointments, surgeries, and patient satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Chart visualization would appear here</p>
                <p className="text-sm mt-2">
                  (Analytics data will be integrated with real practice metrics)
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-none">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-medical-light flex items-center justify-center">
                        <Activity className="h-4 w-4 text-medical-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {i === 0 && "Dr. Sarah Smith scheduled a new surgery"}
                        {i === 1 && "New patient registration completed"}
                        {i === 2 && "Staff meeting scheduled for Friday, 10 AM"}
                        {i === 3 && "Equipment maintenance completed"}
                        {i === 4 && "Monthly billing reports generated"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {i === 0 && "30 minutes ago"}
                        {i === 1 && "2 hours ago"}
                        {i === 2 && "Yesterday at 3:45 PM"}
                        {i === 3 && "Yesterday at 11:30 AM"}
                        {i === 4 && "2 days ago"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Button variant="ghost" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-medical-primary" />
                System Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <h3 className="font-medium text-yellow-800">Supply Inventory Alert</h3>
                  <p className="text-sm text-yellow-600 mt-1">
                    Surgical gloves inventory below threshold
                  </p>
                </div>
                
                <div className="p-3 rounded-lg border border-medical-light bg-blue-50">
                  <h3 className="font-medium text-medical-primary">License Renewal</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    2 staff licenses require renewal this month
                  </p>
                </div>
                
                <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <h3 className="font-medium text-green-800">System Update</h3>
                  <p className="text-sm text-green-600 mt-1">
                    Software update completed successfully
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <Button variant="outline" className="w-full">
                  View All Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Settings className="h-5 w-5 mr-2 text-medical-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full bg-medical-primary" size="sm">
                  Generate Reports
                </Button>
                <Button className="w-full bg-medical-secondary" size="sm">
                  Manage Staff Schedule
                </Button>
                <Button className="w-full bg-medical-secondary" size="sm">
                  Billing Overview
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
