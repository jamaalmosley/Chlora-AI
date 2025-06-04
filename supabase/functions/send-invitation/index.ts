
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  department?: string;
  practiceId: string;
  practiceName: string;
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

    const { email, role, department, practiceId, practiceName }: InvitationRequest = await req.json();

    console.log("Sending invitation:", { email, role, practiceId });

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("practice_invitations")
      .insert({
        practice_id: practiceId,
        email: email,
        role: role,
        department: department,
        invited_by: user.id,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      throw invitationError;
    }

    console.log("Invitation created:", invitation);

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
    const invitationLink = `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/accept-invitation?token=${invitation.invitation_token}`;

    const emailResponse = await resend.emails.send({
      from: "Medical Practice <onboarding@resend.dev>",
      to: [email],
      subject: `Invitation to join ${practiceName}`,
      html: `
        <h1>You've been invited to join ${practiceName}</h1>
        <p>You have been invited to join <strong>${practiceName}</strong> as a <strong>${role}</strong>.</p>
        ${department ? `<p>Department: <strong>${department}</strong></p>` : ''}
        <p>Click the link below to accept this invitation:</p>
        <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>This invitation will expire in 7 days.</p>
        <p>If you don't have an account yet, you'll need to create one with this email address first.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
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
