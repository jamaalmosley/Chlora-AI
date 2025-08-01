
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
    console.log("=== Patient Invitation Function Started ===");
    
    // Check required environment variables first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing required environment variables:", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
        hasAnonKey: !!anonKey
      });
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing required environment variables" 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Parse and validate request body
    let body: PatientInvitationRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const { email, practiceId, practiceName, invitedBy } = body;
    console.log("Request data received:", { 
      email: email ? "provided" : "missing", 
      practiceId: practiceId ? "provided" : "missing", 
      practiceName: practiceName ? "provided" : "missing", 
      invitedBy: invitedBy ? "provided" : "missing" 
    });

    // Validate required fields
    if (!email || !practiceId || !practiceName || !invitedBy) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!practiceId) missingFields.push("practiceId");
      if (!practiceName) missingFields.push("practiceName");
      if (!invitedBy) missingFields.push("invitedBy");
      
      console.error("Missing required fields:", missingFields);
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(", ")}` 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Get and validate authorization header
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

    console.log("Verifying user authentication...");
    
    // Verify the user token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("User authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or expired token" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("User authenticated successfully:", user.id);

    // Create service role client for database operations
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    console.log("Creating patient invitation record...");
    
    // Create patient invitation record
    const invitationData = {
      email: email.toLowerCase().trim(),
      practice_id: practiceId,
      invited_by: invitedBy,
      invitation_token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const { data: invitation, error: invitationError } = await supabaseClient
      .from("patient_invitations")
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error("Database error creating patient invitation:", invitationError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create invitation: ${invitationError.message}`,
          details: invitationError.details || "No additional details available"
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("Patient invitation created successfully with ID:", invitation.id);

    // Try to send email if Resend is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    
    if (resendApiKey) {
      try {
        console.log("Sending invitation email...");
        const resend = new Resend(resendApiKey);
        const invitationLink = `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/accept-patient-invitation?token=${invitation.invitation_token}`;

        const emailResponse = await resend.emails.send({
          from: "Medical Practice <onboarding@resend.dev>",
          to: [email],
          subject: `Invitation to join ${practiceName} as a patient`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">You've been invited to join ${practiceName}</h1>
              <p>You have been invited to join <strong>${practiceName}</strong> as a patient.</p>
              <p>Click the button below to accept this invitation:</p>
              <a href="${invitationLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                Accept Invitation
              </a>
              <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
              <p>If you don't have an account yet, you'll need to create one with this email address first.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                If you can't click the button, copy and paste this link into your browser:<br>
                <a href="${invitationLink}">${invitationLink}</a>
              </p>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse.id);
        emailSent = true;
      } catch (emailError: any) {
        console.error("Failed to send email (continuing anyway):", emailError.message || emailError);
        // Don't fail the whole request if email fails - the invitation is still created
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email send");
    }

    const successResponse = {
      success: true,
      message: `Invitation created for ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        practice_id: invitation.practice_id,
        expires_at: invitation.expires_at
      },
      email_sent: emailSent,
      ...(resendApiKey ? {} : { note: "Email not sent - RESEND_API_KEY not configured" })
    };

    console.log("=== Patient Invitation Function Completed Successfully ===");
    
    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("=== Patient Invitation Function Failed ===");
    console.error("Error:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        type: error.name || "UnknownError",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
