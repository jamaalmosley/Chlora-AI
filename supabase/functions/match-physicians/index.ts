import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Input validation
    if (!body.chiefConcern || typeof body.chiefConcern !== "string" || body.chiefConcern.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid chiefConcern - must be a string up to 1000 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.location || typeof body.location !== "string" || body.location.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid location - must be a string up to 200 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.urgency || !["routine", "soon", "urgent"].includes(body.urgency)) {
      return new Response(
        JSON.stringify({ error: "Invalid urgency - must be 'routine', 'soon', or 'urgent'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optional fields validation
    const specialty = body.specialty && typeof body.specialty === "string" ? body.specialty.slice(0, 100) : null;
    const insuranceProvider = body.insuranceProvider && typeof body.insuranceProvider === "string" ? body.insuranceProvider.slice(0, 100) : null;
    const preferredGender = body.preferredGender && typeof body.preferredGender === "string" ? body.preferredGender.slice(0, 20) : null;
    const languagePreference = body.languagePreference && typeof body.languagePreference === "string" ? body.languagePreference.slice(0, 50) : null;
    const virtualVisit = body.virtualVisit === true;
    const acceptingNewPatients = body.acceptingNewPatients === true;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Physician match request from user ${user.id}`);

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
            Preferred Specialty: ${specialty || "Any"}
            Location: ${body.location}
            Insurance: ${insuranceProvider || "Not specified"}
            Urgency: ${body.urgency}
            Preferred Gender: ${preferredGender || "No preference"}
            Language: ${languagePreference || "English"}
            Virtual Visit Acceptable: ${virtualVisit ? "Yes" : "No"}
            Accepting New Patients Only: ${acceptingNewPatients ? "Yes" : "No"}
            
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
        error: "An error occurred while processing your request",
        physicians: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
