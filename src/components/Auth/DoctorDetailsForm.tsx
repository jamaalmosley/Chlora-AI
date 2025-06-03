
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DoctorDetailsFormProps {
  specialty: string;
  setSpecialty: (value: string) => void;
  licenseNumber: string;
  setLicenseNumber: (value: string) => void;
}

export function DoctorDetailsForm({ 
  specialty, 
  setSpecialty, 
  licenseNumber, 
  setLicenseNumber 
}: DoctorDetailsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Doctor Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty">Medical Specialty</Label>
          <Input
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g., Cardiology, Orthopedics"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="license">License Number</Label>
          <Input
            id="license"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Your medical license number"
            required
          />
        </div>
      </div>
    </div>
  );
}
