import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FEEDBACK_EMAIL = 'gustavo.zavadniakk@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { userName, userEmail, userRole, category, message } = await req.json();
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Stride <onboarding@resend.dev>',
          to: FEEDBACK_EMAIL,
          subject: `[Stride] ${category} - ${userName}`,
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#0D9E6D;">Novo Feedback — ${category}</h2>
              <p><strong>De:</strong> ${userName} (${userEmail})</p>
              <p><strong>Perfil:</strong> ${userRole}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
              <p style="line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
              <p style="font-size:12px;color:#999;">Stride por Cloudhead</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});