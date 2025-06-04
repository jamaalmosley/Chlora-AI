
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

    // Execute SQL to completely rebuild RLS policies without recursion
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Drop all existing problematic policies
        DROP POLICY IF EXISTS "Users can view their own staff records" ON public.staff;
        DROP POLICY IF EXISTS "Users can insert their own staff records" ON public.staff;
        DROP POLICY IF EXISTS "Practice admins can manage staff" ON public.staff;
        DROP POLICY IF EXISTS "Users can view staff in their practice" ON public.staff;
        DROP POLICY IF EXISTS "Users can insert themselves as staff" ON public.staff;

        -- Disable RLS temporarily to avoid issues
        ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;

        -- Create simple security definer functions that don't cause recursion
        CREATE OR REPLACE FUNCTION public.user_can_view_practice_staff(p_practice_id uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          -- Simple check without complex joins
          SELECT EXISTS (
            SELECT 1 FROM public.staff 
            WHERE user_id = auth.uid() 
            AND practice_id = p_practice_id 
            AND status = 'active'
          );
        $$;

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

        -- Re-enable RLS
        ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

        -- Create new, simple policies
        CREATE POLICY "Users can view practice staff" ON public.staff
        FOR SELECT USING (
          public.user_can_view_practice_staff(practice_id)
        );

        CREATE POLICY "Admins can manage staff" ON public.staff
        FOR ALL USING (
          public.user_is_practice_admin(practice_id)
        );

        CREATE POLICY "Users can insert as staff" ON public.staff
        FOR INSERT WITH CHECK (
          user_id = auth.uid()
        );

        -- Also fix practices table policies
        DROP POLICY IF EXISTS "Users can view practices they belong to" ON public.practices;
        DROP POLICY IF EXISTS "Practice owners can manage practices" ON public.practices;

        CREATE POLICY "Users can view their practices" ON public.practices
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.practice_id = practices.id 
            AND staff.user_id = auth.uid() 
            AND staff.status = 'active'
          )
        );

        CREATE POLICY "Admins can update practices" ON public.practices
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.practice_id = practices.id 
            AND staff.user_id = auth.uid() 
            AND staff.role = 'admin' 
            AND staff.status = 'active'
          )
        );

        CREATE POLICY "Anyone can insert practices" ON public.practices
        FOR INSERT WITH CHECK (true);
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
