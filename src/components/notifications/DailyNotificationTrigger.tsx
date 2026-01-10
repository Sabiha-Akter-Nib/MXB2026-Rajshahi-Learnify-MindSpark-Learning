import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Motivational messages for local notifications
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

const NOTIFICATION_STORAGE_KEY = "mindspark_last_notification";
const NOTIFICATION_INTERVAL_HOURS = 24; // Send a notification once per day

export const DailyNotificationTrigger = () => {
  const { user } = useAuth();

  const showNotification = useCallback(async (isBangla: boolean) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const messages = isBangla ? motivationalMessagesBn : motivationalMessages;
    const randomIndex = Math.floor(Math.random() * messages.length);
    const message = messages[randomIndex];

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(message.title, {
        body: message.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "daily-motivation",
        requireInteraction: false,
        silent: false,
      });
    } catch {
      // Fallback to basic notification
      new Notification(message.title, {
        body: message.body,
        icon: "/favicon.ico",
        tag: "daily-motivation",
      });
    }
  }, []);

  const checkAndSendNotification = useCallback(async () => {
    if (!user) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Check last notification time
    const lastNotification = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const now = Date.now();

    if (lastNotification) {
      const lastTime = parseInt(lastNotification, 10);
      const hoursSinceLastNotification = (now - lastTime) / (1000 * 60 * 60);

      // Don't send if we sent recently
      if (hoursSinceLastNotification < NOTIFICATION_INTERVAL_HOURS) {
        return;
      }
    }

    // Get user's language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("version")
      .eq("user_id", user.id)
      .maybeSingle();

    const isBangla = profile?.version === "bangla";

    // Show the notification
    await showNotification(isBangla);

    // Update last notification time
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, now.toString());
  }, [user, showNotification]);

  useEffect(() => {
    // Check on component mount with a delay to not interrupt initial page load
    const timer = setTimeout(() => {
      checkAndSendNotification();
    }, 5000);

    return () => clearTimeout(timer);
  }, [checkAndSendNotification]);

  // Also set up visibility change listener to show notification when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndSendNotification();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkAndSendNotification]);

  return null; // This component doesn't render anything
};

export default DailyNotificationTrigger;