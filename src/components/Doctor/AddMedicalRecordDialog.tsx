import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { medicalRecordSchema, validateInput } from "@/lib/validations";

interface AddMedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  doctorId: string;
  onSuccess: () => void;
}

const TEST_TYPES = [
  { value: "mri", label: "MRI" },
  { value: "ct_scan", label: "CT Scan" },
  { value: "x_ray", label: "X-Ray" },
  { value: "ekg", label: "EKG" },
  { value: "ecg", label: "ECG" },
  { value: "blood_test", label: "Blood Test" },
  { value: "urine_test", label: "Urine Test" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "biopsy", label: "Biopsy" },
  { value: "other", label: "Other" },
];

export function AddMedicalRecordDialog({
  open,
  onOpenChange,
  patientId,
  doctorId,
  onSuccess,
}: AddMedicalRecordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    testType: "",
    testName: "",
    testDate: "",
    findings: "",
    notes: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('medical-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('medical-files')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent, releaseNow: boolean = false) => {
    e.preventDefault();
    
    // Validate input using Zod schema
    const validationResult = validateInput(medicalRecordSchema, formData);

    if (!validationResult.success) {
      toast.error(validationResult.error);
      return;
    }

    const validatedData = validationResult.data;
    setLoading(true);

    try {
      // Upload files first
      const fileUrls = files.length > 0 ? await uploadFiles() : [];

      // Create medical record with validated data
      const { error } = await supabase.from("medical_records").insert([{
        patient_id: patientId,
        doctor_id: doctorId,
        test_type: validatedData.testType as any,
        test_name: validatedData.testName,
        test_date: validatedData.testDate,
        findings: validatedData.findings,
        notes: validatedData.notes,
        file_urls: fileUrls,
        status: releaseNow ? "released" : "draft",
        released_at: releaseNow ? new Date().toISOString() : null,
      }]);

      if (error) throw error;

      toast.success(releaseNow ? "Test results released to patient" : "Test results saved as draft");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        testType: "",
        testName: "",
        testDate: "",
        findings: "",
        notes: "",
      });
      setFiles([]);
    } catch (error: any) {
      console.error("Error creating medical record:", error);
      toast.error(error.message || "Failed to save test results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medical Test Results</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type *</Label>
              <Select
                value={formData.testType}
                onValueChange={(value) => setFormData({ ...formData, testType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testDate">Test Date *</Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testName">Test Name *</Label>
            <Input
              id="testName"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder="e.g., Brain MRI with contrast"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings">Findings</Label>
            <Textarea
              id="findings"
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Enter test findings and results..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or recommendations..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Upload Images/Files (X-rays, MRI scans, etc.)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <Input
                id="files"
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf"
                className="hidden"
              />
              <Label htmlFor="files" className="cursor-pointer">
                <span className="text-primary hover:underline">Choose files</span> or drag and drop
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Images, PDFs up to 10MB each
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} variant="outline">
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              {loading ? "Releasing..." : "Release to Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
