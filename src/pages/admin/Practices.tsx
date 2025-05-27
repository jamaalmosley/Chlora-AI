
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Practice {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  staff_count?: number;
  patient_count?: number;
}

export default function AdminPractices() {
  const { toast } = useToast();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filteredPractices, setFilteredPractices] = useState<Practice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPracticeName, setNewPracticeName] = useState("");
  const [newPracticeAddress, setNewPracticeAddress] = useState("");
  const [newPracticePhone, setNewPracticePhone] = useState("");
  const [newPracticeEmail, setNewPracticeEmail] = useState("");

  useEffect(() => {
    const loadPractices = async () => {
      setIsLoading(true);
      
      try {
        const { data: practicesData, error: practicesError } = await supabase
          .from('practices')
          .select('*')
          .order('created_at', { ascending: false });

        if (practicesError) throw practicesError;

        // Get counts for each practice
        const practicesWithCounts = await Promise.all(
          (practicesData || []).map(async (practice) => {
            // Count staff
            const { count: staffCount } = await supabase
              .from('staff')
              .select('*', { count: 'exact' })
              .eq('practice_id', practice.id)
              .eq('status', 'active');

            // Count patients
            const { count: patientCount } = await supabase
              .from('patient_assignments')
              .select('*', { count: 'exact' })
              .eq('practice_id', practice.id)
              .eq('status', 'active');

            return {
              ...practice,
              staff_count: staffCount || 0,
              patient_count: patientCount || 0
            };
          })
        );

        setPractices(practicesWithCounts);
        setFilteredPractices(practicesWithCounts);
      } catch (error) {
        console.error('Error loading practices:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPractices();
  }, []);

  useEffect(() => {
    const filtered = practices.filter(practice => {
      const search = searchTerm.toLowerCase();
      return practice.name.toLowerCase().includes(search) ||
             practice.address?.toLowerCase().includes(search) ||
             practice.email?.toLowerCase().includes(search);
    });
    setFilteredPractices(filtered);
  }, [searchTerm, practices]);

  const createPractice = async () => {
    if (!newPracticeName.trim()) return;

    try {
      const { error } = await supabase
        .from('practices')
        .insert({
          name: newPracticeName,
          address: newPracticeAddress || null,
          phone: newPracticePhone || null,
          email: newPracticeEmail || null
        });

      if (error) throw error;

      toast({
        title: "Practice created",
        description: "New practice has been created successfully.",
      });

      setIsCreateOpen(false);
      setNewPracticeName("");
      setNewPracticeAddress("");
      setNewPracticePhone("");
      setNewPracticeEmail("");
      
      // Reload practices
      window.location.reload();
    } catch (error) {
      console.error('Error creating practice:', error);
      toast({
        title: "Error",
        description: "Failed to create practice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deletePractice = async (practiceId: string) => {
    try {
      // Delete related records first
      await supabase.from('patient_assignments').delete().eq('practice_id', practiceId);
      await supabase.from('staff').delete().eq('practice_id', practiceId);
      
      // Delete practice
      const { error } = await supabase
        .from('practices')
        .delete()
        .eq('id', practiceId);

      if (error) throw error;

      setPractices(prev => prev.filter(practice => practice.id !== practiceId));
      
      toast({
        title: "Practice deleted",
        description: "Practice and all related data have been removed.",
      });
    } catch (error) {
      console.error('Error deleting practice:', error);
      toast({
        title: "Error",
        description: "Failed to delete practice. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Management</h1>
            <p className="text-gray-600 mt-2">Manage medical practices and hospitals</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Practice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Practice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="practiceName">Practice Name *</Label>
                  <Input
                    id="practiceName"
                    value={newPracticeName}
                    onChange={(e) => setNewPracticeName(e.target.value)}
                    placeholder="Enter practice name"
                  />
                </div>
                <div>
                  <Label htmlFor="practiceAddress">Address</Label>
                  <Input
                    id="practiceAddress"
                    value={newPracticeAddress}
                    onChange={(e) => setNewPracticeAddress(e.target.value)}
                    placeholder="Enter practice address"
                  />
                </div>
                <div>
                  <Label htmlFor="practicePhone">Phone</Label>
                  <Input
                    id="practicePhone"
                    value={newPracticePhone}
                    onChange={(e) => setNewPracticePhone(e.target.value)}
                    placeholder="Enter practice phone"
                  />
                </div>
                <div>
                  <Label htmlFor="practiceEmail">Email</Label>
                  <Input
                    id="practiceEmail"
                    type="email"
                    value={newPracticeEmail}
                    onChange={(e) => setNewPracticeEmail(e.target.value)}
                    placeholder="Enter practice email"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPractice}>
                    Create Practice
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search practices by name, address, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practices.length}</div>
            <p className="text-xs text-muted-foreground">Active practices</p>
          </CardContent>
        </Card>
      </div>

      {/* Practices List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPractices.map((practice) => (
          <Card key={practice.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-medical-light rounded-full flex items-center justify-center">
                    <Building className="h-6 w-6 text-medical-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{practice.name}</h3>
                      <Badge variant="default">
                        {practice.staff_count} staff
                      </Badge>
                      <Badge variant="outline">
                        {practice.patient_count} patients
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      {practice.address && (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{practice.address}</span>
                        </div>
                      )}
                      
                      {practice.phone && (
                        <div className="flex items-center space-x-2">
                          <span>📞</span>
                          <span>{practice.phone}</span>
                        </div>
                      )}
                      
                      {practice.email && (
                        <div className="flex items-center space-x-2">
                          <span>✉️</span>
                          <span>{practice.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Staff
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deletePractice(practice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPractices.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practices found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No practices have been created yet.'}
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
