import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: (appointment: any) => void;
  prefilledTime?: string;
  prefilledDate?: string;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  onAppointmentCreated,
  prefilledTime = "",
  prefilledDate = "",
}: NewAppointmentDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    patientName: "",
    date: prefilledDate,
    time: prefilledTime,
    type: "",
    duration: "30",
    notes: "",
  });

  // Update form data when prefilled props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: prefilledDate,
      time: prefilledTime,
    }));
  }, [prefilledDate, prefilledTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.patientName || !formData.date || !formData.time || !formData.type) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create appointments.",
          variant: "destructive",
        });
        return;
      }

      // Get or create doctor record
      let { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) {
        toast({
          title: "Error",
          description: "Error fetching doctor record: " + doctorError.message,
          variant: "destructive",
        });
        return;
      }

      // If no doctor record exists, create one
      if (!doctorData) {
        const { data: newDoctorData, error: createDoctorError } = await supabase
          .from('doctors')
          .insert({
            user_id: user.id,
            specialty: 'General Practice',
            license_number: `TEMP-${user.id.substring(0, 8)}`
          })
          .select('id')
          .single();

        if (createDoctorError || !newDoctorData) {
          toast({
            title: "Error",
            description: "Could not create doctor record: " + (createDoctorError?.message || 'Unknown error'),
            variant: "destructive",
          });
          return;
        }
        doctorData = newDoctorData;
      }

      // For now, create a simple patient record for the appointment
      // In a real app, you'd want proper patient lookup/creation with user accounts
      const patientNames = formData.patientName.trim().split(' ');
      const firstName = patientNames[0] || '';
      const lastName = patientNames.slice(1).join(' ') || '';

      // Try to find existing patient by name (simplified approach)
      let { data: existingPatients } = await supabase
        .from('patients')
        .select('id, user_id, profiles!inner(first_name, last_name)')
        .eq('profiles.first_name', firstName)
        .eq('profiles.last_name', lastName);

      let patientId;

      if (existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
      } else {
        // Create a simple patient record without user linkage for now
        // This allows basic appointment functionality
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: null // Temporary approach - in real app would require proper patient registration
          })
          .select('id')
          .single();

        if (patientError || !patientData) {
          toast({
            title: "Error",
            description: "Could not create patient record.",
            variant: "destructive",
          });
          return;
        }
        patientId = patientData.id;
      }

      // Create the appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          doctor_id: doctorData.id,
          appointment_date: formData.date,
          appointment_time: formData.time,
          type: formData.type,
          notes: formData.notes,
          status: 'scheduled'
        })
        .select('*')
        .single();

      if (appointmentError) {
        toast({
          title: "Error",
          description: "Failed to create appointment: " + appointmentError.message,
          variant: "destructive",
        });
        return;
      }

      // Create appointment object for local state update
      const newAppointment = {
        ...appointmentData,
        patient: {
          user: {
            first_name: firstName,
            last_name: lastName
          }
        }
      };

      onAppointmentCreated(newAppointment);

      toast({
        title: "Appointment Created",
        description: `Appointment scheduled for ${formData.patientName} on ${new Date(formData.date).toLocaleDateString()}.`,
      });

      // Reset form
      setFormData({
        patientName: "",
        date: prefilledDate,
        time: prefilledTime,
        type: "",
        duration: "30",
        notes: "",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for a patient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patientName" className="text-right">
                Patient Name *
              </Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter patient name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Physical Exam">Physical Exam</SelectItem>
                  <SelectItem value="Surgery Consultation">Surgery Consultation</SelectItem>
                  <SelectItem value="Post-Op Check">Post-Op Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (mins)
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}