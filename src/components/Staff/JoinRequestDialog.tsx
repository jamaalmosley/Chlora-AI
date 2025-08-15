
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface JoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceId: string;
  practiceName: string;
  presetRole?: string;
}

export function JoinRequestDialog({ open, onOpenChange, practiceId, practiceName, presetRole }: JoinRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitRequest = async () => {
    if (!user || !role.trim()) return;

    try {
      setIsLoading(true);

      console.log('Submitting join request:', {
        practiceId,
        userId: user.id,
        role,
        message
      });

      const { error } = await supabase
        .from('practice_join_requests')
        .insert({
          practice_id: practiceId,
          user_id: user.id,
          requested_role: role,
          message: message.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your join request has been sent to the practice administrators.",
      });

      // Reset form
      setRole("");
      setMessage("");
      onOpenChange(false);

    } catch (err: any) {
      console.error('Error submitting join request:', err);
      let errorMessage = "Failed to submit join request";
      
      if (err.code === '23505') {
        errorMessage = "You have already submitted a request to join this practice.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
          <DialogTitle>Request to Join Practice</DialogTitle>
          <DialogDescription>
            Submit a request to join {practiceName}. The practice administrators will review your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requested-role">Requested Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="anesthesiologist">Anesthesiologist</SelectItem>
                <SelectItem value="physician_assistant">Physician Assistant</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the practice administrators about yourself, your experience, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button 
            onClick={handleSubmitRequest} 
            disabled={isLoading || !role.trim()}
            className="w-full"
          >
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
