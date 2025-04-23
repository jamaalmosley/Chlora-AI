
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DoctorSchedule = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define time slots for the schedule
  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM"
  ];

  useEffect(() => {
    // Simulate loading appointments from an API
    const loadAppointments = () => {
      setIsLoading(true);
      
      // Mock data - in a real app, this would be an API call
      setTimeout(() => {
        // Generate some mock appointments for the selected date
        const mockAppointments = [
          {
            id: "1",
            time: "09:00 AM",
            patientName: "Sarah Johnson",
            purpose: "Check-up",
            status: "confirmed"
          },
          {
            id: "2",
            time: "02:00 PM",
            patientName: "Michael Smith",
            purpose: "Post-operative follow-up",
            status: "confirmed"
          }
        ];
        
        setAppointments(mockAppointments);
        setIsLoading(false);
      }, 1000);
    };
    
    if (date) {
      loadAppointments();
    }
  }, [date]);

  const getAppointmentForTimeSlot = (time: string) => {
    return appointments.find(app => app.time === time);
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">My Schedule</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar picker */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>
        
        {/* Daily schedule */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Schedule for {date ? format(date, "MMMM d, yyyy") : "Today"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center my-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForTimeSlot(time);
                  
                  return (
                    <div 
                      key={time} 
                      className={cn(
                        "p-3 rounded-md border flex justify-between items-center",
                        appointment ? "bg-medical-light border-medical-primary" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-center">
                        <span className="font-medium w-20">{time}</span>
                        {appointment ? (
                          <div className="ml-4">
                            <p className="font-medium">{appointment.patientName}</p>
                            <p className="text-sm text-gray-600">{appointment.purpose}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 ml-4">Available</span>
                        )}
                      </div>
                      
                      <div>
                        {appointment ? (
                          <Button variant="outline" size="sm">View Details</Button>
                        ) : (
                          <Button variant="outline" size="sm">Add Appointment</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorSchedule;
