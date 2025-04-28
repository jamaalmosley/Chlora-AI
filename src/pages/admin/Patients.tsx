import { useState } from "react";
import { mockPatients } from "@/data/mockData";
import { Patient } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const getBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    case "pending":
      return "destructive";
    default:
      return "default";
  }
};

export default function AdminPatients() {
  const [searchQuery, setSearchQuery] = useState("");

const patientRows = mockPatients.map((patient) => (
  <TableRow key={patient.id}>
    <TableCell>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={patient.avatar} alt={patient.name} />
          <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{patient.name}</p>
          <p className="text-sm text-muted-foreground">{patient.email}</p>
        </div>
      </div>
    </TableCell>
    <TableCell>{patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : "N/A"}</TableCell>
    <TableCell>{formatDate(patient.upcomingAppointments?.[0]?.date || "")}</TableCell>
    <TableCell>
      {patient.upcomingAppointments?.[0]?.doctor || "No doctor assigned"}
    </TableCell>
    <TableCell>
      <Badge variant={getBadgeVariant(patient.status || "")}>
        {patient.status || "Active"}
      </Badge>
    </TableCell>
    <TableCell>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </TableCell>
  </TableRow>
));

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-1">
              <Input
                type="search"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-2 text-right">
              <Button>Add Patient</Button>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientRows}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
