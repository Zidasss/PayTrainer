import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_API = 'https://api.stripe.com/v1';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function stripe(endpoint: string, params: Record<string, any> = {}, method = 'POST') {
  const body = new URLSearchParams();
  flattenParams(params, body);

  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : body.toString(),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

function flattenParams(obj: any, params: URLSearchParams, prefix = '') {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
      flattenParams(val, params, fullKey);
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'object') {
          flattenParams(item, params, `${fullKey}[${i}]`);
        } else {
          params.append(`${fullKey}[${i}]`, String(item));
        }
      });
    } else if (val !== null && val !== undefined) {
      params.append(fullKey, String(val));
    }
  }
}

async function stripeGet(endpoint: string) {
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// Get the fee percentage for a trainer (checks referral discount)
async function getTrainerFeePercent(supabase: any, trainerId: string): Promise<number> {
  const { data: trainer } = await supabase
    .from('trainers')
    .select('free_fee_until')
    .eq('id', trainerId)
    .single();

  if (trainer?.free_fee_until) {
    const freeUntil = new Date(trainer.free_fee_until);
    if (freeUntil > new Date()) {
      return 4; // Reduced fee during referral reward period
    }
  }
  return 8; // Default fee
}

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
      const account = await stripe('/accounts', {
        type: 'express',
        country: 'BR',
        email: user.email,
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        business_type: 'individual',
      });

      await supabase
        .from('trainers')
        .update({ stripe_account_id: account.id })
        .eq('id', user.id);

      const accountLink = await stripe('/account_links', {
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

      const account = await stripeGet(`/accounts/${trainer.stripe_account_id}`);
      const complete = account.charges_enabled && account.payouts_enabled;

      if (complete) {
        await supabase
          .from('trainers')
          .update({ stripe_onboarding_complete: true })
          .eq('id', user.id);

        // Check if this trainer was referred — activate referral reward for referrer
        const { data: referral } = await supabase
          .from('referrals')
          .select('*')
          .eq('referred_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (referral) {
          // Mark referral as active
          await supabase.from('referrals')
            .update({ status: 'active', activated_at: new Date().toISOString() })
            .eq('id', referral.id);
        }
      }

      return new Response(JSON.stringify({ complete, account_id: trainer.stripe_account_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── TRAINER: Create Express Dashboard login link ───
    if (action === 'create_login_link') {
      const { data: trainer } = await supabase
        .from('trainers')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (!trainer?.stripe_account_id) throw new Error('No Stripe account');

      const loginLink = await stripe(`/accounts/${trainer.stripe_account_id}/login_links`, {});

      return new Response(JSON.stringify({ url: loginLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── STUDENT: Create subscription checkout ───
    if (action === 'create_subscription') {
      const { plan_id, trainer_id } = params;

      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (!plan) throw new Error('Plan not found');

      const { data: trainer } = await supabase
        .from('trainers')
        .select('stripe_account_id')
        .eq('id', trainer_id)
        .single();

      const trainerStripeId = trainer?.stripe_account_id;
      if (!trainerStripeId) throw new Error('Trainer not set up for payments');

      // Get dynamic fee percentage
      const feePercent = await getTrainerFeePercent(supabase, trainer_id);

      let { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('student_id', user.id)
        .eq('trainer_id', trainer_id)
        .maybeSingle();

      let customerId = sub?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe('/customers', {
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
      }

      let stripePriceId = plan.stripe_price_id;
      if (!stripePriceId) {
        const product = await stripe('/products', {
          name: `Stride - ${plan.name}`,
          metadata: { plan_id: plan.id, trainer_id },
        });

        const price = await stripe('/prices', {
          product: product.id,
          unit_amount: String(plan.price_cents),
          currency: 'brl',
          'recurring[interval]': 'month',
        });

        stripePriceId = price.id;
        await supabase
          .from('plans')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', plan.id);
      }

      const session = await stripe('/checkout/sessions', {
        customer: customerId,
        mode: 'subscription',
        'payment_method_types[0]': 'card',
        'line_items[0][price]': stripePriceId,
        'line_items[0][quantity]': '1',
        'subscription_data[application_fee_percent]': String(feePercent),
        'subscription_data[transfer_data][destination]': trainerStripeId,
        'subscription_data[metadata][student_id]': user.id,
        'subscription_data[metadata][trainer_id]': trainer_id,
        'subscription_data[metadata][plan_id]': plan.id,
        'subscription_data[metadata][fee_percent]': String(feePercent),
        success_url: `${params.returnUrl}/student/payment?success=true`,
        cancel_url: `${params.returnUrl}/student/payment?canceled=true`,
        'metadata[student_id]': user.id,
        'metadata[trainer_id]': trainer_id,
        'metadata[plan_id]': plan.id,
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

      const session = await stripe('/billing_portal/sessions', {
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

      // Get dynamic fee percentage for extra classes too
      const feePercent = await getTrainerFeePercent(supabase, trainer_id);
      const platformFee = Math.round(amount * (feePercent / 100));

      const session = await stripe('/checkout/sessions', {
        mode: 'payment',
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][product_data][name]': 'Stride - Aula Extra',
        'line_items[0][price_data][unit_amount]': String(amount),
        'line_items[0][quantity]': '1',
        'payment_intent_data[application_fee_amount]': String(platformFee),
        'payment_intent_data[transfer_data][destination]': trainer.stripe_account_id,
        'payment_intent_data[metadata][student_id]': user.id,
        'payment_intent_data[metadata][trainer_id]': trainer_id,
        'payment_intent_data[metadata][booking_id]': booking_id || '',
        success_url: `${params.returnUrl}/student/schedule?paid=true`,
        cancel_url: `${params.returnUrl}/student/schedule?canceled=true`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Validate referral code ───
    if (action === 'validate_referral') {
      const { code } = params;

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id, referral_code, profiles(full_name)')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (!trainer) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        valid: true,
        referrer_id: trainer.id,
        referrer_name: trainer.profiles?.full_name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Apply referral after signup ───
    if (action === 'apply_referral') {
      const { referral_code } = params;

      const { data: referrer } = await supabase
        .from('trainers')
        .select('id, referral_code')
        .eq('referral_code', referral_code.toUpperCase())
        .single();

      if (!referrer || referrer.id === user.id) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid code' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save referral
      await supabase.from('trainers')
        .update({ referred_by: referrer.id })
        .eq('id', user.id);

      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        status: 'pending',
      });

      // Extend from current end date, max 6 months from now
      const { data: referrerTrainer } = await supabase
        .from('trainers')
        .select('free_fee_until')
        .eq('id', referrer.id)
        .single();

      const maxLimit = new Date();
      maxLimit.setMonth(maxLimit.getMonth() + 6);

      const baseDate = referrerTrainer?.free_fee_until && new Date(referrerTrainer.free_fee_until) > new Date()
        ? new Date(referrerTrainer.free_fee_until)
        : new Date();
      const freeUntil = new Date(baseDate);
      freeUntil.setMonth(freeUntil.getMonth() + 2);

      // Cap at 6 months from today
      if (freeUntil > maxLimit) {
        freeUntil.setTime(maxLimit.getTime());
      }

      await supabase.from('trainers')
        .update({ free_fee_until: freeUntil.toISOString() })
        .eq('id', referrer.id);

      // Mark referral as rewarded
      await supabase.from('referrals')
        .update({ status: 'rewarded', reward_applied: true })
        .eq('referrer_id', referrer.id)
        .eq('referred_id', user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    console.error('Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});