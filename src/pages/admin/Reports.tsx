
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  FileText, 
  Download,
  Calendar,
  Users
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const barData = [
  { name: 'Jan', appointments: 40, surgeries: 24 },
  { name: 'Feb', appointments: 30, surgeries: 13 },
  { name: 'Mar', appointments: 20, surgeries: 8 },
  { name: 'Apr', appointments: 27, surgeries: 10 },
  { name: 'May', appointments: 18, surgeries: 5 },
  { name: 'Jun', appointments: 23, surgeries: 9 },
];

const pieData = [
  { name: 'Cardiology', value: 30 },
  { name: 'Orthopedics', value: 25 },
  { name: 'Neurology', value: 15 },
  { name: 'Dermatology', value: 10 },
  { name: 'General Surgery', value: 20 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminReports = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<string>("6months");

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600">
          View and analyze system data and metrics
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Select defaultValue={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <span className="text-gray-500">
            Showing data for: <strong>{timeFrame === "30days" ? "Last 30 Days" : 
                               timeFrame === "6months" ? "Last 6 Months" : 
                               timeFrame === "year" ? "Past Year" : "All Time"}</strong>
          </span>
        </div>
        
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Reports
        </Button>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-medical-primary" />
                  Total Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medical-primary">
                  1,284
                </div>
                <p className="text-sm text-gray-500">
                  <span className="text-green-500">↑ 12%</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-medical-primary" />
                  Active Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medical-primary">
                  42
                </div>
                <p className="text-sm text-gray-500">
                  <span className="text-green-500">↑ 3%</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-medical-primary" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medical-primary">
                  856
                </div>
                <p className="text-sm text-gray-500">
                  <span className="text-red-500">↓ 5%</span> from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-medical-primary" />
                  Surgeries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medical-primary">
                  64
                </div>
                <p className="text-sm text-gray-500">
                  <span className="text-green-500">↑ 8%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Appointments & Surgeries</CardTitle>
                <CardDescription>6-month trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="appointments" fill="#0088FE" name="Appointments" />
                      <Bar dataKey="surgeries" fill="#00C49F" name="Surgeries" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Patient visits by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>System-wide activities in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>New patient registered</TableCell>
                    <TableCell>Emma Johnson</TableCell>
                    <TableCell>General Medicine</TableCell>
                    <TableCell>Apr 22, 2025 - 10:23 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Surgery scheduled</TableCell>
                    <TableCell>Dr. Alexander Mitchell</TableCell>
                    <TableCell>General Surgery</TableCell>
                    <TableCell>Apr 21, 2025 - 02:15 PM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>New doctor onboarded</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Cardiology</TableCell>
                    <TableCell>Apr 21, 2025 - 11:05 AM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Patient report updated</TableCell>
                    <TableCell>Dr. Sarah Williams</TableCell>
                    <TableCell>Neurology</TableCell>
                    <TableCell>Apr 20, 2025 - 04:30 PM</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patient Reports</CardTitle>
              <CardDescription>Additional patient reports and analytics will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 py-10 text-center">
                Patient analytics module is under development. Check back soon for detailed reports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Reports</CardTitle>
              <CardDescription>Additional doctor reports and analytics will be displayed here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 py-10 text-center">
                Doctor analytics module is under development. Check back soon for detailed reports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
};

export default AdminReports;
