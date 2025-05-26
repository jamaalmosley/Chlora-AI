
import { MoreHorizontal } from "lucide-react";
import { mockDoctors } from "@/data/mockData";
import { Doctor } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDoctors() {
  const doctorRows = mockDoctors.map((doctor) => (
    <TableRow key={doctor.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={doctor.avatar} alt={doctor.name} />
            <AvatarFallback>{doctor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{doctor.name}</p>
            <p className="text-sm text-muted-foreground">{doctor.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>{doctor.specialty}</TableCell>
      <TableCell>{doctor.patients?.length || 0}</TableCell>
      <TableCell>
        {doctor.contactInfo?.phone || "N/A"}
      </TableCell>
      <TableCell>
        <Badge variant={doctor.status === "active" ? "default" : "secondary"}>
          {doctor.status === "active" ? "Active" : "On Leave"}
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
        <p className="text-gray-600">Manage doctors in the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
          <CardDescription>
            View all doctors and their details. You can add, edit, or remove
            doctors from this list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Input type="search" placeholder="Search doctors..." />
              <Button>Add Doctor</Button>
            </div>
            <Separator />
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{doctorRows}</TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
