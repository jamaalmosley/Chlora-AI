import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  chiefConcern: z.string().min(10, "Please describe your concern in at least 10 characters"),
  specialty: z.string().optional(),
  location: z.string().min(3, "Please enter your location"),
  insuranceProvider: z.string().optional(),
  urgency: z.enum(["routine", "soon", "urgent"]),
  preferredGender: z.string().optional(),
  languagePreference: z.string().optional(),
  virtualVisit: z.boolean().default(false),
  acceptingNewPatients: z.boolean().default(true),
});

interface PhysicianSearchFormProps {
  onSearchComplete: (physicians: any[]) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
}

export default function PhysicianSearchForm({ onSearchComplete, isSearching, setIsSearching }: PhysicianSearchFormProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chiefConcern: "",
      location: "",
      urgency: "routine",
      virtualVisit: false,
      acceptingNewPatients: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-physicians', {
        body: values
      });

      if (error) throw error;

      if (data?.physicians) {
        onSearchComplete(data.physicians);
        toast({
          title: "Match Complete",
          description: `Found ${data.physicians.length} physicians matching your needs`,
        });
      }
    } catch (error) {
      console.error('Error matching physicians:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search for physicians. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="chiefConcern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What brings you in today?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your health concern or reason for visit..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be as detailed as possible to help us find the right specialist
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Specialty (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any specialty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General Practice</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="oncology">Oncology</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Location</FormLabel>
                <FormControl>
                  <Input placeholder="City, State or ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="insuranceProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Provider (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Blue Cross, UnitedHealth" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How soon do you need care?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="routine">Routine (within 2 weeks)</SelectItem>
                    <SelectItem value="soon">Soon (within a few days)</SelectItem>
                    <SelectItem value="urgent">Urgent (as soon as possible)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preferredGender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Gender (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="any">No preference</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="languagePreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Preference (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Spanish, Mandarin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="virtualVisit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Open to virtual visits</FormLabel>
                  <FormDescription>
                    Video consultations can be done from home
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptingNewPatients"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Only show physicians accepting new patients</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Your Match...
            </>
          ) : (
            "Find My Physician"
          )}
        </Button>
      </form>
    </Form>
  );
}
