
import { useAuth } from "@/context/AuthContext";
import { mockDoctors, mockPatients } from "@/data/mockData";
import { Doctor } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, User, Users, FileText, Activity } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctor = mockDoctors.find(d => d.id === user?.id) as Doctor | undefined;

  if (!doctor) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
        <p>Loading doctor data...</p>
      </div>
    );
  }

  const todayDate = new Date().toISOString().split('T')[0];
  const todaySchedule = doctor.schedule?.[todayDate] || [];
  const upcomingAppointments = todaySchedule.filter(slot => slot.booked).length;
  
  const patientList = doctor.patients
    ? mockPatients.filter(p => doctor.patients?.includes(p.id))
    : [];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {doctor.name}</h1>
        <p className="text-gray-600">
          Here's your schedule and patient overview
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-medical-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">
              {upcomingAppointments}
            </div>
            <p className="text-sm text-gray-500">Appointments scheduled</p>
            <div className="mt-3">
              <Link to="/doctor/schedule">
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  View Schedule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-medical-primary" />
              My Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">
              {patientList.length}
            </div>
            <p className="text-sm text-gray-500">Active patients</p>
            <div className="mt-3">
              <Link to="/doctor/patients">
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  View Patients
                </Button>
              </Link>
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
            <div className="text-2xl font-bold text-medical-primary">
              2
            </div>
            <p className="text-sm text-gray-500">Upcoming surgeries</p>
            <div className="mt-3">
              <Link to="/doctor/surgeries">
                <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                  View Surgeries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <FileText className="h-5 w-5 mr-2 text-medical-primary" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-primary">
              5
            </div>
            <p className="text-sm text-gray-500">Pending reviews</p>
            <div className="mt-3">
              <Button size="sm" className="w-full bg-medical-primary hover:bg-medical-dark">
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Today's Appointments</CardTitle>
              <CardDescription>
                Your schedule for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((slot, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center p-3 rounded-lg border ${
                        slot.booked 
                          ? "border-medical-primary bg-medical-light" 
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="mr-3">
                        <Clock className={`h-5 w-5 ${
                          slot.booked ? "text-medical-primary" : "text-gray-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {slot.start} - {slot.end}
                        </h3>
                        {slot.booked ? (
                          <div className="text-sm text-gray-600">
                            Appointment with John Doe
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Available
                          </div>
                        )}
                      </div>
                      {slot.booked && (
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No appointments scheduled for today</p>
              )}
              
              <div className="mt-4">
                <Link to="/doctor/schedule">
                  <Button variant="outline" className="w-full">
                    View Full Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-medical-primary" />
                Recent Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patientList.slice(0, 3).map(patient => (
                  <div key={patient.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                      <img src="/placeholder.svg" alt={patient.name} />
                    </div>
                    <div>
                      <h3 className="font-medium">{patient.name}</h3>
                      <p className="text-xs text-gray-500">Last visit: 3 days ago</p>
                    </div>
                  </div>
                ))}
                
                <Link to="/doctor/patients">
                  <Button variant="ghost" className="w-full mt-2">
                    View All Patients
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full bg-medical-primary" size="sm">
                  Schedule Appointment
                </Button>
                <Button className="w-full bg-medical-secondary" size="sm">
                  Create New Patient Record
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Generate Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
