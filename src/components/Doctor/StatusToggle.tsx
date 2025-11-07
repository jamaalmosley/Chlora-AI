import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Circle } from "lucide-react";

export function StatusToggle() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'active' | 'away'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('availability_status')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching status:', error);
      } else if (data) {
        setStatus((data.availability_status || 'active') as 'active' | 'away');
      }
      setLoading(false);
    };

    fetchStatus();

    // Listen for real-time updates
    const channel = supabase
      .channel('doctor-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'doctors',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.availability_status) {
            setStatus(payload.new.availability_status as 'active' | 'away');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleStatus = async () => {
    if (!user) return;

    const newStatus = status === 'active' ? 'away' : 'active';
    setLoading(true);

    const { error } = await supabase
      .from('doctors')
      .update({ availability_status: newStatus })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } else {
      setStatus(newStatus);
      toast.success(`Status changed to ${newStatus === 'active' ? 'Active' : 'Away'}`);
    }
    
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-card border">
      <Circle 
        className={`h-3 w-3 ${status === 'active' ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`} 
      />
      <div className="flex items-center space-x-2">
        <Label htmlFor="status-toggle" className="text-sm font-medium cursor-pointer">
          {status === 'active' ? 'Active' : 'Away'}
        </Label>
        <Switch
          id="status-toggle"
          checked={status === 'active'}
          onCheckedChange={toggleStatus}
          disabled={loading}
        />
      </div>
    </div>
  );
}
