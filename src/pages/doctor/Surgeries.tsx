import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, FileText, Plus, Search, ClipboardCheck, Camera, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SurgeryChecklistDialog } from "@/components/Surgery/SurgeryChecklistDialog";
import { PreOpImagesDialog } from "@/components/Surgery/PreOpImagesDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Surgery {
  id: string;
  patient_id: string;
  doctor_id: string;
  surgery_date: string;
  procedure_name: string;
  location: string | null;
  notes: string | null;
  status: string;
  patient?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  checklist_progress?: {
    completed: number;
    total: number;
  };
}

export default function DoctorSurgeries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("scheduled");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedSurgeryForChecklist, setSelectedSurgeryForChecklist] = useState<Surgery | null>(null);
  const [selectedSurgeryForImages, setSelectedSurgeryForImages] = useState<Surgery | null>(null);
  const [newSurgery, setNewSurgery] = useState({
    patient_id: '',
    surgery_date: '',
    procedure_name: '',
    location: '',
    notes: '',
  });

  // Fetch doctor data
  const { data: doctorData } = useQuery({
    queryKey: ['doctor', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch patients for the doctor
  const { data: patients = [] } = useQuery({
    queryKey: ['doctor-patients', doctorData?.id],
    queryFn: async () => {
      if (!doctorData?.id) return [];
      
      // Get patients from appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorData.id);

      const patientIds = [...new Set(appointments?.map(apt => apt.patient_id) || [])];
      
      if (patientIds.length === 0) return [];

      const { data: patientsData } = await supabase
        .from('patients')
        .select(`id, profiles:user_id(first_name, last_name)`)
        .in('id', patientIds);

      return patientsData || [];
    },
    enabled: !!doctorData?.id,
  });

  // Fetch surgeries
  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['surgeries', doctorData?.id],
    queryFn: async () => {
      if (!doctorData?.id) return [];
      
      const { data, error } = await supabase
        .from('surgeries')
        .select(`
          *,
          patient:patients(id)
        `)
        .eq('doctor_id', doctorData.id)
        .order('surgery_date', { ascending: true });

      if (error) throw error;
      
      // Fetch patient profiles and checklist progress separately
      const surgeriesWithData = await Promise.all((data || []).map(async (surgery) => {
        // Get patient profile
        let patientInfo = null;
        if (surgery.patient?.id) {
          const { data: patientData } = await supabase
            .from('patients')
            .select('id, user_id')
            .eq('id', surgery.patient.id)
            .single();
          
          if (patientData?.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', patientData.user_id)
              .single();
            
            patientInfo = {
              id: patientData.id,
              first_name: profileData?.first_name,
              last_name: profileData?.last_name,
            };
          }
        }

        // Get checklist progress
        const { data: checklists } = await supabase
          .from('surgery_checklists')
          .select('id, items')
          .eq('surgery_id', surgery.id);

        let checklistProgress = undefined;
        if (checklists && checklists.length > 0) {
          const checklist = checklists[0];
          const items = (checklist.items as any[]) || [];
          
          const { data: completions } = await supabase
            .from('checklist_item_completions')
            .select('item_index')
            .eq('checklist_id', checklist.id);

          checklistProgress = {
            completed: completions?.length || 0,
            total: items.length,
          };
        }

        return {
          id: surgery.id,
          patient_id: surgery.patient_id,
          doctor_id: surgery.doctor_id,
          surgery_date: surgery.surgery_date,
          procedure_name: surgery.procedure_name,
          location: surgery.location,
          notes: surgery.notes,
          status: surgery.status,
          patient: patientInfo,
          checklist_progress: checklistProgress,
        } as Surgery;
      }));

      return surgeriesWithData;
    },
    enabled: !!doctorData?.id,
  });

  // Create surgery mutation
  const createSurgeryMutation = useMutation({
    mutationFn: async (surgeryData: typeof newSurgery) => {
      if (!doctorData?.id) throw new Error('No doctor found');
      
      const { data, error } = await supabase
        .from('surgeries')
        .insert({
          patient_id: surgeryData.patient_id,
          doctor_id: doctorData.id,
          surgery_date: surgeryData.surgery_date,
          procedure_name: surgeryData.procedure_name,
          location: surgeryData.location || null,
          notes: surgeryData.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeries'] });
      setIsScheduleDialogOpen(false);
      setNewSurgery({
        patient_id: '',
        surgery_date: '',
        procedure_name: '',
        location: '',
        notes: '',
      });
      toast({
        title: "Surgery Scheduled",
        description: "The surgery has been successfully scheduled.",
      });
    },
    onError: (error) => {
      console.error('Error scheduling surgery:', error);
      toast({
        title: "Error",
        description: "Failed to schedule surgery. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update surgery status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('surgeries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeries'] });
      toast({
        title: "Status Updated",
        description: "Surgery status has been updated.",
      });
    },
  });

  const filteredSurgeries = surgeries.filter((surgery) => {
    const patientName = `${surgery.patient?.first_name || ''} ${surgery.patient?.last_name || ''}`.toLowerCase();
    const procedure = surgery.procedure_name.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = patientName.includes(search) || procedure.includes(search);
    const matchesTab = activeTab === 'all' || surgery.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getTabCounts = () => ({
    scheduled: surgeries.filter((s) => s.status === 'scheduled').length,
    completed: surgeries.filter((s) => s.status === 'completed').length,
    cancelled: surgeries.filter((s) => s.status === 'cancelled').length,
    all: surgeries.length,
  });

  const tabCounts = getTabCounts();

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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Surgery Schedule</h1>
            <p className="text-muted-foreground mt-2">Manage surgeries, checklists, and pre-op documentation</p>
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
                        {patients.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.profiles?.first_name} {patient.profiles?.last_name}
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
                    <Label htmlFor="date">Surgery Date & Time</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={newSurgery.surgery_date}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, surgery_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newSurgery.location}
                      onChange={(e) => setNewSurgery(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Operating Room / Hospital"
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
                  <Button 
                    onClick={() => createSurgeryMutation.mutate(newSurgery)}
                    disabled={createSurgeryMutation.isPending}
                  >
                    {createSurgeryMutation.isPending ? "Scheduling..." : "Schedule Surgery"}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

        {['scheduled', 'completed', 'cancelled', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <SurgeriesList 
              surgeries={filteredSurgeries}
              onOpenChecklist={setSelectedSurgeryForChecklist}
              onOpenImages={setSelectedSurgeryForImages}
              onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Checklist Dialog */}
      {selectedSurgeryForChecklist && (
        <SurgeryChecklistDialog
          open={!!selectedSurgeryForChecklist}
          onOpenChange={(open) => !open && setSelectedSurgeryForChecklist(null)}
          surgeryId={selectedSurgeryForChecklist.id}
          surgeryName={selectedSurgeryForChecklist.procedure_name}
        />
      )}

      {/* Images Dialog */}
      {selectedSurgeryForImages && (
        <PreOpImagesDialog
          open={!!selectedSurgeryForImages}
          onOpenChange={(open) => !open && setSelectedSurgeryForImages(null)}
          surgeryId={selectedSurgeryForImages.id}
          surgeryName={selectedSurgeryForImages.procedure_name}
        />
      )}
    </div>
  );
}

interface SurgeriesListProps {
  surgeries: Surgery[];
  onOpenChecklist: (surgery: Surgery) => void;
  onOpenImages: (surgery: Surgery) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function SurgeriesList({ surgeries, onOpenChecklist, onOpenImages, onUpdateStatus }: SurgeriesListProps) {
  if (surgeries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No surgeries found</h3>
            <p className="text-muted-foreground mb-4">
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
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{surgery.procedure_name}</h3>
                    <Badge variant={
                      surgery.status === 'scheduled' ? 'default' : 
                      surgery.status === 'completed' ? 'secondary' : 'destructive'
                    }>
                      {surgery.status}
                    </Badge>
                    {surgery.checklist_progress && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {surgery.checklist_progress.completed === surgery.checklist_progress.total ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <ClipboardCheck className="h-3 w-3" />
                        )}
                        {surgery.checklist_progress.completed}/{surgery.checklist_progress.total}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{surgery.patient?.first_name} {surgery.patient?.last_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(surgery.surgery_date), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(surgery.surgery_date), 'h:mm a')}</span>
                    </div>
                    
                    {surgery.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{surgery.location}</span>
                      </div>
                    )}
                  </div>

                  {surgery.notes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes: </span>
                      <span>{surgery.notes}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOpenChecklist(surgery)}
                >
                  <ClipboardCheck className="mr-1 h-4 w-4" />
                  Checklist
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOpenImages(surgery)}
                >
                  <Camera className="mr-1 h-4 w-4" />
                  Images
                </Button>
                {surgery.status === 'scheduled' && (
                  <>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => onUpdateStatus(surgery.id, 'completed')}
                    >
                      Complete
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onUpdateStatus(surgery.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
