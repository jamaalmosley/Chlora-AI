
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { email, practiceId, practiceName, invitedBy }: PatientInvitationRequest = await req.json();

    console.log("Inviting patient:", { email, practiceId, practiceName });

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
      throw invitationError;
    }

    console.log("Patient invitation created:", invitation);

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!resend) {
      console.log("No Resend API key found, skipping email");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation created (email sending not configured)" 
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send invitation email
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

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in invite-patient function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
