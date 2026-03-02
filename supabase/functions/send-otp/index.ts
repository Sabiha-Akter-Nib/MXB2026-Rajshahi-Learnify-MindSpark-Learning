import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === email);
    if (userExists) {
      return new Response(
        JSON.stringify({ error: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Delete old OTPs for this email
    await supabase.from("otp_codes").delete().eq("email", email).eq("type", "signup");

    // Insert new OTP
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email,
      code,
      type: "signup",
      expires_at: expiresAt,
      verified: false,
    });

    if (insertError) throw insertError;

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OddhaboshAI <onboarding@resend.dev>",
        to: [email],
        subject: "আপনার OddhaboshAI সাইন আপ কোড",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #1A1F30, #5B4364); border-radius: 16px; color: white;">
            <h1 style="text-align: center; font-size: 28px; margin-bottom: 8px;">OddhaboshAI</h1>
            <p style="text-align: center; color: #B5BFEE; margin-bottom: 24px;">Your AI Study Companion</p>
            <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; text-align: center;">
              <p style="margin-bottom: 16px; font-size: 16px;">আপনার সাইন আপ ভেরিফিকেশন কোড:</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #E0D2FF; margin-bottom: 16px;">${code}</div>
              <p style="font-size: 13px; color: #B5BFEE;">এই কোডটি ১০ মিনিট পর্যন্ত কার্যকর থাকবে।</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
