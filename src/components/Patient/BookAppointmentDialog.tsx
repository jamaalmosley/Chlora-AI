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

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentBooked?: () => void;
}

export function BookAppointmentDialog({
  open,
  onOpenChange,
  onAppointmentBooked,
}: BookAppointmentDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    type: "",
    notes: "",
  });

  // Fetch patient ID and available doctors
  useEffect(() => {
    if (open && user) {
      fetchPatientData();
      fetchDoctors();
    }
  }, [open, user]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setPatientId(data.id);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient information.",
        variant: "destructive",
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(`
          id,
          specialty,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq("status", "active");

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load available doctors.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.doctorId || !formData.date || !formData.time || !formData.type) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (!patientId) {
        toast({
          title: "Error",
          description: "Patient information not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const appointmentData = {
        patient_id: patientId,
        doctor_id: formData.doctorId,
        appointment_date: formData.date,
        appointment_time: formData.time,
        type: formData.type,
        notes: formData.notes,
        status: "scheduled",
      };

      const { error } = await supabase
        .from("appointments")
        .insert(appointmentData);

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully scheduled.",
      });

      // Reset form
      setFormData({
        doctorId: "",
        date: "",
        time: "",
        type: "",
        notes: "",
      });

      onAppointmentBooked?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment. Please try again.",
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
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule an appointment with one of our doctors.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doctor" className="text-right">
                Doctor *
              </Label>
              <Select
                value={formData.doctorId}
                onValueChange={(value) =>
                  setFormData({ ...formData, doctorId: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.profiles?.first_name} {doctor.profiles?.last_name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                min={new Date().toISOString().split("T")[0]}
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
                placeholder="Any additional information..."
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
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
