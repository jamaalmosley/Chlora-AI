import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Video } from "lucide-react";
import PhysicianSearchForm from "@/components/Patient/PhysicianSearchForm";
import PhysicianRecommendations from "@/components/Patient/PhysicianRecommendations";
import VideoConsultation from "@/components/Patient/VideoConsultation";

interface MatchedPhysician {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  availability: string;
  matchScore: number;
  practiceName: string;
  practiceAddress: string;
  bio: string;
  education: string[];
  certifications: string[];
  yearsExperience: number;
}

export default function FindPhysician() {
  const [matchedPhysicians, setMatchedPhysicians] = useState<MatchedPhysician[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<string | null>(null);

  const handleSearchResults = (physicians: MatchedPhysician[]) => {
    setMatchedPhysicians(physicians);
  };

  if (activeConsultation) {
    return (
      <VideoConsultation
        physicianId={activeConsultation}
        onEnd={() => setActiveConsultation(null)}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Find Your Physician</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered matching to connect you with the best healthcare providers
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Physicians
          </TabsTrigger>
          <TabsTrigger value="results" disabled={matchedPhysicians.length === 0} className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Tell Us What You Need</CardTitle>
              <CardDescription>
                Share your health concerns and preferences, and we'll match you with the perfect physician
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhysicianSearchForm
                onSearchComplete={handleSearchResults}
                isSearching={isSearching}
                setIsSearching={setIsSearching}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <PhysicianRecommendations
            physicians={matchedPhysicians}
            onBookConsultation={setActiveConsultation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
