import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, type } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["signup", "password_reset"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email exists for password reset
    if (type === "password_reset") {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === email);
      
      if (!userExists) {
        // Don't reveal if user exists for security, but still return success
        console.log("Password reset requested for non-existent email:", email);
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, OTP has been sent" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Delete any existing OTP for this email and type
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email)
      .eq("type", type);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        email,
        code: otp,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    // In production, send email with OTP
    // For now, log it (in real app, integrate with email service like Resend)
    console.log(`OTP for ${email} (${type}): ${otp}`);

    // For demo purposes, we'll return the OTP in development
    // In production, remove this and send via email
    const isDev = Deno.env.get("ENVIRONMENT") !== "production";

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        ...(isDev ? { otp } : {}) // Only in dev for testing
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
