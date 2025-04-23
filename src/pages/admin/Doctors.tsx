
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockDoctors } from "@/data/mockData";
import { Doctor } from "@/types";
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
  Users,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminDoctors = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);

  // Filter doctors based on search query
  const filteredDoctors = searchQuery 
    ? doctors.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : doctors;

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctor Management</h1>
        <p className="text-gray-600">
          View and manage doctors within the Chlora system
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search doctors..."
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
            Add New Doctor
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={doctor.avatar} />
                          <AvatarFallback className="bg-medical-light text-medical-primary">
                            {doctor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{doctor.name}</div>
                          <div className="text-sm text-gray-500">ID: {doctor.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-medical-light text-medical-primary border-none">
                        {doctor.specialty || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{doctor.email}</div>
                      <div className="text-sm text-gray-500">{doctor.phoneNumber || "No phone"}</div>
                    </TableCell>
                    <TableCell>
                      {doctor.patients ? doctor.patients.length : 0} patients
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Users className="h-4 w-4 text-medical-primary" />
                          <span className="sr-only">View Patients</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Calendar className="h-4 w-4 text-medical-secondary" />
                          <span className="sr-only">Schedule</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Records</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Doctor Info</DropdownMenuItem>
                            <DropdownMenuItem>Manage Schedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
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
              <h3 className="text-lg font-medium mb-1">No Doctors Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No doctors matching "${searchQuery}"`
                  : "There are no doctors in the system yet"}
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
};

export default AdminDoctors;
