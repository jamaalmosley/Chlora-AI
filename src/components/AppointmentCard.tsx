
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    type: string;
    status: string;
    notes?: string | null;
    patient?: {
      user: {
        first_name: string;
        last_name: string;
      };
    } | null;
    doctor?: {
      user: {
        first_name: string;
        last_name: string;
      };
    } | null;
  };
  onDelete: (appointmentId: string) => void;
  showPatient?: boolean;
  showDoctor?: boolean;
}

export default function AppointmentCard({ 
  appointment, 
  onDelete, 
  showPatient = false, 
  showDoctor = false 
}: AppointmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteAppointment = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (error) throw error;

      onDelete(appointment.id);
      
      toast({
        title: "Appointment deleted",
        description: "The appointment has been successfully removed.",
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(appointment.appointment_date), 'MMM d, yyyy')}</span>
                <Clock className="h-4 w-4 ml-2" />
                <span>{appointment.appointment_time}</span>
              </div>
              <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
                {appointment.status}
              </Badge>
            </div>
            
            <h3 className="font-medium text-lg mb-1">{appointment.type}</h3>
            
            {showPatient && appointment.patient && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <User className="h-4 w-4" />
                <span>Patient: {appointment.patient.user.first_name} {appointment.patient.user.last_name}</span>
              </div>
            )}
            
            {showDoctor && appointment.doctor && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <User className="h-4 w-4" />
                <span>Doctor: Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}</span>
              </div>
            )}
            
            {appointment.notes && (
              <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={deleteAppointment}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
