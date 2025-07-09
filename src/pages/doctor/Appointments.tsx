import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus } from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  duration: number;
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      patientName: "John Smith",
      date: "2024-01-16",
      time: "09:00",
      type: "Consultation",
      status: "scheduled",
      duration: 30
    },
    {
      id: "2", 
      patientName: "Sarah Johnson",
      date: "2024-01-16",
      time: "10:30",
      type: "Follow-up",
      status: "scheduled",
      duration: 15
    },
    {
      id: "3",
      patientName: "Mike Brown",
      date: "2024-01-16",
      time: "14:00",
      type: "Physical Exam",
      status: "completed",
      duration: 45
    },
    {
      id: "4",
      patientName: "Emily Davis",
      date: "2024-01-17",
      time: "11:00",
      type: "Consultation",
      status: "scheduled",
      duration: 30
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'default';
    }
  };

  const todayAppointments = appointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0]
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) > new Date() || 
    (apt.date === new Date().toISOString().split('T')[0] && apt.status === 'scheduled')
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-medical-primary" />
          <h1 className="text-3xl font-bold text-medical-primary">Appointments</h1>
        </div>
        <Button className="bg-medical-primary hover:bg-medical-dark">
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments.filter(apt => apt.status === 'scheduled').length} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-semibold">{appointment.time}</div>
                      <div className="text-sm text-gray-500">{appointment.duration}m</div>
                    </div>
                    <div>
                      <div className="font-medium">{appointment.patientName}</div>
                      <div className="text-sm text-gray-500">{appointment.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No appointments scheduled for today
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-semibold">{new Date(appointment.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{appointment.time}</div>
                  </div>
                  <div>
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-sm text-gray-500">{appointment.type} • {appointment.duration}m</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}