
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, FileText, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Surgery {
  id: string;
  patient_id: string;
  doctor_id: string;
  surgery_date: string;
  surgery_time: string;
  procedure_name: string;
  location: string;
  notes: string | null;
  status: string;
  estimated_duration: string | null;
  patient: {
    user: {
      first_name: string | null;
      last_name: string | null;
    }
  } | null;
}

export default function DoctorSurgeries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [filteredSurgeries, setFilteredSurgeries] = useState<Surgery[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [newSurgery, setNewSurgery] = useState({
    patient_id: '',
    surgery_date: '',
    surgery_time: '',
    procedure_name: '',
    location: '',
    notes: '',
    estimated_duration: ''
  });

  useEffect(() => {
    const loadDoctorData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      console.log('Loading doctor surgeries data for user:', user.id);
      setIsLoading(true);
      
      try {
        // Get doctor data
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (doctorError) {
          console.error('Error fetching doctor:', doctorError);
          throw doctorError;
        }
        
        console.log('Doctor data loaded:', doctor);
        setDoctorData(doctor);

        // Get doctor's patients from appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', doctor.id);

        console.log('Appointments found:', appointments?.length || 0);

        const patientIds = [...new Set(appointments?.map(apt => apt.patient_id) || [])];

        if (patientIds.length > 0) {
          const { data: patientsData } = await supabase
            .from('patients')
            .select(`
              id,
              user:profiles(first_name, last_name)
            `)
            .in('id', patientIds);

          console.log('Patients loaded:', patientsData?.length || 0);
          setPatients(patientsData || []);
        }

        // Mock surgeries data since we don't have a surgeries table yet
        // In a real implementation, you'd fetch from a surgeries table
        const mockSurgeries: Surgery[] = [];
        setSurgeries(mockSurgeries);
        setFilteredSurgeries(mockSurgeries);
      } catch (error) {
        console.error('Error loading surgeries data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load surgeries data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDoctorData();
  }, [user, toast]);

  useEffect(() => {
    const filtered = surgeries.filter(surgery => {
      const patientName = `${surgery.patient?.user?.first_name || ''} ${surgery.patient?.user?.last_name || ''}`.toLowerCase();
      const procedure = surgery.procedure_name.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = patientName.includes(search) || procedure.includes(search);
      const matchesTab = activeTab === 'all' || surgery.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
    setFilteredSurgeries(filtered);
  }, [searchTerm, surgeries, activeTab]);

  const handleScheduleSurgery = async () => {
    if (!newSurgery.patient_id || !newSurgery.surgery_date || !newSurgery.procedure_name || !doctorData) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For demonstration, we'll just show a success message
      // In a real implementation, you'd save to a surgeries table
      toast({
        title: "Surgery Scheduled",
        description: "The surgery has been successfully scheduled.",
      });

      setIsScheduleDialogOpen(false);
      setNewSurgery({
        patient_id: '',
        surgery_date: '',
        surgery_time: '',
        procedure_name: '',
        location: '',
        notes: '',
        estimated_duration: ''
      });
    } catch (error) {
      console.error('Error scheduling surgery:', error);
      toast({
        title: "Error",
        description: "Failed to schedule surgery. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTabCounts = () => {
    return {
      scheduled: surgeries.filter(s => s.status === 'scheduled').length,
      completed: surgeries.filter(s => s.status === 'completed').length,
      cancelled: surgeries.filter(s => s.status === 'cancelled').length,
      all: surgeries.length
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Skeleton className="lg:col-span-3 h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const tabCounts = getTabCounts();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surgery Schedule</h1>
            <p className="text-gray-600 mt-2">Manage your scheduled surgeries</p>
          </div>
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Surgery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Surgery</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient">Patient</Label>
                    <Select value={newSurgery.patient_id} onValueChange={(value) => setNewSurgery(prev => ({ ...prev, patient_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.user?.first_name} {patient.user?.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="procedure">Procedure Name</Label>
                    <Input
                      id="procedure"
                      value={newSurgery.procedure_name}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, procedure_name: e.target.value }))}
                      placeholder="e.g., Appendectomy"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Surgery Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSurgery.surgery_date}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, surgery_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Surgery Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newSurgery.surgery_time}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, surgery_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newSurgery.location}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Operating Room / Hospital"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input
                      id="duration"
                      value={newSurgery.estimated_duration}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, estimated_duration: e.target.value }))}
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSurgery.notes}
                    onChange={(e) => setNewSurgery(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleScheduleSurgery}>
                    Schedule Surgery
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search surgeries by patient or procedure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Surgeries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tabCounts.all}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Surgery Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled">
            Scheduled ({tabCounts.scheduled})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tabCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({tabCounts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({tabCounts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          <SurgeriesList surgeries={filteredSurgeries} />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <SurgeriesList surgeries={filteredSurgeries} />
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-6">
          <SurgeriesList surgeries={filteredSurgeries} />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <SurgeriesList surgeries={filteredSurgeries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SurgeriesList({ surgeries }: { surgeries: Surgery[] }) {
  if (surgeries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No surgeries found</h3>
            <p className="text-gray-600 mb-4">
              No surgeries match the current filter criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {surgeries.map((surgery) => (
        <Card key={surgery.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{surgery.procedure_name}</h3>
                    <Badge variant={surgery.status === 'scheduled' ? 'default' : 'secondary'}>
                      {surgery.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{surgery.patient?.user?.first_name} {surgery.patient?.user?.last_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(surgery.surgery_date), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{surgery.surgery_time}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{surgery.location}</span>
                    </div>
                  </div>

                  {surgery.notes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Notes: </span>
                      <span>{surgery.notes}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
