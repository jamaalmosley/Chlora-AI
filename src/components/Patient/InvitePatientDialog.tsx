
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface InvitePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceId: string;
  practiceName: string;
  onPatientAdded?: () => void;
}

export function InvitePatientDialog({ 
  open, 
  onOpenChange, 
  practiceId, 
  practiceName,
  onPatientAdded 
}: InvitePatientDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvitePatient = async () => {
    if (!user || !email.trim()) return;

    try {
      setIsLoading(true);

      console.log('Inviting patient:', {
        email: email.trim(),
        practiceId,
        practiceName
      });

      // Send invitation email via edge function
      const { data, error } = await supabase.functions.invoke('invite-patient', {
        body: {
          email: email.trim(),
          practiceId,
          practiceName,
          invitedBy: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email.trim()} to join as a patient`,
      });

      // Reset form and close dialog
      setEmail("");
      onOpenChange(false);
      if (onPatientAdded) onPatientAdded();

    } catch (err: any) {
      console.error('Error inviting patient:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to invite patient",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Patient</DialogTitle>
          <DialogDescription>
            Send an invitation to a patient to join your practice. If they don't have an account, they'll receive instructions to create one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-email">Patient Email Address</Label>
            <Input
              id="patient-email"
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleInvitePatient} 
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isLoading ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
