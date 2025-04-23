
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileText, Calendar, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function PatientRecords() {
  const { user } = useAuth();
  const patient = mockPatients.find(p => p.id === user?.id) as Patient | undefined;

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Medical Records</h1>
        <p>Loading patient data...</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Mock medical records data (in a real app, this would come from an API)
  const records = [
    {
      id: "rec1",
      type: "Lab Results",
      date: "2024-04-01",
      doctor: "Dr. Sarah Smith",
      summary: "Complete blood count - Normal results",
      status: "completed"
    },
    {
      id: "rec2",
      type: "X-Ray",
      date: "2024-03-15",
      doctor: "Dr. Michael Chen",
      summary: "Chest X-ray - No abnormalities detected",
      status: "completed"
    },
    {
      id: "rec3",
      type: "Surgery Report",
      date: "2023-11-20",
      doctor: "Dr. Sarah Smith",
      summary: "Laparoscopic appendectomy - Successful procedure",
      status: "completed"
    },
    {
      id: "rec4",
      type: "Follow-up Notes",
      date: "2024-02-10",
      doctor: "Dr. Sarah Smith",
      summary: "Post-surgery evaluation - Recovery progressing well",
      status: "completed"
    }
  ];

  const allergies = patient.allergies || ["No known allergies"];
  const medicalHistory = patient.medicalHistory || ["No medical history recorded"];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medical Records</h1>
        <p className="text-gray-600">
          View and manage your medical history and test results
        </p>
      </div>

      <Tabs defaultValue="records" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-medical-primary" />
                Your Medical Records
              </CardTitle>
              <CardDescription>
                A comprehensive list of your medical tests, procedures, and visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length > 0 ? (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.type}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.doctor}</TableCell>
                        <TableCell>{record.summary}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-medical-primary" />
                Medical History
              </CardTitle>
              <CardDescription>
                Your historical medical conditions and procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {medicalHistory.map((item, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-md">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-medical-primary" />
                Allergies and Reactions
              </CardTitle>
              <CardDescription>
                Important information about your allergies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {allergies.map((allergy, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-md flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    {allergy}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
