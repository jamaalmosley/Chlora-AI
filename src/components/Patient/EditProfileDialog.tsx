import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { patientProfileSchema, validateInput } from "@/lib/validations";

interface PatientData {
  id: string;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  medical_history: string[] | null;
  allergies: string[] | null;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: PatientData;
  onUpdate: (data: PatientData) => void;
}

export function EditProfileDialog({ open, onOpenChange, patientData, onUpdate }: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date_of_birth: patientData.date_of_birth || "",
    address: patientData.address || "",
    emergency_contact_name: patientData.emergency_contact_name || "",
    emergency_contact_relationship: patientData.emergency_contact_relationship || "",
    emergency_contact_phone: patientData.emergency_contact_phone || "",
  });

  const [medicalHistory, setMedicalHistory] = useState<string[]>(patientData.medical_history || []);
  const [allergies, setAllergies] = useState<string[]>(patientData.allergies || []);
  const [newHistoryItem, setNewHistoryItem] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  const addHistoryItem = () => {
    if (newHistoryItem.trim()) {
      setMedicalHistory([...medicalHistory, newHistoryItem.trim()]);
      setNewHistoryItem("");
    }
  };

  const removeHistoryItem = (index: number) => {
    setMedicalHistory(medicalHistory.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate input using Zod schema
    const updateData = {
      date_of_birth: formData.date_of_birth || undefined,
      address: formData.address || undefined,
      emergency_contact_name: formData.emergency_contact_name || undefined,
      emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
      emergency_contact_phone: formData.emergency_contact_phone || undefined,
      medical_history: medicalHistory,
      allergies: allergies,
    };

    const validationResult = validateInput(patientProfileSchema, updateData);

    if (!validationResult.success) {
      toast({
        title: "Invalid Input",
        description: validationResult.error,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validationResult.data;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          date_of_birth: validatedData.date_of_birth || null,
          address: validatedData.address || null,
          emergency_contact_name: validatedData.emergency_contact_name || null,
          emergency_contact_relationship: validatedData.emergency_contact_relationship || null,
          emergency_contact_phone: validatedData.emergency_contact_phone || null,
          medical_history: validatedData.medical_history || null,
          allergies: validatedData.allergies || null,
        })
        .eq("id", patientData.id);

      if (error) throw error;

      onUpdate({ ...patientData, ...updateData });
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Your full address"
              />
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <div>
              <Label>Medical History</Label>
              <div className="space-y-2">
                {medicalHistory.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted rounded-md">{item}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHistoryItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newHistoryItem}
                    onChange={(e) => setNewHistoryItem(e.target.value)}
                    placeholder="Add condition or procedure"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHistoryItem())}
                  />
                  <Button type="button" onClick={addHistoryItem}>Add</Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Allergies</Label>
              <div className="space-y-2">
                {allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted rounded-md">{allergy}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAllergy(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add allergy"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
                  />
                  <Button type="button" onClick={addAllergy}>Add</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <div>
              <Label htmlFor="ec-name">Name</Label>
              <Input
                id="ec-name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="Emergency contact name"
              />
            </div>
            <div>
              <Label htmlFor="ec-relationship">Relationship</Label>
              <Input
                id="ec-relationship"
                value={formData.emergency_contact_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>
            <div>
              <Label htmlFor="ec-phone">Phone Number</Label>
              <Input
                id="ec-phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="Emergency contact phone"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
