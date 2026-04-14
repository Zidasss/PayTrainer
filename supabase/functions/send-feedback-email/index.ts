import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FEEDBACK_EMAIL = 'support@cloudheadco.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { userName, userEmail, userRole, category, message } = await req.json();
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

    console.log('=== FEEDBACK RECEIVED ===');
    console.log(`From: ${userName} (${userEmail}) - ${userRole}`);
    console.log(`Category: ${category}`);
    console.log(`Message: ${message}`);
    console.log(`RESEND_KEY exists: ${!!RESEND_KEY}`);

    if (RESEND_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Stride <onboarding@resend.dev>',
          to: FEEDBACK_EMAIL,
          subject: `[Stride] ${category} - ${userName}`,
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:48px;height:48px;border-radius:50%;background:#0D9E6D;display:inline-block;text-align:center;line-height:48px;">
                  <span style="color:white;font-size:22px;font-weight:700;">S</span>
                </div>
              </div>
              <h2 style="color:#0D9E6D;margin:0 0 16px;">Novo Feedback — ${category}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <tr><td style="padding:8px 0;color:#666;width:80px;">De:</td><td style="padding:8px 0;font-weight:500;">${userName}</td></tr>
                <tr><td style="padding:8px 0;color:#666;">Email:</td><td style="padding:8px 0;">${userEmail}</td></tr>
                <tr><td style="padding:8px 0;color:#666;">Perfil:</td><td style="padding:8px 0;">${userRole}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
              <div style="background:#f9f9f7;border-radius:8px;padding:16px;margin-bottom:16px;">
                <p style="margin:0;line-height:1.6;color:#333;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
              <p style="font-size:12px;color:#999;text-align:center;">Stride por Cloudhead</p>
            </div>
          `,
        }),
      });

      const resData = await res.json();
      console.log('Resend status:', res.status);
      console.log('Resend response:', JSON.stringify(resData));

      if (!res.ok) {
        console.error('Resend error:', resData);
        return new Response(JSON.stringify({ success: false, error: resData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log('No RESEND_API_KEY configured - email not sent');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});