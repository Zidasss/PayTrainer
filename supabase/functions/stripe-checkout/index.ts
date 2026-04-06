// supabase/functions/stripe-checkout/index.ts
// Deploy with: supabase functions deploy stripe-checkout
//
// This Edge Function handles:
// 1. Creating Stripe Connect accounts for trainers
// 2. Creating checkout sessions for students (with 5% platform fee)
// 3. Creating Stripe billing portal sessions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Not authenticated');

    const { action, ...params } = await req.json();

    // ─── TRAINER: Create Stripe Connect Account ───
    if (action === 'create_connect_account') {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      await supabase
        .from('trainers')
        .update({ stripe_account_id: account.id })
        .eq('id', user.id);

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${params.returnUrl}?refresh=true`,
        return_url: `${params.returnUrl}?success=true`,
        type: 'account_onboarding',
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── TRAINER: Check Connect status ───
    if (action === 'check_connect_status') {
      const { data: trainer } = await supabase
        .from('trainers')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (!trainer?.stripe_account_id) {
        return new Response(JSON.stringify({ complete: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const account = await stripe.accounts.retrieve(trainer.stripe_account_id);
      const complete = account.charges_enabled && account.payouts_enabled;

      if (complete) {
        await supabase
          .from('trainers')
          .update({ stripe_onboarding_complete: true })
          .eq('id', user.id);
      }

      return new Response(JSON.stringify({ complete, account_id: trainer.stripe_account_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── STUDENT: Create subscription checkout ───
    if (action === 'create_subscription') {
      const { plan_id, trainer_id } = params;

      const { data: plan } = await supabase
        .from('plans')
        .select('*, trainers(stripe_account_id)')
        .eq('id', plan_id)
        .single();

      if (!plan) throw new Error('Plan not found');
      const trainerStripeId = plan.trainers.stripe_account_id;
      if (!trainerStripeId) throw new Error('Trainer not set up for payments');

      // Create or retrieve Stripe customer
      let { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('student_id', user.id)
        .eq('trainer_id', trainer_id)
        .maybeSingle();

      let customerId = sub?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
      }

      // Create Stripe price if not exists
      let stripePriceId = plan.stripe_price_id;
      if (!stripePriceId) {
        const product = await stripe.products.create({
          name: `FitAgenda - ${plan.name}`,
          metadata: { plan_id: plan.id, trainer_id },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price_cents,
          currency: 'brl',
          recurring: { interval: 'month' },
        });

        stripePriceId = price.id;
        await supabase
          .from('plans')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', plan.id);
      }

      // 5% platform fee
      const applicationFeePercent = 5;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: stripePriceId, quantity: 1 }],
        subscription_data: {
          application_fee_percent: applicationFeePercent,
          transfer_data: { destination: trainerStripeId },
          metadata: {
            student_id: user.id,
            trainer_id,
            plan_id: plan.id,
          },
        },
        success_url: `${params.returnUrl}/student/payment?success=true`,
        cancel_url: `${params.returnUrl}/student/payment?canceled=true`,
        metadata: {
          student_id: user.id,
          trainer_id,
          plan_id: plan.id,
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── STUDENT: Billing portal ───
    if (action === 'billing_portal') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('student_id', user.id)
        .not('stripe_customer_id', 'is', null)
        .single();

      if (!sub?.stripe_customer_id) throw new Error('No billing info');

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: params.returnUrl,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── STUDENT: Pay for extra class ───
    if (action === 'pay_extra_class') {
      const { trainer_id, booking_id } = params;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('stripe_account_id, extra_class_price')
        .eq('id', trainer_id)
        .single();

      if (!trainer?.stripe_account_id) throw new Error('Trainer not set up');

      const amount = trainer.extra_class_price;
      const platformFee = Math.round(amount * 0.05);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: { name: 'FitAgenda - Aula Extra' },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: trainer.stripe_account_id },
          metadata: { student_id: user.id, trainer_id, booking_id },
        },
        success_url: `${params.returnUrl}/student/schedule?paid=true`,
        cancel_url: `${params.returnUrl}/student/schedule?canceled=true`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
