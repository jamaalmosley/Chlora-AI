
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PracticeDetailsFormProps {
  practiceName: string;
  setPracticeName: (value: string) => void;
  practiceAddress: string;
  setPracticeAddress: (value: string) => void;
  practicePhone: string;
  setPracticePhone: (value: string) => void;
  practiceEmail: string;
  setPracticeEmail: (value: string) => void;
}

export function PracticeDetailsForm({ 
  practiceName, 
  setPracticeName, 
  practiceAddress, 
  setPracticeAddress, 
  practicePhone, 
  setPracticePhone, 
  practiceEmail, 
  setPracticeEmail 
}: PracticeDetailsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Practice Information</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="practice-name">Practice Name</Label>
          <Input
            id="practice-name"
            value={practiceName}
            onChange={(e) => setPracticeName(e.target.value)}
            placeholder="e.g., Smith Medical Center"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="practice-address">Address</Label>
          <Textarea
            id="practice-address"
            value={practiceAddress}
            onChange={(e) => setPracticeAddress(e.target.value)}
            placeholder="Full practice address"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="practice-phone">Phone Number</Label>
            <Input
              id="practice-phone"
              value={practicePhone}
              onChange={(e) => setPracticePhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="practice-email">Email</Label>
            <Input
              id="practice-email"
              type="email"
              value={practiceEmail}
              onChange={(e) => setPracticeEmail(e.target.value)}
              placeholder="contact@practice.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
