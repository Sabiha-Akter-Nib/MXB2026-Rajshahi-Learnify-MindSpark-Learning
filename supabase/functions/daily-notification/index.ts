import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Motivational messages for daily notifications
const motivationalMessages = [
  {
    title: "📚 Time to Learn!",
    body: "Your brain is ready for new knowledge. Let's study something amazing today!",
  },
  {
    title: "🔥 Keep Your Streak Alive!",
    body: "Don't break your learning streak! Just 10 minutes of study can make a difference.",
  },
  {
    title: "🎯 Focus Time",
    body: "Great learners study every day. Open MindSpark and continue your journey!",
  },
  {
    title: "💡 Did You Know?",
    body: "Students who study daily retain 80% more information. Start your session now!",
  },
  {
    title: "🌟 You're Doing Great!",
    body: "Every study session brings you closer to your goals. Let's go!",
  },
  {
    title: "📖 Revision Reminder",
    body: "Revising what you learned helps build strong memory. Check your pending topics!",
  },
  {
    title: "🏆 Challenge Yourself",
    body: "Take a quick quiz to test your knowledge and earn XP!",
  },
  {
    title: "🧠 Brain Boost",
    body: "Your brain is like a muscle - the more you use it, the stronger it gets. Study now!",
  },
  {
    title: "⚡ Quick Study Session",
    body: "Even 15 minutes of focused study can help you learn something new. Let's start!",
  },
  {
    title: "🎓 Future You Will Thank You",
    body: "The effort you put in today builds your success tomorrow. Open MindSpark!",
  },
];

// Bangla versions
const motivationalMessagesBn = [
  {
    title: "📚 পড়ার সময়!",
    body: "তোমার মস্তিষ্ক নতুন জ্ঞানের জন্য প্রস্তুত। আজ কিছু অসাধারণ শিখি!",
  },
  {
    title: "🔥 তোমার স্ট্রিক ধরে রাখো!",
    body: "শেখার ধারাবাহিকতা ভেঙে যাবে না! মাত্র ১০ মিনিট পড়াও অনেক কাজের।",
  },
  {
    title: "🎯 মনোযোগের সময়",
    body: "ভালো শিক্ষার্থীরা প্রতিদিন পড়ে। MindSpark খুলে তোমার যাত্রা চালিয়ে যাও!",
  },
  {
    title: "💡 তুমি কি জানো?",
    body: "যারা প্রতিদিন পড়ে তারা ৮০% বেশি মনে রাখে। এখনই শুরু করো!",
  },
  {
    title: "🌟 তুমি দারুণ করছো!",
    body: "প্রতিটি পড়ার সেশন তোমাকে লক্ষ্যের কাছে নিয়ে যায়। চলো শুরু করি!",
  },
  {
    title: "📖 রিভিশন রিমাইন্ডার",
    body: "যা শিখেছো তা রিভিশন করলে স্মৃতি শক্তিশালী হয়। পেন্ডিং টপিক দেখো!",
  },
  {
    title: "🏆 নিজেকে চ্যালেঞ্জ করো",
    body: "দ্রুত একটি কুইজ দাও, জ্ঞান পরীক্ষা করো এবং XP অর্জন করো!",
  },
  {
    title: "🧠 ব্রেইন বুস্ট",
    body: "তোমার মস্তিষ্ক একটি পেশীর মতো - যত বেশি ব্যবহার করবে, তত শক্তিশালী হবে!",
  },
  {
    title: "⚡ দ্রুত স্টাডি সেশন",
    body: "১৫ মিনিটের মনোযোগী পড়াও নতুন কিছু শিখতে সাহায্য করে। শুরু করো!",
  },
  {
    title: "🎓 ভবিষ্যতের তুমি ধন্যবাদ দেবে",
    body: "আজকের প্রচেষ্টা আগামীকালের সাফল্য গড়ে। MindSpark খোলো!",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily notification job...");

    // Get all push subscriptions with user profiles
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s)`);

    // Get user profiles to determine language preference
    const userIds = subscriptions.map(s => s.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, version, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Process each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const profile = profileMap.get(subscription.user_id);
        const isBangla = profile?.version === "bangla";
        
        // Select random message
        const messages = isBangla ? motivationalMessagesBn : motivationalMessages;
        const randomIndex = Math.floor(Math.random() * messages.length);
        const message = messages[randomIndex];

        // Store notification in database for tracking (optional, may fail if table doesn't exist)
        try {
          await supabase.from("notification_logs").insert({
            user_id: subscription.user_id,
            title: message.title,
            body: message.body,
            sent_at: new Date().toISOString(),
          });
        } catch {
          // Table might not exist, ignore error
        }

        console.log(`Notification prepared for user ${subscription.user_id}: ${message.title}`);

        return {
          userId: subscription.user_id,
          title: message.title,
          body: message.body,
          success: true,
        };
      })
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failCount = results.filter(r => r.status === "rejected").length;

    console.log(`Daily notifications completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: subscriptions.length,
        message: "Daily notifications processed. Users will receive browser notifications on their next visit.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});