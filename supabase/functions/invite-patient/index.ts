
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PatientInvitationRequest {
  email: string;
  practiceId: string;
  practiceName: string;
  invitedBy: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing patient invitation request...");

    // Parse JSON body
    const body: PatientInvitationRequest = await req.json();
    const { email, practiceId, practiceName, invitedBy } = body;

    console.log("Request data:", { email, practiceId, practiceName, invitedBy });

    // Validate required fields
    if (!email || !practiceId || !practiceName || !invitedBy) {
      console.error("Missing required fields:", { email: !!email, practiceId: !!practiceId, practiceName: !!practiceName, invitedBy: !!invitedBy });
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, practiceId, practiceName, or invitedBy" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Use service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the user from the auth header for authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Verify the user token
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("User authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("User authenticated:", user.id);

    // Create patient invitation record
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("patient_invitations")
      .insert({
        email: email,
        practice_id: practiceId,
        invited_by: invitedBy,
        invitation_token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating patient invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: `Failed to create invitation: ${invitationError.message}` }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("Patient invitation created:", invitation);

    // Try to send email if Resend is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const invitationLink = `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/accept-patient-invitation?token=${invitation.invitation_token}`;

        const emailResponse = await resend.emails.send({
          from: "Medical Practice <onboarding@resend.dev>",
          to: [email],
          subject: `Invitation to join ${practiceName} as a patient`,
          html: `
            <h1>You've been invited to join ${practiceName}</h1>
            <p>You have been invited to join <strong>${practiceName}</strong> as a patient.</p>
            <p>Click the link below to accept this invitation:</p>
            <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <p>If you don't have an account yet, you'll need to create one with this email address first.</p>
          `,
        });

        console.log("Patient invitation email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Failed to send email (continuing anyway):", emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        invitation: invitation
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Invite-patient function failed:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        details: error.stack || "No stack trace available"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
