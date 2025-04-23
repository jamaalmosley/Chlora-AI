
import { useAuth } from "@/context/AuthContext";
import { mockPatients } from "@/data/mockData";
import { Patient, Medication } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  Clock, 
  Calendar, 
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function PatientMedications() {
  const { user } = useAuth();
  const patient = mockPatients.find(p => p.id === user?.id) as Patient | undefined;

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Medications</h1>
        <p>Loading patient data...</p>
      </div>
    );
  }

  // Ensure medications are properly initialized with all required fields
  const medications = patient.medications || [];
  
  // Add mock medications if none exist
  if (medications.length === 0) {
    medications.push(
      {
        id: "med1",
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        startDate: "2024-04-10",
        endDate: "2024-04-17",
        prescribedBy: "Dr. Sarah Smith",
        refillsRemaining: 0,
        instructions: "Take with food. Complete full course of antibiotics."
      },
      {
        id: "med2",
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Every 6 hours as needed for pain",
        startDate: "2024-04-05",
        endDate: "2024-05-05",
        prescribedBy: "Dr. Sarah Smith",
        refillsRemaining: 2,
        instructions: "Take with food or milk to prevent stomach upset."
      }
    );
  }

  const formatDate = (dateStr: string) => {
    // Check if the date string is valid before formatting
    if (!dateStr || dateStr.trim() === '') {
      return 'No date provided';
    }
    
    try {
      const date = new Date(dateStr);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Error formatting date';
    }
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const today = new Date().getTime();
      
      // Check if dates are valid
      if (isNaN(start) || isNaN(end)) {
        return 0;
      }
      
      if (today <= start) return 0;
      if (today >= end) return 100;
      
      const totalDuration = end - start;
      const elapsed = today - start;
      return Math.round((elapsed / totalDuration) * 100);
    } catch (error) {
      console.error("Error calculating progress:", error);
      return 0;
    }
  };

  const renderMedicationCard = (medication: Medication) => {
    // Ensure all required fields exist
    const med = {
      ...medication,
      endDate: medication.endDate || new Date().toISOString().split('T')[0],
      refillsRemaining: medication.refillsRemaining ?? 0,
      instructions: medication.instructions || "No special instructions provided."
    };
    
    const progress = calculateProgress(med.startDate, med.endDate);
    const isActive = new Date() <= new Date(med.endDate);

    return (
      <Card key={med.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Pill className="mr-2 h-5 w-5 text-medical-primary" />
                {med.name}
              </CardTitle>
              <CardDescription className="text-md mt-1">
                {med.dosage}
              </CardDescription>
            </div>
            <Badge 
              variant={isActive ? "default" : "outline"} 
              className={isActive ? "bg-medical-secondary text-white" : "bg-gray-100 text-gray-500"}
            >
              {isActive ? "Active" : "Completed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-gray-500" />
            <span>{med.frequency}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
            <span>
              {formatDate(med.startDate)} - {formatDate(med.endDate)}
            </span>
          </div>
          
          {isActive && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <div className="font-medium mb-1 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              Instructions
            </div>
            <p>{med.instructions}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="text-sm text-gray-500">
            <span>Prescribed by: {med.prescribedBy}</span>
          </div>
          {med.refillsRemaining > 0 && (
            <Button size="sm" variant="outline" className="text-medical-primary">
              <RefreshCw className="mr-1 h-3 w-3" />
              Request Refill ({med.refillsRemaining} remaining)
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medications</h1>
        <p className="text-gray-600">
          Manage your active and past medications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Current Medications</h2>
            <Button size="sm" variant="outline" className="text-medical-primary">
              <Plus className="mr-1 h-4 w-4" /> Request New Medication
            </Button>
          </div>
          
          {medications.length > 0 ? (
            medications.map(renderMedicationCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No current medications</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medication Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800 mb-1">Taking Medications Safely</h3>
                <p className="text-sm text-blue-700">
                  Always follow your doctor's instructions and read medication labels carefully. Don't skip doses or stop taking medication without consulting your doctor.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Important Reminders</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-medical-light text-medical-primary flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
                    <span>Store medications away from heat, light, and moisture.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-medical-light text-medical-primary flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
                    <span>Keep all medications out of reach of children.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-medical-light text-medical-primary flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
                    <span>Inform your doctor about any side effects or concerns.</span>
                  </li>
                </ul>
              </div>
              
              <Button className="w-full bg-medical-primary hover:bg-medical-dark">
                Contact Pharmacy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
