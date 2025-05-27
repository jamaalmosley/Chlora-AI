
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffAdded: () => void;
  practiceId: string;
}

export function AddStaffDialog({ open, onOpenChange, onStaffAdded, practiceId }: AddStaffDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddStaff = async () => {
    if (!user || !email.trim() || !role) return;

    try {
      setIsLoading(true);

      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .ilike('email', email.trim())
        .single();

      if (profileError || !profileData) {
        throw new Error('User not found with this email');
      }

      // Check if role matches what we're trying to assign
      if (role === 'doctor' && profileData.role !== 'doctor') {
        throw new Error('This user is not registered as a doctor');
      }

      // Check if already assigned to this practice
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', profileData.id)
        .eq('practice_id', practiceId)
        .single();

      if (existingStaff) {
        throw new Error('This user is already part of this practice');
      }

      // Add to staff
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: profileData.id,
          practice_id: practiceId,
          role: role,
          department: department || undefined,
          status: 'active'
        });

      if (staffError) throw staffError;

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });

      setEmail("");
      setRole("");
      setDepartment("");
      onOpenChange(false);
      onStaffAdded();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add staff member';
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
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your practice by their email address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email Address</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input
              id="department"
              placeholder="e.g., Cardiology, Administration"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleAddStaff} 
            disabled={isLoading || !email.trim() || !role}
            className="w-full"
          >
            {isLoading ? "Adding..." : "Add Staff Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
