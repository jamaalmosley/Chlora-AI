
import { useAuth } from "@/context/AuthContext";
import { mockDoctors, mockPatients } from "@/data/mockData";
import { Doctor, Patient } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  FileText, 
  Calendar, 
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

export default function DoctorPatients() {
  const { user } = useAuth();
  const doctor = mockDoctors.find(d => d.id === user?.id) as Doctor | undefined;
  const [searchQuery, setSearchQuery] = useState("");

  if (!doctor) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Patient Management</h1>
        <p>Loading doctor data...</p>
      </div>
    );
  }

  // Get patients assigned to this doctor
  const myPatients = doctor.patients
    ? mockPatients.filter(p => doctor.patients?.includes(p.id))
    : [];
    
  // Filter patients based on search query
  const filteredPatients = searchQuery 
    ? myPatients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : myPatients;

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patient Management</h1>
        <p className="text-gray-600">
          View and manage patient information and medical records
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search patients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            Filter
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
          <Button className="bg-medical-primary hover:bg-medical-dark">
            <Plus className="mr-1 h-4 w-4" />
            Add New Patient
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>My Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback className="bg-medical-light text-medical-primary">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-500">ID: {patient.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{patient.email}</div>
                      <div className="text-sm text-gray-500">{patient.phoneNumber}</div>
                    </TableCell>
                    <TableCell>{patient.dateOfBirth}</TableCell>
                    <TableCell>
                      {patient.upcomingAppointments && patient.upcomingAppointments.length > 0 ? (
                        <div>
                          <div>{patient.upcomingAppointments[0].date}</div>
                          <div className="text-sm text-gray-500">{patient.upcomingAppointments[0].time}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">None scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <FileText className="h-4 w-4 text-medical-primary" />
                          <span className="sr-only">View Records</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Calendar className="h-4 w-4 text-medical-secondary" />
                          <span className="sr-only">Schedule</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Message</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Full Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Patient Info</DropdownMenuItem>
                            <DropdownMenuItem>View Medical History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Patients Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No patients matching "${searchQuery}"`
                  : "You don't have any patients assigned yet"}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
