import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Calendar, Video, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Physician {
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

interface PhysicianRecommendationsProps {
  physicians: Physician[];
  onBookConsultation: (physicianId: string) => void;
}

export default function PhysicianRecommendations({ physicians, onBookConsultation }: PhysicianRecommendationsProps) {
  if (physicians.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No results yet. Complete the search form to find physicians.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Top Matches</h2>
          <p className="text-muted-foreground mt-1">
            Found {physicians.length} physicians perfectly suited to your needs
          </p>
        </div>
      </div>

      {physicians.map((physician, index) => (
        <Card key={physician.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{physician.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{physician.name}</CardTitle>
                    {index === 0 && (
                      <Badge variant="default" className="bg-primary">
                        Best Match
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 text-base">
                    {physician.specialty}
                  </CardDescription>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{physician.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {physician.distance}
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {physician.matchScore}% Match
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{physician.bio}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Practice</h4>
                  <p className="text-sm font-medium">{physician.practiceName}</p>
                  <p className="text-sm text-muted-foreground">{physician.practiceAddress}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Education</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {physician.education.map((edu, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Experience</span>
                    <span className="text-sm text-muted-foreground">{physician.yearsExperience} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Next Available</span>
                    <span className="text-sm text-muted-foreground">{physician.availability}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {physician.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => onBookConsultation(physician.id)}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Book Video Consultation
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule In-Person Visit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
