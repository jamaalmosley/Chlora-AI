import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI to analyze patient needs and generate recommendations
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a medical matching AI that helps patients find the best physicians. 
            Analyze the patient's needs and generate a list of 3-5 recommended physicians with detailed profiles.
            Return ONLY valid JSON in this exact format:
            {
              "physicians": [
                {
                  "id": "unique-id",
                  "name": "Dr. Full Name",
                  "specialty": "Specialty Name",
                  "rating": 4.8,
                  "distance": "2.3 miles",
                  "availability": "Tomorrow at 2 PM",
                  "insuranceAccepted": true,
                  "matchScore": 95,
                  "practiceName": "Practice Name",
                  "practiceAddress": "Full Address",
                  "bio": "Detailed bio",
                  "education": ["Degree from University"],
                  "certifications": ["Board Certification"],
                  "yearsExperience": 15
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Patient Information:
            Chief Concern: ${body.chiefConcern}
            Preferred Specialty: ${body.specialty || "Any"}
            Location: ${body.location}
            Insurance: ${body.insuranceProvider || "Not specified"}
            Urgency: ${body.urgency}
            Preferred Gender: ${body.preferredGender || "No preference"}
            Language: ${body.languagePreference || "English"}
            Virtual Visit Acceptable: ${body.virtualVisit ? "Yes" : "No"}
            Accepting New Patients Only: ${body.acceptingNewPatients ? "Yes" : "No"}
            
            Generate realistic physician recommendations based on this information.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON in AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in match-physicians:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        physicians: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
