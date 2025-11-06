import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Eye, Send } from "lucide-react";
import { AddMedicalRecordDialog } from "@/components/Doctor/AddMedicalRecordDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicalRecord {
  id: string;
  test_type: string;
  test_name: string;
  test_date: string;
  findings: string | null;
  notes: string | null;
  file_urls: string[] | null;
  status: string;
  released_at: string | null;
  patient_name: string;
  patient_id: string;
}

interface Patient {
  id: string;
  name: string;
}

export default function DoctorTestResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Get doctor ID
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (doctorError) throw doctorError;
      setDoctorId(doctorData.id);

      // Get doctor's practice
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("practice_id")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();

      if (staffError) throw staffError;

      // Get patients from practice
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("patient_assignments")
        .select(`
          patient_id,
          patients (
            id,
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("practice_id", staffData.practice_id)
        .eq("status", "active");

      if (assignmentError) throw assignmentError;

      const patientList = assignmentData?.map((assignment: any) => ({
        id: assignment.patients.id,
        name: `${assignment.patients.profiles.first_name} ${assignment.patients.profiles.last_name}`,
      })) || [];

      setPatients(patientList);

      // Get all medical records for this doctor
      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select(`
          *,
          patients (
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("doctor_id", doctorData.id)
        .order("created_at", { ascending: false });

      if (recordsError) throw recordsError;

      const formattedRecords = recordsData?.map((record: any) => ({
        ...record,
        patient_name: `${record.patients.profiles.first_name} ${record.patients.profiles.last_name}`,
      })) || [];

      setRecords(formattedRecords);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load test results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const releaseRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from("medical_records")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
        })
        .eq("id", recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test results released to patient",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error releasing record:", error);
      toast({
        title: "Error",
        description: "Failed to release test results",
        variant: "destructive",
      });
    }
  };

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mri: "MRI",
      ct_scan: "CT Scan",
      x_ray: "X-Ray",
      ekg: "EKG",
      ecg: "ECG",
      blood_test: "Blood Test",
      urine_test: "Urine Test",
      ultrasound: "Ultrasound",
      biopsy: "Biopsy",
      other: "Other",
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const draftRecords = records.filter((r) => r.status === "draft");
  const releasedRecords = records.filter((r) => r.status === "released");

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-medical-primary" />
            Test Results Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage patient test results
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (!selectedPatientId) {
                toast({
                  title: "Select Patient",
                  description: "Please select a patient first",
                  variant: "destructive",
                });
                return;
              }
              setShowAddDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Test Results
          </Button>
        </div>
      </div>

      <Tabs defaultValue="drafts" className="w-full">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts ({draftRecords.length})
          </TabsTrigger>
          <TabsTrigger value="released">
            Released ({releasedRecords.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-4 mt-6">
          {draftRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No draft test results</p>
              </CardContent>
            </Card>
          ) : (
            draftRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getTestTypeLabel(record.test_type)}
                        </Badge>
                        {record.test_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patient: {record.patient_name} • Test Date:{" "}
                        {formatDate(record.test_date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Draft</Badge>
                      <Button
                        size="sm"
                        onClick={() => releaseRecord(record.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Release to Patient
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.findings && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Findings</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.findings.substring(0, 150)}
                        {record.findings.length > 150 && "..."}
                      </p>
                    </div>
                  )}
                  {record.file_urls && record.file_urls.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{record.file_urls.length} file(s) attached</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="released" className="space-y-4 mt-6">
          {releasedRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No released test results yet
                </p>
              </CardContent>
            </Card>
          ) : (
            releasedRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getTestTypeLabel(record.test_type)}
                        </Badge>
                        {record.test_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patient: {record.patient_name} • Test Date:{" "}
                        {formatDate(record.test_date)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge>Released</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.released_at!)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.findings && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Findings</h4>
                      <p className="text-sm text-muted-foreground">
                        {record.findings.substring(0, 150)}
                        {record.findings.length > 150 && "..."}
                      </p>
                    </div>
                  )}
                  {record.file_urls && record.file_urls.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{record.file_urls.length} file(s) attached</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {doctorId && selectedPatientId && (
        <AddMedicalRecordDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          patientId={selectedPatientId}
          doctorId={doctorId}
          onSuccess={() => {
            fetchData();
            setShowAddDialog(false);
            setSelectedPatientId("");
          }}
        />
      )}
    </div>
  );
}
