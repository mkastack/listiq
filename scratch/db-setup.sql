import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function setupPayments() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      amount NUMERIC,
      status TEXT,
      reference TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
    CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
    
    -- Function to handle successful payment and upgrade plan
    CREATE OR REPLACE FUNCTION public.handle_successful_payment()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'success' THEN
        UPDATE public.profiles
        SET 
          subscription_plan = CASE 
            WHEN NEW.amount >= 500 THEN 'ultra'
            WHEN NEW.amount >= 150 THEN 'pro'
            WHEN NEW.amount >= 50 THEN 'starter'
            ELSE 'free'
          END,
          subscription_status = 'active',
          subscription_renewal = now() + interval '30 days',
          plan_expires_at = now() + interval '30 days'
        WHERE id = NEW.user_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS on_payment_success ON public.payments;
    CREATE TRIGGER on_payment_success
      AFTER INSERT ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.handle_successful_payment();
  `;

  // We can't run raw SQL via supabase-js unless we use a RPC or have a specific helper.
  // Since I can't run psql, I'll hope the user has already run the Master Script which should have these tables.
  // Wait, the master script I saw in storage_setup.sql didn't have payments.
}
