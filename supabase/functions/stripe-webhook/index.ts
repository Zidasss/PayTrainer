// supabase/functions/stripe-webhook/index.ts
// Uses crypto.subtle for signature verification instead of Stripe SDK

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Verify Stripe webhook signature using crypto.subtle
async function verifySignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc: any, part: string) => {
    const [key, val] = part.split('=');
    acc[key] = val;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSig === signature;
}

// Helper to GET from Stripe API
async function stripeGet(endpoint: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
  });
  return res.json();
}

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  // Verify webhook signature
  const valid = await verifySignature(body, sig, webhookSecret);
  if (!valid) {
    console.error('Invalid webhook signature');
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  console.log('Webhook event:', event.type);

  try {
    switch (event.type) {
      // ─── Subscription paid ───
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (!subId) break;

        const subscription = await stripeGet(`/subscriptions/${subId}`);
        const meta = subscription.metadata || {};

        if (meta.student_id && meta.trainer_id) {
          await supabase.from('subscriptions').upsert({
            student_id: meta.student_id,
            trainer_id: meta.trainer_id,
            plan_id: meta.plan_id || null,
            status: 'active',
            stripe_subscription_id: subId,
            stripe_customer_id: invoice.customer,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: 'student_id,trainer_id' });

          const amount = invoice.amount_paid;
          const platformFee = Math.round(amount * 0.05);
          await supabase.from('payments').insert({
            student_id: meta.student_id,
            trainer_id: meta.trainer_id,
            amount_cents: amount,
            platform_fee_cents: platformFee,
            trainer_amount_cents: amount - platformFee,
            status: 'succeeded',
            stripe_payment_intent_id: invoice.payment_intent,
            description: `Mensalidade - ${invoice.lines?.data?.[0]?.description || 'Plano'}`,
            paid_at: new Date().toISOString(),
          });
        }
        break;
      }

      // ─── Payment failed ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (!subId) break;

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId);
        break;
      }

      // ─── Subscription canceled ───
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // ─── Checkout completed (extra class) ───
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'payment') break;

        const meta = session.metadata || {};
        const amount = session.amount_total || 0;
        const platformFee = Math.round(amount * 0.05);

        if (meta.student_id && meta.trainer_id) {
          await supabase.from('payments').insert({
            student_id: meta.student_id,
            trainer_id: meta.trainer_id,
            amount_cents: amount,
            platform_fee_cents: platformFee,
            trainer_amount_cents: amount - platformFee,
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent,
            description: 'Aula extra avulsa',
            paid_at: new Date().toISOString(),
          });

          if (meta.booking_id) {
            await supabase
              .from('bookings')
              .update({ status: 'confirmed' })
              .eq('id', meta.booking_id);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});