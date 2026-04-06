// supabase/functions/stripe-webhook/index.ts
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    // ─── Subscription created / renewed ───
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (!subId) break;

      const subscription = await stripe.subscriptions.retrieve(subId);
      const meta = subscription.metadata;

      // Upsert subscription
      await supabase.from('subscriptions').upsert({
        student_id: meta.student_id,
        trainer_id: meta.trainer_id,
        plan_id: meta.plan_id,
        status: 'active',
        stripe_subscription_id: subId,
        stripe_customer_id: invoice.customer as string,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'student_id,trainer_id' });

      // Record payment
      const amount = invoice.amount_paid;
      const platformFee = Math.round(amount * 0.05);
      await supabase.from('payments').insert({
        subscription_id: null, // will be resolved
        student_id: meta.student_id,
        trainer_id: meta.trainer_id,
        amount_cents: amount,
        platform_fee_cents: platformFee,
        trainer_amount_cents: amount - platformFee,
        status: 'succeeded',
        stripe_payment_intent_id: invoice.payment_intent as string,
        description: `Mensalidade - ${invoice.lines.data[0]?.description || 'Plano'}`,
        paid_at: new Date().toISOString(),
      });
      break;
    }

    // ─── Payment failed ───
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (!subId) break;

      const subscription = await stripe.subscriptions.retrieve(subId);
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subId);
      break;
    }

    // ─── Subscription canceled ───
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    // ─── One-time payment (extra class) ───
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'payment') break;

      const meta = session.metadata || {};
      const amount = session.amount_total || 0;
      const platformFee = Math.round(amount * 0.05);

      await supabase.from('payments').insert({
        student_id: meta.student_id,
        trainer_id: meta.trainer_id,
        amount_cents: amount,
        platform_fee_cents: platformFee,
        trainer_amount_cents: amount - platformFee,
        status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent as string,
        description: 'Aula extra avulsa',
        paid_at: new Date().toISOString(),
      });

      // Confirm booking
      if (meta.booking_id) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', meta.booking_id);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
