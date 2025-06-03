
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building, UserCheck } from "lucide-react";

interface PracticeOwnershipSelectionProps {
  practiceOwnership: 'owner' | 'employee';
  setPracticeOwnership: (value: 'owner' | 'employee') => void;
  onContinue: () => void;
}

export function PracticeOwnershipSelection({ 
  practiceOwnership, 
  setPracticeOwnership, 
  onContinue 
}: PracticeOwnershipSelectionProps) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-medical-primary">
          Practice Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Do you own a practice or work for someone else?</Label>
          <RadioGroup
            value={practiceOwnership}
            onValueChange={(value) => setPracticeOwnership(value as 'owner' | 'employee')}
            className="mt-3"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="owner" id="owner" />
              <Label htmlFor="owner" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-medical-primary" />
                  <div>
                    <div className="font-medium">I own a practice</div>
                    <div className="text-sm text-gray-600">Create and manage your own practice</div>
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="employee" id="employee" />
              <Label htmlFor="employee" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-medical-primary" />
                  <div>
                    <div className="font-medium">I work for someone else</div>
                    <div className="text-sm text-gray-600">Join an existing practice</div>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          onClick={onContinue} 
          className="w-full bg-medical-primary hover:bg-medical-dark"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
