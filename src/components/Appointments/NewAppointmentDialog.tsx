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

      // Get doctor record with retry logic and better error handling
      console.log('Looking for doctor record for user:', user.id);
      
      let doctorData;
      let doctorError;
      let retryCount = 0;
      const maxRetries = 3;

      // Retry logic to handle potential RLS timing issues
      while (retryCount < maxRetries) {
        const result = await supabase
          .from('doctors')
          .select('id, specialty, license_number')
          .eq('user_id', user.id)
          .maybeSingle();

        doctorData = result.data;
        doctorError = result.error;

        if (doctorError && doctorError.code !== 'PGRST116') {
          console.error(`Doctor query attempt ${retryCount + 1} failed:`, doctorError);
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait 500ms before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        } else {
          break;
        }
      }

      if (doctorError && doctorError.code !== 'PGRST116') {
        console.error('Error querying doctors after retries:', doctorError);
        toast({
          title: "Database Error",
          description: `Error fetching doctor record: ${doctorError.message}. Please try again or contact support.`,
          variant: "destructive",
        });
        return;
      }

      console.log('Doctor query result:', doctorData);

      if (!doctorData) {
        // Check if user has the doctor role in their profile
        const profileRole = user.role || 'unknown';
        console.error('No doctor record found for user with role:', profileRole);
        
        toast({
          title: "Doctor Profile Missing",
          description: `No doctor profile found for user ID: ${user.id}. Role: ${profileRole}. Please complete your doctor setup in Profile settings.`,
          variant: "destructive",
        });
        return;
      }

      // Validate doctor record has required fields
      if (!doctorData.specialty || !doctorData.license_number) {
        toast({
          title: "Incomplete Doctor Profile",
          description: "Your doctor profile is missing required information (specialty or license). Please complete your profile setup.",
          variant: "destructive",
        });
        return;
      }

      const doctorId = doctorData.id;
      console.log('Using doctor ID:', doctorId, 'for doctor:', doctorData.specialty);

      // Ensure the doctor is active staff to satisfy RLS for appointments insert
      const { data: staffRecord, error: staffError } = await supabase
        .from('staff')
        .select('id, role, status')
        .eq('user_id', user.id)
        .in('role', ['doctor','physician','admin'])
        .eq('status', 'active')
        .maybeSingle();

      if (staffError) {
        console.error('Error verifying staff membership:', staffError);
        toast({
          title: 'Permission Error',
          description: `Could not verify your staff status: ${staffError.message}`,
          variant: 'destructive',
        });
        return;
      }

      if (!staffRecord) {
        toast({
          title: 'Not Linked to a Practice',
          description: 'You must be an active staff member of a practice to create appointments. Ask an admin to add you to staff.',
          variant: 'destructive',
        });
        return;
      }

      // Parse patient name
      const patientNames = formData.patientName.trim().split(' ');
      const firstName = patientNames[0] || '';
      const lastName = patientNames.slice(1).join(' ') || '';

      // Look up patient by profile name, then map to patient record
      let patientId: string | undefined;

      if (firstName && lastName) {
        const { data: matchingProfiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .ilike('first_name', firstName)
          .ilike('last_name', lastName)
          .limit(1);

        if (profileErr) {
          console.error('Profile lookup error:', profileErr);
          toast({
            title: 'Error',
            description: `Failed to look up patient profile: ${profileErr.message}`,
            variant: 'destructive',
          });
          return;
        }

        if (matchingProfiles && matchingProfiles.length > 0) {
          const profileId = matchingProfiles[0].id;
          const { data: patientRow, error: patientLookupErr } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', profileId)
            .maybeSingle();

          if (patientLookupErr && patientLookupErr.code !== 'PGRST116') {
            console.error('Patient lookup error:', patientLookupErr);
            toast({
              title: 'Error',
              description: `Failed to look up patient record: ${patientLookupErr.message}`,
              variant: 'destructive',
            });
            return;
          }

          if (patientRow) {
            patientId = patientRow.id;
          }
        }
      }

      if (!patientId) {
        toast({
          title: 'Patient Not Found',
          description: 'No matching patient was found. Please invite the patient first and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Create properly formatted datetime strings
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      // Validate datetime
      if (isNaN(startDateTime.getTime())) {
        toast({
          title: 'Invalid Date',
          description: 'Please check your date and time entries.',
          variant: 'destructive',
        });
        return;
      }

      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: formData.date,
        appointment_time: formData.time,
        type: formData.type,
        notes: formData.notes,
        status: 'scheduled'
      };

      console.log('Creating appointment with data:', appointmentData);

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError);
        toast({
          title: 'Error',
          description: `Failed to create appointment: ${appointmentError.message}. Details: ${appointmentError.details || 'No additional details'}`,
          variant: 'destructive',
        });
        return;
      }

      // Create appointment object for local state update
      const appointmentForState = {
        ...newAppointment,
        patient: {
          user: {
            first_name: firstName,
            last_name: lastName
          }
        }
      };

      onAppointmentCreated(appointmentForState);

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