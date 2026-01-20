import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ChecklistItem {
  title: string;
  description?: string;
  assignedTo: 'patient' | 'staff' | 'both';
  required: boolean;
}

interface ChecklistCompletion {
  item_index: number;
  completed_by: string;
  completed_by_role: string;
  completed_at: string;
}

interface SurgeryChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surgeryId: string;
  surgeryName: string;
}

export function SurgeryChecklistDialog({ open, onOpenChange, surgeryId, surgeryName }: SurgeryChecklistDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Record<string, ChecklistCompletion[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);

  useEffect(() => {
    if (open && surgeryId) {
      fetchChecklists();
    }
  }, [open, surgeryId]);

  const fetchChecklists = async () => {
    setIsLoading(true);
    try {
      const { data: checklistData, error } = await supabase
        .from('surgery_checklists')
        .select('*')
        .eq('surgery_id', surgeryId);

      if (error) throw error;

      setChecklists(checklistData || []);
      
      if (checklistData && checklistData.length > 0) {
        setSelectedChecklist(checklistData[0].id);
        
        // Fetch completions for all checklists
        const completionsMap: Record<string, ChecklistCompletion[]> = {};
        for (const checklist of checklistData) {
          const { data: completionData } = await supabase
            .from('checklist_item_completions')
            .select('*')
            .eq('checklist_id', checklist.id);
          
          completionsMap[checklist.id] = completionData || [];
        }
        setCompletions(completionsMap);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultChecklist = async () => {
    try {
      const defaultItems = [
        { title: "Patient has fasted for 8 hours", assignedTo: 'patient', required: true },
        { title: "Pre-operative bloodwork complete", assignedTo: 'staff', required: true },
        { title: "Anesthesia consultation complete", assignedTo: 'staff', required: true },
        { title: "Patient has arranged transportation home", assignedTo: 'patient', required: true },
        { title: "Consent forms signed", assignedTo: 'staff', required: true },
        { title: "Pre-op images captured", assignedTo: 'staff', required: false },
        { title: "Medication review complete", assignedTo: 'staff', required: true },
        { title: "Patient has stopped blood thinners", assignedTo: 'patient', required: false },
      ];

      const { data, error } = await supabase
        .from('surgery_checklists')
        .insert({
          surgery_id: surgeryId,
          name: 'Pre-Op Checklist',
          items: defaultItems as unknown as any,
        })
        .select()
        .single();

      if (error) throw error;

      setChecklists([...checklists, data]);
      setSelectedChecklist(data.id);
      setCompletions({ ...completions, [data.id]: [] });

      toast({
        title: "Checklist Created",
        description: "Default pre-op checklist has been created.",
      });
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to create checklist.",
        variant: "destructive",
      });
    }
  };

  const toggleItemCompletion = async (checklistId: string, itemIndex: number, isCompleted: boolean) => {
    if (!user) return;

    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('checklist_item_completions')
          .delete()
          .eq('checklist_id', checklistId)
          .eq('item_index', itemIndex);

        if (error) throw error;

        setCompletions(prev => ({
          ...prev,
          [checklistId]: prev[checklistId].filter(c => c.item_index !== itemIndex)
        }));
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('checklist_item_completions')
          .insert({
            checklist_id: checklistId,
            item_index: itemIndex,
            completed_by: user.id,
            completed_by_role: 'staff',
          })
          .select()
          .single();

        if (error) throw error;

        setCompletions(prev => ({
          ...prev,
          [checklistId]: [...(prev[checklistId] || []), data]
        }));
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist item.",
        variant: "destructive",
      });
    }
  };

  const addCustomItem = async () => {
    if (!selectedChecklist || !newItemTitle.trim()) return;

    try {
      const checklist = checklists.find(c => c.id === selectedChecklist);
      if (!checklist) return;

      const currentItems = (checklist.items as any[]) || [];
      const newItem = {
        title: newItemTitle.trim(),
        assignedTo: 'staff',
        required: false,
      };

      const { error } = await supabase
        .from('surgery_checklists')
        .update({ items: [...currentItems, newItem] as unknown as any })
        .eq('id', selectedChecklist);

      if (error) throw error;

      setChecklists(checklists.map(c => 
        c.id === selectedChecklist 
          ? { ...c, items: [...currentItems, newItem] }
          : c
      ));
      setNewItemTitle("");

      toast({
        title: "Item Added",
        description: "Custom checklist item has been added.",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive",
      });
    }
  };

  const currentChecklist = checklists.find(c => c.id === selectedChecklist);
  const currentItems = (currentChecklist?.items as ChecklistItem[]) || [];
  const currentCompletions = completions[selectedChecklist || ''] || [];
  
  const completedCount = currentCompletions.length;
  const totalRequired = currentItems.filter(i => i.required).length;
  const requiredCompleted = currentItems.filter((item, index) => 
    item.required && currentCompletions.some(c => c.item_index === index)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pre-Op Checklist - {surgeryName}</span>
            {currentChecklist && (
              <Badge variant={requiredCompleted === totalRequired ? "default" : "secondary"}>
                {completedCount}/{currentItems.length} Complete
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading checklist...</div>
        ) : checklists.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No checklist exists for this surgery.</p>
            <Button onClick={createDefaultChecklist}>
              <Plus className="mr-2 h-4 w-4" />
              Create Default Checklist
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.length > 1 && (
              <Tabs value={selectedChecklist || undefined} onValueChange={setSelectedChecklist}>
                <TabsList>
                  {checklists.map(cl => (
                    <TabsTrigger key={cl.id} value={cl.id}>{cl.name}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <div className="space-y-2">
              {currentItems.map((item, index) => {
                const isCompleted = currentCompletions.some(c => c.item_index === index);
                const completion = currentCompletions.find(c => c.item_index === index);
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleItemCompletion(selectedChecklist!, index, isCompleted)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                          {item.title}
                        </span>
                        {item.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {item.assignedTo}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {isCompleted && completion && (
                        <p className="text-xs text-green-600 mt-1">
                          Completed {new Date(completion.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add custom item */}
            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Add custom checklist item..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
              />
              <Button onClick={addCustomItem} disabled={!newItemTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress summary */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {requiredCompleted} of {totalRequired} required items complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${totalRequired > 0 ? (requiredCompleted / totalRequired) * 100 : 0}%` }}
                />
              </div>
              {requiredCompleted === totalRequired && totalRequired > 0 && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  All required items complete - patient is ready for surgery
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
