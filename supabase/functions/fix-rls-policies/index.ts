
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
        -- Drop ALL existing policies on all tables to start fresh
        DO $$ 
        DECLARE
            pol RECORD;
        BEGIN
            -- Drop all policies on practices table
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'practices' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.practices', pol.policyname);
            END LOOP;
            
            -- Drop all policies on staff table
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'staff' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.staff', pol.policyname);
            END LOOP;
            
            -- Drop all policies on profiles table
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
            END LOOP;
            
            -- Drop all policies on doctors table
            FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'doctors' AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.doctors', pol.policyname);
            END LOOP;
        END $$;

        -- Drop existing functions that might cause recursive issues
        DROP FUNCTION IF EXISTS public.user_can_view_practice_staff(uuid);
        DROP FUNCTION IF EXISTS public.user_is_practice_admin(uuid);
        DROP FUNCTION IF EXISTS public.get_user_practice_ids();
        DROP FUNCTION IF EXISTS public.is_practice_admin(uuid);
        DROP FUNCTION IF EXISTS public.user_belongs_to_practice(uuid);

        -- Temporarily disable RLS to avoid issues during recreation
        ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.practices DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;

        -- Create base case security definer functions that don't reference policies
        CREATE OR REPLACE FUNCTION public.get_user_practice_ids()
        RETURNS uuid[]
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          -- Base case: Always check for null first to prevent recursion
          SELECT CASE 
            WHEN auth.uid() IS NULL THEN ARRAY[]::uuid[]
            ELSE COALESCE(
              (SELECT ARRAY_AGG(practice_id) 
               FROM public.staff 
               WHERE user_id = auth.uid() 
               AND status = 'active'), 
              ARRAY[]::uuid[]
            )
          END;
        $$;

        CREATE OR REPLACE FUNCTION public.is_practice_admin(p_practice_id uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          -- Base case: Always check for nulls first
          SELECT CASE 
            WHEN auth.uid() IS NULL OR p_practice_id IS NULL THEN false
            ELSE EXISTS (
              SELECT 1 FROM public.staff 
              WHERE user_id = auth.uid() 
              AND practice_id = p_practice_id 
              AND role = 'admin' 
              AND status = 'active'
            )
          END;
        $$;

        CREATE OR REPLACE FUNCTION public.can_access_practice(p_practice_id uuid)
        RETURNS boolean
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          -- Base case: Direct staff table query without RLS dependency
          SELECT CASE 
            WHEN auth.uid() IS NULL OR p_practice_id IS NULL THEN false
            ELSE EXISTS (
              SELECT 1 FROM public.staff 
              WHERE user_id = auth.uid() 
              AND practice_id = p_practice_id 
              AND status = 'active'
            )
          END;
        $$;

        -- Re-enable RLS
        ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

        -- Create non-recursive policies for practices table
        CREATE POLICY "view_own_practices" ON public.practices
        FOR SELECT 
        USING (
          public.can_access_practice(id)
        );

        CREATE POLICY "admin_update_practices" ON public.practices
        FOR UPDATE 
        USING (
          public.is_practice_admin(id)
        );

        CREATE POLICY "anyone_insert_practices" ON public.practices
        FOR INSERT 
        WITH CHECK (true);

        -- Create non-recursive policies for staff table
        CREATE POLICY "view_practice_staff" ON public.staff
        FOR SELECT 
        USING (
          public.can_access_practice(practice_id)
        );

        CREATE POLICY "admin_manage_staff" ON public.staff
        FOR ALL 
        USING (
          public.is_practice_admin(practice_id)
        );

        CREATE POLICY "insert_self_as_staff" ON public.staff
        FOR INSERT 
        WITH CHECK (
          user_id = auth.uid()
        );

        -- Create simple policies for profiles table
        CREATE POLICY "view_own_profile" ON public.profiles
        FOR SELECT 
        USING (
          id = auth.uid()
        );

        CREATE POLICY "update_own_profile" ON public.profiles
        FOR UPDATE 
        USING (
          id = auth.uid()
        );

        -- Create simple policies for doctors table
        CREATE POLICY "view_own_doctor_record" ON public.doctors
        FOR SELECT 
        USING (
          user_id = auth.uid()
        );

        CREATE POLICY "insert_own_doctor_record" ON public.doctors
        FOR INSERT 
        WITH CHECK (
          user_id = auth.uid()
        );

        CREATE POLICY "update_own_doctor_record" ON public.doctors
        FOR UPDATE 
        USING (
          user_id = auth.uid()
        );
      `
    });

    if (sqlError) {
      console.error('SQL execution error:', sqlError);
      throw sqlError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "RLS policies completely rebuilt without recursion" }),
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
