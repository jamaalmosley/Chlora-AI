
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DoctorStatusProps {
  doctorId?: string;
  showInChat?: boolean;
}

export function DoctorStatus({ doctorId, showInChat = false }: DoctorStatusProps) {
  const [availabilityStatus, setAvailabilityStatus] = useState<'active' | 'away'>('away');
  const [workingHours, setWorkingHours] = useState<string>("");

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorStatus = async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('availability_status, working_hours')
        .eq('id', doctorId)
        .single();

      if (error) {
        console.error('Error fetching doctor status:', error);
      } else if (data) {
        setAvailabilityStatus((data.availability_status || 'away') as 'active' | 'away');
        setWorkingHours(data.working_hours || "Monday-Friday 9AM-5PM");
      }
    };

    fetchDoctorStatus();

    // Listen for real-time status updates
    const channel = supabase
      .channel('doctor-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'doctors',
          filter: `id=eq.${doctorId}`
        },
        (payload) => {
          if (payload.new.availability_status) {
            setAvailabilityStatus(payload.new.availability_status as 'active' | 'away');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId]);

  const isActive = availabilityStatus === 'active';

  if (showInChat) {
    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Circle className={`h-3 w-3 ${isActive ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`} />
          <span className="text-sm font-medium">
            Your assigned physician is {isActive ? 'active' : 'away'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Working hours: {workingHours}
        </p>
        {!isActive && (
          <p className="text-xs text-muted-foreground mt-1">
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
              <Circle className={`h-4 w-4 ${isActive ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`} />
              <span className="font-medium">Doctor Status</span>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Away"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{workingHours}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
