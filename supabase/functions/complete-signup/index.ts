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
    const { email, password, full_name, school_name, class: studentClass, version, division, username } = await req.json();

    if (!email || !password || !full_name || !school_name || !studentClass || !version) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify that OTP was verified for this email
    const { data: verifiedOtp } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("type", "signup")
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!verifiedOtp || verifiedOtp.length === 0) {
      return new Response(
        JSON.stringify({ error: "ইমেইল ভেরিফাই করা হয়নি। প্রথমে OTP ভেরিফাই করুন।" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with admin API (email already confirmed)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        school_name,
        class: parseInt(studentClass),
        version,
        ...(division ? { division } : {}),
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা হয়েছে।" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    // Clean up used OTP codes
    await supabase.from("otp_codes").delete().eq("email", email).eq("type", "signup");

    // Set username if provided
    if (username) {
      await supabase.from("profiles").update({ username }).eq("user_id", userData.user.id);
    }

    return new Response(JSON.stringify({ success: true, user_id: userData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("complete-signup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
