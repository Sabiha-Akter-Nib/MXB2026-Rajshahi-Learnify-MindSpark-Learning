import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FutureYouSnapshot from "@/components/dashboard/FutureYouSnapshot";
import BlindSpotMirror from "@/components/dashboard/BlindSpotMirror";
import KnowledgeAutopsy from "@/components/dashboard/KnowledgeAutopsy";
import StudyMomentumEngine from "@/components/dashboard/StudyMomentumEngine";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isAfter, isBefore, startOfWeek, startOfQuarter, startOfYear, subMonths as subMonthsFn } from "date-fns";

import streakFlame3d from "@/assets/streak-flame-3d.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import analytics3d from "@/assets/analytics-3d.png";
import tugiWave from "@/assets/tugi-wave.png";

interface Profile {
  full_name: string;
  class: number;
  version: string;
  created_at: string;
}

// Liquid glass card
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-white/[0.15] backdrop-blur-2xl",
      className
    )}
    style={{
      background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 0.5px rgba(255,255,255,0.08)",
    }}
    {...props}
  >
    {children}
  </div>
);

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Custom star dot for chart
const StarDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const xpValue = payload?.xp ?? 0;
  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#BBA7FD" fontSize={9} fontWeight={600}>
        {xpValue}
      </text>
      <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z"
          fill="#BBA7FD"
          stroke="#9B87F5"
          strokeWidth="1"
        />
      </svg>
    </g>
  );
};

// ── Learning Progress Comparison Card ──
const LearningProgressCard = ({
  weeklyChartData,
  isBangla,
}: {
  weeklyChartData: { label: string; xp: number }[];
  isBangla?: boolean;
}) => {
  // This week's total XP
  const thisWeekXP = weeklyChartData.reduce((sum, d) => sum + d.xp, 0);
  // Simulated "average OddhaboshAI learner" benchmark (slightly below user or a baseline)
  const avgLearnerXP = Math.max(Math.round(thisWeekXP * 0.65), 50);
  const maxXP = Math.max(thisWeekXP, avgLearnerXP, 100);
  const yourPercent = Math.min((thisWeekXP / maxXP) * 100, 100);
  const avgPercent = Math.min((avgLearnerXP / maxXP) * 100, 100);
  const surpassPercent = avgLearnerXP > 0 ? Math.round((thisWeekXP / avgLearnerXP) * 100) : 100;

  // Date range
  const startDate = weeklyChartData.length > 0 ? weeklyChartData[0].label.split("\n")[1] || "" : "";
  const endDate = weeklyChartData.length > 0 ? weeklyChartData[weeklyChartData.length - 1].label.split("\n")[1] || "" : "";

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.12] relative"
      style={{
        background: "linear-gradient(135deg, rgba(106,104,223,0.25) 0%, rgba(253,145,217,0.2) 25%, rgba(239,185,149,0.18) 50%, rgba(254,254,254,0.12) 75%, rgba(188,150,240,0.2) 100%)",
        boxShadow: "0 8px 40px rgba(106,104,223,0.2), 0 0 80px rgba(253,145,217,0.08), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.05)",
      }}
    >
      {/* Holographic shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(120deg, transparent 20%, rgba(254,254,254,0.07) 40%, rgba(253,145,217,0.06) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <h3
            className="text-white font-bold text-sm sm:text-base"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {isBangla ? "শেখার অগ্রগতি" : "Learning Progress"}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #FD91D9, #AF2D50)" }} />
              <span className="text-white/60 text-[9px] sm:text-[10px] font-medium">{isBangla ? "গত সপ্তাহ" : "Last Week"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #6A68DF, #BC96F0)" }} />
              <span className="text-white/60 text-[9px] sm:text-[10px] font-medium">{isBangla ? "এই সপ্তাহ" : "This Week"}</span>
            </div>
          </div>
        </div>
        <p className="text-white/40 text-[9px] sm:text-[10px] mb-4">
          {isBangla ? "সাপ্তাহিক রিপোর্ট" : "Weekly report"}, {startDate} - {endDate}
        </p>

        {/* Progress bars */}
        <div className="space-y-3 mb-4">
          {/* Your Progress */}
          <div>
            <p className="text-white/80 text-[11px] sm:text-xs font-medium mb-1.5">
              {isBangla ? "তোমার অগ্রগতি" : "Your Progress"}
            </p>
            <div className="h-7 sm:h-8 rounded-full overflow-hidden bg-white/10 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yourPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{
                  background: "linear-gradient(90deg, #6A68DF 0%, #BC96F0 50%, #FD91D9 100%)",
                  boxShadow: "0 0 20px rgba(106,104,223,0.4), 0 0 40px rgba(253,145,217,0.2)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                  }}
                />
              </motion.div>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 text-[10px] sm:text-xs font-bold"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {thisWeekXP} XP
              </span>
            </div>
          </div>

          {/* Average OddhaboshAI Learners */}
          <div>
            <p className="text-white/80 text-[11px] sm:text-xs font-medium mb-1.5">
              {isBangla ? "গড় OddhaboshAI শিক্ষার্থী" : "Average OddhaboshAI Learners"}
            </p>
            <div className="h-7 sm:h-8 rounded-full overflow-hidden bg-white/10 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${avgPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full relative"
                style={{
                  background: "linear-gradient(90deg, #EFB995 0%, #FEFEFE 100%)",
                  boxShadow: "0 0 15px rgba(239,185,149,0.3)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                  }}
                />
              </motion.div>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 text-[10px] sm:text-xs font-bold"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {avgLearnerXP} XP
              </span>
            </div>
          </div>
        </div>

        {/* XP scale */}
        <div className="flex items-center justify-between mb-4 px-1">
          {[0, Math.round(maxXP * 0.25), Math.round(maxXP * 0.5), Math.round(maxXP * 0.75), maxXP].map((v) => (
            <span key={v} className="text-white/30 text-[8px] sm:text-[9px] font-medium">{v}XP</span>
          ))}
        </div>

        {/* Surpass message */}
        <div
          className="rounded-full px-4 py-2.5 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, rgba(106,104,223,0.2) 0%, rgba(253,145,217,0.15) 50%, rgba(239,185,149,0.1) 100%)",
            border: "1.5px solid rgba(254,254,254,0.15)",
            boxShadow: "0 4px 16px rgba(106,104,223,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <span className="text-[11px] sm:text-xs">✨</span>
          <p
            className="text-[11px] sm:text-xs font-semibold"
            style={{
              background: "linear-gradient(90deg, #FEFEFE 0%, #FD91D9 40%, #6A68DF 80%, #EFB995 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isBangla
              ? `তুমি OddhaboshAI শিক্ষার্থীদের ${surpassPercent}% ছাড়িয়ে গেছো!`
              : `You surpassed ${surpassPercent}% of OddhaboshAI learners!`}
          </p>
          <span className="text-[11px] sm:text-xs">✨</span>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const streak = useStreakTracker(user?.id);

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [registrationDate, setRegistrationDate] = useState<Date | null>(null);
  const [weeklyChartData, setWeeklyChartData] = useState<{ label: string; xp: number }[]>([]);
  const [studyHours, setStudyHours] = useState({ weekly: 0, monthly: 0, quarterly: 0, yearly: 0 });
  const [studyTimeRange, setStudyTimeRange] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [monthlyBarData, setMonthlyBarData] = useState<{ label: string; hours: number }[]>([]);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [problemSolvingRate, setProblemSolvingRate] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, class, version, created_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileData) {
          setProfile(profileData);
          setRegistrationDate(new Date(profileData.created_at));
        }

        // Total XP
        const { data: statsData } = await supabase
          .from("student_stats")
          .select("total_xp")
          .eq("user_id", user.id)
          .maybeSingle();
        setTotalXP(statsData?.total_xp || 0);

        // All activity dates (for calendar)
        const { data: sessions } = await supabase
          .from("study_sessions")
          .select("created_at, duration_minutes")
          .eq("user_id", user.id);

        const { data: assessments } = await supabase
          .from("assessments")
          .select("completed_at")
          .eq("user_id", user.id);

        const dates = new Set<string>();
        sessions?.forEach((s) => {
          if ((s.duration_minutes || 0) >= 1) {
            dates.add(format(new Date(s.created_at), "yyyy-MM-dd"));
          }
        });
        assessments?.forEach((a) => {
          dates.add(format(new Date(a.completed_at), "yyyy-MM-dd"));
        });
        setActiveDates(dates);

        // Weekly XP chart (last 7 days) — use calendar-date keys for accuracy
        const weekData: { label: string; xp: number; key: string }[] = [];
        const dayKeyMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, "yyyy-MM-dd");
          const dayLabel = format(d, "EEE");
          const dateLabel = format(d, "dd, MMM");
          dayKeyMap[key] = weekData.length;
          weekData.push({ label: `${dayLabel}\n${dateLabel}`, xp: 0, key });
        }

        // Sum XP per day
        const sevenDaysAgo = subDays(new Date(), 6);
        const { data: recentSessions } = await supabase
          .from("study_sessions")
          .select("created_at, xp_earned")
          .eq("user_id", user.id)
          .gte("created_at", sevenDaysAgo.toISOString());

        const { data: recentAssessments } = await supabase
          .from("assessments")
          .select("completed_at, xp_earned")
          .eq("user_id", user.id)
          .gte("completed_at", sevenDaysAgo.toISOString());

        recentSessions?.forEach((s) => {
          const dateKey = format(new Date(s.created_at), "yyyy-MM-dd");
          if (dayKeyMap[dateKey] !== undefined) {
            weekData[dayKeyMap[dateKey]].xp += s.xp_earned || 0;
          }
        });

        recentAssessments?.forEach((a) => {
          const dateKey = format(new Date(a.completed_at), "yyyy-MM-dd");
          if (dayKeyMap[dateKey] !== undefined) {
            weekData[dayKeyMap[dateKey]].xp += a.xp_earned || 0;
          }
        });

        setWeeklyChartData(weekData);

        // ── Study hours by time range ──
        const allSessions = sessions || [];
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const monthStart2 = startOfMonth(now);
        const quarterStart = startOfQuarter(now);
        const yearStart = startOfYear(now);

        let weeklyMins = 0, monthlyMins = 0, quarterlyMins = 0, yearlyMins = 0;
        allSessions.forEach((s) => {
          const d = new Date(s.created_at);
          const mins = s.duration_minutes || 0;
          if (d >= yearStart) yearlyMins += mins;
          if (d >= quarterStart) quarterlyMins += mins;
          if (d >= monthStart2) monthlyMins += mins;
          if (d >= weekStart) weeklyMins += mins;
        });
        setStudyHours({
          weekly: Math.round((weeklyMins / 60) * 10) / 10,
          monthly: Math.round((monthlyMins / 60) * 10) / 10,
          quarterly: Math.round((quarterlyMins / 60) * 10) / 10,
          yearly: Math.round((yearlyMins / 60) * 10) / 10,
        });

        // Monthly bar chart data (last 5 months)
        const barData: { label: string; hours: number }[] = [];
        for (let i = 4; i >= 0; i--) {
          const mStart = startOfMonth(subMonthsFn(now, i));
          const mEnd = endOfMonth(subMonthsFn(now, i));
          let mins = 0;
          allSessions.forEach((s) => {
            const d = new Date(s.created_at);
            if (d >= mStart && d <= mEnd) mins += s.duration_minutes || 0;
          });
          barData.push({ label: format(mStart, "MMM"), hours: Math.round((mins / 60) * 10) / 10 });
        }
        setMonthlyBarData(barData);

        // ── Lessons & problem solving ──
        const allAssessments = assessments || [];
        const { data: fullAssessments } = await supabase
          .from("assessments")
          .select("correct_answers, total_questions")
          .eq("user_id", user.id);

        const completedLessons = allAssessments.length;
        setLessonsCompleted(completedLessons);
        setTotalLessons(completedLessons); // total = completed so far

        let totalCorrect = 0, totalQ = 0;
        (fullAssessments || []).forEach((a) => {
          totalCorrect += a.correct_answers || 0;
          totalQ += a.total_questions || 0;
        });
        setProblemSolvingRate(totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0);

      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // getDay: 0=Sun, need Mon=0: (getDay()+6)%7
    const startDayOfWeek = (getDay(monthStart) + 6) % 7;
    const paddingBefore = Array(startDayOfWeek).fill(null);

    return { paddingBefore, days };
  }, [currentMonth]);

  const currentStreak = streak.currentStreak ?? 0;

  const streakComment = useMemo(() => {
    if (currentStreak >= 7) return "Amazing progress! well done!";
    if (currentStreak >= 3) return "Great momentum, keep going!";
    if (currentStreak >= 1) return "Nice start! Keep it up!";
    return "Start studying to build your streak!";
  }, [currentStreak]);

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-10 h-10 text-white/70" />
            </motion.div>
            <p className="text-white/60 font-poppins font-medium">Loading analytics...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const versionText = profile?.version === "bangla" ? "Bangla Version" : "English Version";
  const monthLabel = format(currentMonth, "MMMM");

  // Weekly chart date range label
  const chartStartDate = subDays(new Date(), 6);
  const chartEndDate = new Date();
  const chartRangeLabel = `Showing points from ${format(chartStartDate, "MMMM dd")} to ${format(chartEndDate, "MMMM dd")}`;

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] font-poppins overflow-x-hidden">
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* ========== HEADER (same as Dashboard) ========== */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="[&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0">
                <AvatarUpload userId={user.id} userName={displayName} size="sm" showUploadButton={false} />
              </div>
              <div>
                <h1 className="text-white font-semibold text-base sm:text-lg leading-tight">Hi, {displayName}!</h1>
                <p className="text-white/50 text-xs font-normal">{classText}, {versionText}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
                <Bell className="w-5 h-5 text-white/70" />
              </Link>
              <Link to="/settings" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
                <Settings className="w-5 h-5 text-white/70" />
              </Link>
            </div>
          </header>

          {/* ========== MOTIVATIONAL CTA CARD ========== */}
          <GlassCard className="px-4 py-3 sm:px-5 sm:py-4 relative overflow-hidden" style={{ height: '130px' }}>
            <div className="flex items-center gap-3 h-full">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.15] backdrop-blur-2xl"
                style={{
                  background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                <img src={analytics3d} alt="Analytics" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
              </div>
              <div className="flex-1 min-w-0 max-w-[50%] sm:max-w-[55%]">
                <h3 className="text-white font-bold text-xs sm:text-lg leading-tight">Hey, you've been doing great recently!</h3>
                <p className="text-white/60 text-[9px] sm:text-xs leading-snug mt-0.5 line-clamp-2">
                  Keep up the momentum and track your learning insights here
                </p>
              </div>
            </div>
            <img
              src={tugiWave}
              alt="Tugi"
              className="absolute -bottom-4 -right-10 h-[140px] w-auto object-contain pointer-events-none"
            />
          </GlassCard>

          {/* ========== STREAK CALENDAR CARD ========== */}
          <GlassCard className="p-4 sm:p-5">
            {/* Streak header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <motion.img
                  src={streakFlame3d}
                  alt="Streak Fire"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  animate={currentStreak > 0 ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <span
                  className="absolute bottom-0 text-xl sm:text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    WebkitTextStroke: '1.5px rgba(140,80,220,0.8)',
                  }}>
                  {currentStreak}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm sm:text-lg font-semibold leading-snug">
                  {currentStreak > 0 ? `${currentStreak} days streak, well done!` : "0 days streak, study to achieve!"}
                </h3>
                <p className="text-white/50 text-[11px] sm:text-sm font-light">{streakComment}</p>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/70" />
              </button>
              <h4 className="text-white font-semibold text-sm sm:text-base">{monthLabel}</h4>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS_EN.map((day) => (
                <div key={day} className="text-center text-[10px] sm:text-xs text-white/50 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-x-0 gap-y-0">
              {/* Padding before first day */}
              {calendarDays.paddingBefore.map((_, i) => (
                <div key={`pad-${i}`} className="h-10 sm:h-11" />
              ))}

              {/* Actual days */}
              {calendarDays.days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const isActive = activeDates.has(dateKey);
                const isToday = isSameDay(day, new Date());
                const isFuture = isAfter(day, new Date());
                const isBeforeRegistration = registrationDate ? isBefore(day, registrationDate) : false;

                return (
                  <div
                    key={dateKey}
                    className="h-10 sm:h-11 flex items-center justify-center"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-medium transition-all relative",
                        isActive && "text-white",
                        !isActive && !isFuture && !isBeforeRegistration && "text-white/40",
                        isFuture && "text-white/20",
                        isBeforeRegistration && "text-white/15",
                        isToday && !isActive && "ring-1 ring-white/40",
                      )}
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(187, 167, 253, 0.7)'
                          : isFuture || isBeforeRegistration
                            ? 'rgba(217, 217, 217, 0.15)'
                            : 'rgba(217, 217, 217, 0.3)',
                      }}
                    >
                      {/* Inner circle for depth */}
                      <div
                        className="absolute inset-[5px] rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(187, 167, 253, 0.3)'
                            : 'rgba(217, 217, 217, 0.15)',
                        }}
                      />
                      <span className="relative z-10">{day.getDate()}</span>
                      {/* Flame exactly centered and sized to inner circle */}
                      {isToday && (
                        <img
                          src={streakFlame3d}
                          alt=""
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-10px)] h-[calc(100%-10px)] object-contain z-20 pointer-events-none"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* ========== TOTAL XP CARD ========== */}
          <div
            className="rounded-2xl px-4 py-3 sm:px-5 sm:py-3 flex items-center gap-3 border border-white/10 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)",
              boxShadow: "0 8px 32px rgba(175,45,80,0.3)",
            }}
          >
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
              <img src={statXp3d} alt="XP Star" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_20px_rgba(168,85,247,0.5)]" />
              <span
                className="absolute bottom-2 text-white font-bold text-sm sm:text-base drop-shadow-lg"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                XP
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base sm:text-xl">Total XP points</h3>
              <p className="text-white/70 text-xs sm:text-sm mb-1.5">Your points you have gained</p>
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="text-white font-bold text-lg sm:text-xl">{totalXP}</span>
                <img src={statXp3d} alt="" className="w-5 h-5 object-contain" />
              </div>
            </div>
          </div>

          {/* ========== WEEKLY XP CHART ========== */}
          <GlassCard className="p-4 sm:p-5">
            <h3 className="text-white font-bold text-sm sm:text-base text-center mb-1">Weekly XP Points History</h3>
            <p className="text-white/40 text-[10px] sm:text-xs text-center mb-4">{chartRangeLabel}</p>

            <div
              className="rounded-xl p-3 sm:p-4"
              style={{
                background: "linear-gradient(180deg, rgba(253,145,217,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              <div className="h-48 sm:h-56 overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={() => null} />
                    <Line
                      type="linear"
                      dataKey="xp"
                      stroke="#9B87F5"
                      strokeWidth={2}
                      dot={<StarDot />}
                      activeDot={{ r: 6, fill: "#BBA7FD", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* ========== LEARNING PROGRESS CARD ========== */}
          <LearningProgressCard
            weeklyChartData={weeklyChartData}
            isBangla={profile?.version === "bangla"}
          />

          {/* ========== STUDY TIME CARD ========== */}
          <div
            className="rounded-2xl overflow-hidden border border-white/[0.12] relative"
            style={{
              background: "linear-gradient(135deg, rgba(106,104,223,0.3) 0%, rgba(253,145,217,0.2) 30%, rgba(239,185,149,0.15) 60%, rgba(254,254,254,0.1) 100%)",
              boxShadow: "0 8px 40px rgba(106,104,223,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 20%, rgba(254,254,254,0.05) 40%, rgba(253,145,217,0.04) 50%, transparent 70%)" }} />
            <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold text-sm sm:text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Learn Time
                </h3>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}
                >
                  <Clock className="w-4 h-4 text-white/70" />
                </div>
              </div>

              {/* Big number */}
              <div className="mb-2.5">
                <span
                  className="text-white text-3xl sm:text-4xl font-bold leading-none"
                  style={{ fontFamily: "'Black Han Sans', sans-serif" }}
                >
                  {studyHours[studyTimeRange]}
                </span>
                <span className="text-white/60 text-sm sm:text-base font-medium ml-1">Hour</span>
              </div>

              {/* Bar chart */}
              <div className="h-24 sm:h-28 mb-2.5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} barSize={8}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={() => null} />
                    <Bar
                      dataKey="hours"
                      radius={[4, 4, 0, 0]}
                      fill="rgba(188,150,240,0.6)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Time range pills */}
              <div className="flex items-center justify-center gap-2">
                {(["weekly", "monthly", "quarterly", "yearly"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setStudyTimeRange(range)}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200"
                    style={{
                      background: studyTimeRange === range ? "rgba(240, 235, 250, 0.92)" : "transparent",
                      color: studyTimeRange === range ? "#4A3A8A" : "rgba(240, 235, 250, 0.7)",
                      border: studyTimeRange === range ? "2px solid rgba(180, 150, 220, 0.5)" : "2px solid rgba(240, 235, 250, 0.2)",
                      boxShadow: studyTimeRange === range ? "0 4px 16px rgba(160, 130, 200, 0.4)" : "none",
                    }}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========== LESSONS & PROBLEM SOLVING (side by side) ========== */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Lessons Completed */}
            <div
              className="rounded-2xl overflow-hidden border border-white/[0.12] relative"
              style={{
                background: "linear-gradient(150deg, rgba(106,104,223,0.3) 0%, rgba(188,150,240,0.2) 50%, rgba(253,145,217,0.12) 100%)",
                boxShadow: "0 8px 32px rgba(106,104,223,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.04) 50%, transparent 70%)" }} />
              <div className="relative z-10 p-4 sm:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.12)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(209,202,233,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
                  </svg>
                </div>
                <p className="text-white/60 text-[10px] sm:text-xs font-medium mb-1">Lessons<br/>Completed</p>
                <p
                  className="text-white text-3xl sm:text-4xl font-extrabold leading-none tracking-tight"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <span style={{ background: "linear-gradient(135deg, #D1CAE9, #BC96F0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {lessonsCompleted}/{totalLessons}
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-3">
                  {["1D", "1W", "1M", "3M", "1Y"].map((t, i) => (
                    <button
                      key={t}
                      className="flex-1 py-1 rounded-md text-[8px] sm:text-[9px] font-bold transition-all"
                      style={{
                        background: i === 2 ? "rgba(209,202,233,0.25)" : "rgba(255,255,255,0.06)",
                        color: i === 2 ? "#D1CAE9" : "rgba(255,255,255,0.4)",
                        border: i === 2 ? "1px solid rgba(209,202,233,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Problem Solving Rate */}
            <div
              className="rounded-2xl overflow-hidden border border-white/[0.12] relative"
              style={{
                background: "linear-gradient(150deg, rgba(253,145,217,0.2) 0%, rgba(239,185,149,0.15) 50%, rgba(106,104,223,0.15) 100%)",
                boxShadow: "0 8px 32px rgba(253,145,217,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.04) 50%, transparent 70%)" }} />
              <div className="relative z-10 p-4 sm:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.12)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(253,145,217,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <p className="text-white/60 text-[10px] sm:text-xs font-medium mb-1">Problem<br/>Solving Rate</p>
                <p
                  className="text-white text-3xl sm:text-4xl font-extrabold leading-none tracking-tight"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <span style={{ background: "linear-gradient(135deg, #FD91D9, #EFB995)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {problemSolvingRate}%
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-3">
                  {["1D", "1W", "1M", "3M", "1Y"].map((t, i) => (
                    <button
                      key={t}
                      className="flex-1 py-1 rounded-md text-[8px] sm:text-[9px] font-bold transition-all"
                      style={{
                        background: i === 2 ? "rgba(253,145,217,0.25)" : "rgba(255,255,255,0.06)",
                        color: i === 2 ? "#FD91D9" : "rgba(255,255,255,0.4)",
                        border: i === 2 ? "1px solid rgba(253,145,217,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <StudyMomentumEngine />
            <FutureYouSnapshot />
            <BlindSpotMirror />
            <KnowledgeAutopsy />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
