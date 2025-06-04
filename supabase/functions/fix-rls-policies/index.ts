
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Execute SQL to fix RLS policies and prevent infinite recursion
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "Users can view their own staff records" ON public.staff;
        DROP POLICY IF EXISTS "Users can insert their own staff records" ON public.staff;
        DROP POLICY IF EXISTS "Practice admins can manage staff" ON public.staff;
        
        -- Create security definer function to check staff permissions
        CREATE OR REPLACE FUNCTION public.user_is_practice_admin(p_practice_id uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM public.staff 
            WHERE user_id = auth.uid() 
            AND practice_id = p_practice_id 
            AND role = 'admin' 
            AND status = 'active'
          );
        $$;

        -- Create security definer function to check if user can view staff
        CREATE OR REPLACE FUNCTION public.user_can_view_practice_staff(p_practice_id uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM public.staff 
            WHERE user_id = auth.uid() 
            AND practice_id = p_practice_id 
            AND status = 'active'
          );
        $$;

        -- Enable RLS on staff table
        ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

        -- Create new policies using security definer functions
        CREATE POLICY "Users can view staff in their practice" ON public.staff
        FOR SELECT USING (
          public.user_can_view_practice_staff(practice_id)
        );

        CREATE POLICY "Practice admins can manage staff" ON public.staff
        FOR ALL USING (
          public.user_is_practice_admin(practice_id)
        );

        CREATE POLICY "Users can insert themselves as staff" ON public.staff
        FOR INSERT WITH CHECK (
          user_id = auth.uid()
        );
      `
    });

    if (sqlError) {
      console.error('SQL execution error:', sqlError);
      throw sqlError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "RLS policies fixed successfully" }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error fixing RLS policies:", error);
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
