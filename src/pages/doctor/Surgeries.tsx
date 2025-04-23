
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { format, isFuture, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Surgery {
  id: string;
  date: string;
  time: string;
  patient: {
    id: string;
    name: string;
  };
  procedure: string;
  duration: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  location: string;
}

const DoctorSurgeries = () => {
  const { user } = useAuth();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading surgeries from an API
    const loadSurgeries = () => {
      setIsLoading(true);
      
      // Mock data - in a real app, this would be an API call
      setTimeout(() => {
        const mockSurgeries: Surgery[] = [
          {
            id: "1",
            date: "2025-05-15",
            time: "09:00 AM",
            patient: {
              id: "p1",
              name: "Robert Thompson"
            },
            procedure: "Appendectomy",
            duration: "1.5 hours",
            status: "scheduled",
            location: "Operating Room 3",
            notes: "Patient has history of hypertension."
          },
          {
            id: "2",
            date: "2025-05-20",
            time: "02:00 PM",
            patient: {
              id: "p2",
              name: "Jennifer Adams"
            },
            procedure: "Gallbladder Removal",
            duration: "2 hours",
            status: "scheduled",
            location: "Operating Room 1"
          },
          {
            id: "3",
            date: "2025-03-10",
            time: "10:00 AM",
            patient: {
              id: "p3",
              name: "David Wilson"
            },
            procedure: "Hernia Repair",
            duration: "1 hour",
            status: "completed",
            location: "Operating Room 2",
            notes: "Patient recovered well. Follow-up in 2 weeks."
          }
        ];
        
        setSurgeries(mockSurgeries);
        setIsLoading(false);
      }, 1000);
    };
    
    loadSurgeries();
  }, []);

  const upcomingSurgeries = surgeries.filter(surgery => 
    isFuture(new Date(`${surgery.date}T${surgery.time}`)) && 
    surgery.status !== "cancelled"
  );
  
  const pastSurgeries = surgeries.filter(surgery => 
    isPast(new Date(`${surgery.date}T${surgery.time}`)) || 
    surgery.status === "completed"
  );

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const SurgeryCard = ({ surgery }: { surgery: Surgery }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{surgery.procedure}</h3>
            <p className="text-gray-600">Patient: {surgery.patient.name}</p>
          </div>
          <Badge className={statusColors[surgery.status]}>
            {surgery.status.charAt(0).toUpperCase() + surgery.status.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{format(new Date(surgery.date), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{surgery.time} ({surgery.duration})</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span>{surgery.patient.name}</span>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2 text-gray-500"
            >
              <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
              <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
              <path d="M5 11V9" />
              <path d="M19 11V9" />
            </svg>
            <span>{surgery.location}</span>
          </div>
        </div>
        
        {surgery.notes && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">{surgery.notes}</p>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" className="mr-2">
            View Details
          </Button>
          {surgery.status === "scheduled" && (
            <Button size="sm">
              Prepare
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">My Surgeries</h1>
      
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="flex justify-center my-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
            </div>
          ) : upcomingSurgeries.length > 0 ? (
            <div>
              {upcomingSurgeries.map(surgery => (
                <SurgeryCard key={surgery.id} surgery={surgery} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-600">No Upcoming Surgeries</h2>
              <p className="text-gray-500 mt-2">You don't have any surgeries scheduled at this time.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {isLoading ? (
            <div className="flex justify-center my-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
            </div>
          ) : pastSurgeries.length > 0 ? (
            <div>
              {pastSurgeries.map(surgery => (
                <SurgeryCard key={surgery.id} surgery={surgery} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-600">No Past Surgeries</h2>
              <p className="text-gray-500 mt-2">You don't have any completed surgeries in the system.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorSurgeries;
