
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Circle } from "lucide-react";

interface DoctorStatusProps {
  doctorId?: string;
  showInChat?: boolean;
}

export function DoctorStatus({ doctorId, showInChat = false }: DoctorStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [workingHours, setWorkingHours] = useState<string>("");

  useEffect(() => {
    // Simulate checking doctor status
    // In a real app, this would check actual doctor availability
    const now = new Date();
    const hour = now.getHours();
    const isWorkingHours = hour >= 9 && hour <= 17; // 9 AM to 5 PM
    
    setIsOnline(isWorkingHours);
    setWorkingHours("Monday-Friday 9AM-5PM");
  }, [doctorId]);

  if (showInChat) {
    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Circle className={`h-3 w-3 ${isOnline ? 'text-green-500 fill-current' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            Your assigned physician is {isOnline ? 'available' : 'currently offline'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Working hours: {workingHours}
        </p>
        {!isOnline && (
          <p className="text-xs text-gray-500 mt-1">
            Messages sent now will be reviewed when your doctor is next available.
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Circle className={`h-4 w-4 ${isOnline ? 'text-green-500 fill-current' : 'text-gray-400'}`} />
              <span className="font-medium">Doctor Status</span>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? "Available" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{workingHours}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
