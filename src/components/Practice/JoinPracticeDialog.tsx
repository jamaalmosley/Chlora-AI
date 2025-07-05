
import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { JoinRequestDialog } from "@/components/Staff/JoinRequestDialog";

interface Practice {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface JoinPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinPracticeDialog({ open, onOpenChange }: JoinPracticeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [showJoinRequest, setShowJoinRequest] = useState(false);

  const searchPractices = async () => {
    if (!searchTerm.trim()) {
      setPractices([]);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('practices')
        .select('id, name, address, phone, email')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching practices:', error);
        toast({
          title: "Error",
          description: "Failed to search practices",
          variant: "destructive",
        });
        return;
      }

      setPractices(data || []);

    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Error",
        description: "Failed to search practices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = (practice: Practice) => {
    setSelectedPractice(practice);
    setShowJoinRequest(true);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPractices();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Join Existing Practice</DialogTitle>
            <DialogDescription>
              Search for a practice by name or email and request to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Practices</Label>
              <Input
                id="search"
                placeholder="Enter practice name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto"></div>
              </div>
            )}

            {practices.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="font-medium">Search Results:</h4>
                {practices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{practice.name}</div>
                      {practice.email && (
                        <div className="text-sm text-gray-600">{practice.email}</div>
                      )}
                      {practice.address && (
                        <div className="text-sm text-gray-600">{practice.address}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(practice)}
                      className="bg-medical-primary hover:bg-medical-dark"
                    >
                      Request to Join
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && !isLoading && practices.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No practices found matching your search.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedPractice && (
        <JoinRequestDialog
          open={showJoinRequest}
          onOpenChange={setShowJoinRequest}
          practiceId={selectedPractice.id}
          practiceName={selectedPractice.name}
        />
      )}
    </>
  );
}
