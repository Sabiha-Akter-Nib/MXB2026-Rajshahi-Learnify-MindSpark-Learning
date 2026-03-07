import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";

import rocket3d from "@/assets/rocket-3d.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import lightning3d from "@/assets/lightning-3d.png";

interface MomentumData {
  xpPerHour: number;
  predictedWeeklyXP: number;
  peakDay: string;
  optimalStart: string;
  optimalEnd: string;
  paceComment: string;
}

const StudyMomentumEngine = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MomentumData | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const twoWeeksAgo = subDays(new Date(), 14);

      const [{ data: sessions }, { data: assessments }] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("xp_earned, duration_minutes, created_at")
          .eq("user_id", user.id)
          .gte("created_at", twoWeeksAgo.toISOString()),
        supabase
          .from("assessments")
          .select("xp_earned, created_at")
          .eq("user_id", user.id)
          .gte("created_at", twoWeeksAgo.toISOString()),
      ]);

      // XP per hour
      let totalXP = 0;
      let totalMinutes = 0;
      sessions?.forEach((s) => {
        totalXP += s.xp_earned || 0;
        totalMinutes += s.duration_minutes || 0;
      });
      assessments?.forEach((a) => {
        totalXP += a.xp_earned || 0;
      });
      const xpPerHour = totalMinutes > 0 ? Math.round((totalXP / (totalMinutes / 60)) * 10) / 10 : 0;

      // Predicted weekly XP
      const dailyMap = new Map<string, number>();
      sessions?.forEach((s) => {
        const d = format(new Date(s.created_at), "yyyy-MM-dd");
        dailyMap.set(d, (dailyMap.get(d) || 0) + (s.xp_earned || 0));
      });
      assessments?.forEach((a) => {
        const d = format(new Date(a.created_at), "yyyy-MM-dd");
        dailyMap.set(d, (dailyMap.get(d) || 0) + (a.xp_earned || 0));
      });
      const activeDays = dailyMap.size || 1;
      const avgDailyXP = totalXP / activeDays;
      const predictedWeeklyXP = Math.round(avgDailyXP * 7);

      // Peak hour & day
      const hourCounts = new Map<number, number>();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = new Map<string, number>();

      sessions?.forEach((s) => {
        const date = new Date(s.created_at);
        const hour = date.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + (s.xp_earned || 0));
        const day = dayNames[date.getDay()];
        dayCounts.set(day, (dayCounts.get(day) || 0) + (s.xp_earned || 0));
      });

      let peakHour = 17;
      let peakHourXP = 0;
      hourCounts.forEach((xp, hour) => {
        if (xp > peakHourXP) { peakHour = hour; peakHourXP = xp; }
      });

      let peakDay = "Saturday";
      let peakDayXP = 0;
      dayCounts.forEach((xp, day) => {
        if (xp > peakDayXP) { peakDay = day; peakDayXP = xp; }
      });

      const formatH = (h: number) => {
        const hr = h % 12 || 12;
        return `${hr}:00 ${h < 12 ? "AM" : "PM"}`;
      };

      const paceComment = xpPerHour >= 40 ? "You're on fire!" : xpPerHour >= 20 ? "You're at a great pace" : xpPerHour > 0 ? "Keep pushing forward!" : "Start studying to build pace!";

      setData({
        xpPerHour,
        predictedWeeklyXP,
        peakDay: peakDay.toUpperCase(),
        optimalStart: formatH((peakHour - 1 + 24) % 24),
        optimalEnd: formatH((peakHour + 1) % 24),
        paceComment,
      });
    } catch (err) {
      console.error("Momentum fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden">
        <div className="h-[100px] bg-gradient-to-r from-[#FD91D9] to-[#AF2D50] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      {/* ===== HEADER CARD ===== */}
      <div
        className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)",
          boxShadow: "0 8px 32px rgba(175,45,80,0.3)",
        }}
      >
        {/* Mascot icon */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/[0.15] backdrop-blur-2xl"
          style={{
            background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <img src={rocket3d} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm sm:text-lg leading-tight">Study Momentum Engine</h3>
          <p className="text-white/70 text-[10px] sm:text-xs leading-snug mt-0.5 line-clamp-2">
            Analytics of your study momentum, see if you're ready for exam or not
          </p>
        </div>

      </div>

      {/* ===== 3 STAT CARDS ===== */}
      <div className="grid grid-cols-3 gap-2">
        {/* Card 1: XP/hr */}
        <div
          className="rounded-2xl p-3 sm:p-4 flex flex-col items-center border border-white/[0.15] backdrop-blur-2xl"
          style={{
            background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
          }}
        >
          <img src={statXp3d} alt="XP Star" className="w-10 h-10 sm:w-14 sm:h-14 object-contain mb-2" />

          <div
            className="w-full rounded-full py-1.5 text-center"
            style={{ background: "linear-gradient(135deg, #AED0FF 0%, #2F6B81 100%)" }}
          >
            <span
              className="text-white text-lg sm:text-2xl"
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
            >
              {Math.round(data.xpPerHour)}
            </span>
          </div>

          <div
            className="w-full rounded-full py-1 mt-1 text-center"
            style={{ background: "linear-gradient(135deg, #AED0FF 0%, #2F6B81 100%)" }}
          >
            <span className="text-white text-[10px] sm:text-xs font-semibold">XP/hr</span>
          </div>

          <p className="text-white/50 text-[8px] sm:text-[10px] mt-1.5 text-center leading-tight">
            {data.paceComment}
          </p>
        </div>

        {/* Card 2: Estimated Weekly XP */}
        <div
          className="rounded-2xl p-3 sm:p-4 flex flex-col items-center border border-white/[0.15] backdrop-blur-2xl"
          style={{
            background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
          }}
        >
          <img src={lightning3d} alt="Lightning" className="w-10 h-10 sm:w-14 sm:h-14 object-contain mb-2" />

          <div
            className="w-full rounded-full py-1.5 text-center"
            style={{ background: "linear-gradient(135deg, #D1CAE9 0%, #BC96F0 100%)" }}
          >
            <span
              className="text-white text-lg sm:text-2xl"
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
            >
              {data.predictedWeeklyXP}
            </span>
          </div>

          <div
            className="w-full rounded-full py-1 mt-1 text-center"
            style={{ background: "linear-gradient(135deg, #D1CAE9 0%, #BC96F0 100%)" }}
          >
            <span className="text-white text-[10px] sm:text-xs font-semibold leading-tight">
              Estimated Weekly XP
            </span>
          </div>

          <p className="text-white/50 text-[10px] sm:text-xs mt-1.5 text-center leading-tight">
            At Current Pace
          </p>
        </div>

        {/* Card 3: Best time & day */}
        <div
          className="rounded-2xl p-3 sm:p-4 flex flex-col items-center border border-white/[0.15] backdrop-blur-2xl"
          style={{
            background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
          }}
        >
          <p className="text-white/70 text-[11px] sm:text-sm font-semibold mb-1.5">Best time to study</p>

          <div
            className="w-full rounded-full py-1.5 text-center"
            style={{ background: "linear-gradient(135deg, #E9CAE4 0%, #F096D2 100%)" }}
          >
            <span className="text-white text-[9px] sm:text-xs font-bold whitespace-nowrap">
              {data.optimalStart} - {data.optimalEnd}
            </span>
          </div>

          <p className="text-white/60 text-[10px] sm:text-xs mt-2 text-center leading-tight font-medium">
            Your best performance was on
          </p>

          <div
            className="w-full rounded-full py-1.5 mt-1 text-center"
            style={{ background: "linear-gradient(135deg, #E9CAE4 0%, #F096D2 100%)" }}
          >
            <span
              className="text-white text-sm sm:text-base"
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                WebkitTextStroke: "1px rgba(140,80,220,0.6)",
              }}
            >
              {data.peakDay}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyMomentumEngine;
