import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Activity, AlertCircle, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  doctor_name: string;
}

export default function PatientRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get patient ID
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (patientError) throw patientError;
      setPatientData(patientData);

      // Get medical records with doctor info
      const { data: records, error: recordsError } = await supabase
        .from("medical_records")
        .select(`
          *,
          doctors (
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("patient_id", patientData.id)
        .eq("status", "released")
        .order("test_date", { ascending: false });

      if (recordsError) throw recordsError;

      const formattedRecords = records?.map((record: any) => ({
        ...record,
        doctor_name: `Dr. ${record.doctors.profiles.first_name} ${record.doctors.profiles.last_name}`,
      })) || [];

      setMedicalRecords(formattedRecords);
    } catch (error: any) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load medical records");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      other: "Other"
    };
    return labels[type] || type;
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading medical records...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Medical Records</h1>
        <p className="text-muted-foreground">
          View your test results, medical history, and allergies 24/7
        </p>
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records">Test Results</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4 mt-6">
          {medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No medical records available yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your physician will release test results here when available
                </p>
              </CardContent>
            </Card>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">{getTestTypeLabel(record.test_type)}</Badge>
                        {record.test_name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Performed on {formatDate(record.test_date)} by {record.doctor_name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Released</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.findings && (
                    <div>
                      <h4 className="font-semibold mb-2">Findings</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {record.findings}
                      </p>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {record.notes}
                      </p>
                    </div>
                  )}

                  {record.file_urls && record.file_urls.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Attached Files</h4>
                      <div className="grid gap-2">
                        {record.file_urls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-sm">
                                {url.split('/').pop()?.substring(0, 30)}...
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(url, `test-result-${index + 1}`)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Released on {formatDate(record.released_at!)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>
                Your documented medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientData?.medical_history && patientData.medical_history.length > 0 ? (
                <ul className="space-y-2">
                  {patientData.medical_history.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <Activity className="h-5 w-5 text-primary mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No medical history recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allergies" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>
                Known allergies and reactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientData?.allergies && patientData.allergies.length > 0 ? (
                <ul className="space-y-2">
                  {patientData.allergies.map((allergy: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-destructive/5">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <span className="font-medium">{allergy}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No allergies recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
