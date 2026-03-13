import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import VerifiedBadge, { isVerifiedEmail } from "@/components/VerifiedBadge";
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
import statStreak3d from "@/assets/stat-streak-glass.png";
import statRank3d from "@/assets/stat-rank-3d.png";
import statExams3d from "@/assets/stat-exams-3d.png";

interface Profile {
  full_name: string;
  class: number;
  version: string;
  created_at: string;
}

// Light theme card
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-[#2E2C2D]/[0.06]", className)}
    style={{
      background: "rgba(255,255,255,0.85)",
      boxShadow: "0 2px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
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
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#EC4899" fontSize={9} fontWeight={600}>
        {xpValue}
      </text>
      <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z"
          fill="#EC4899"
          stroke="#DB2777"
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
  const thisWeekXP = weeklyChartData.reduce((sum, d) => sum + d.xp, 0);
  const avgLearnerXP = Math.max(Math.round(thisWeekXP * 0.65), 50);
  const maxXP = Math.max(thisWeekXP, avgLearnerXP, 100);
  const yourPercent = Math.min((thisWeekXP / maxXP) * 100, 100);
  const avgPercent = Math.min((avgLearnerXP / maxXP) * 100, 100);
  const surpassPercent = avgLearnerXP > 0 ? Math.round((thisWeekXP / avgLearnerXP) * 100) : 100;

  const startDate = weeklyChartData.length > 0 ? weeklyChartData[0].label.split("\n")[1] || "" : "";
  const endDate = weeklyChartData.length > 0 ? weeklyChartData[weeklyChartData.length - 1].label.split("\n")[1] || "" : "";

  return (
    <div
      className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
      style={{
        background: "linear-gradient(135deg, rgba(106,104,223,0.12) 0%, rgba(253,145,217,0.1) 25%, rgba(239,185,149,0.08) 50%, rgba(254,254,254,0.9) 75%, rgba(188,150,240,0.08) 100%)",
        boxShadow: "0 2px 20px rgba(106,104,223,0.08), 0 0 0 1px rgba(0,0,0,0.02)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(120deg, transparent 20%, rgba(254,254,254,0.3) 40%, rgba(253,145,217,0.03) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-1">
          <h3
            className="text-[#2E2C2D] font-bold text-sm sm:text-base"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {isBangla ? "শেখার অগ্রগতি" : "Learning Progress"}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #FD91D9, #AF2D50)" }} />
              <span className="text-[#2E2C2D]/50 text-[9px] sm:text-[10px] font-medium">{isBangla ? "গত সপ্তাহ" : "Last Week"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #6A68DF, #BC96F0)" }} />
              <span className="text-[#2E2C2D]/50 text-[9px] sm:text-[10px] font-medium">{isBangla ? "এই সপ্তাহ" : "This Week"}</span>
            </div>
          </div>
        </div>
        <p className="text-[#2E2C2D]/35 text-[9px] sm:text-[10px] mb-4">
          {isBangla ? "সাপ্তাহিক রিপোর্ট" : "Weekly report"}, {startDate} - {endDate}
        </p>

        {/* Progress bars */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-[#2E2C2D]/70 text-[11px] sm:text-xs font-medium mb-1.5">
              {isBangla ? "তোমার অগ্রগতি" : "Your Progress"}
            </p>
            <div className="h-7 sm:h-8 rounded-full overflow-hidden bg-[#2E2C2D]/[0.06] relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yourPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{
                  background: "linear-gradient(90deg, #6A68DF 0%, #BC96F0 50%, #FD91D9 100%)",
                  boxShadow: "0 0 20px rgba(106,104,223,0.3)",
                }}
              >
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
              </motion.div>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E2C2D]/70 text-[10px] sm:text-xs font-bold"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {thisWeekXP} XP
              </span>
            </div>
          </div>

          <div>
            <p className="text-[#2E2C2D]/70 text-[11px] sm:text-xs font-medium mb-1.5">
              {isBangla ? "গড় OddhaboshAI শিক্ষার্থী" : "Average OddhaboshAI Learners"}
            </p>
            <div className="h-7 sm:h-8 rounded-full overflow-hidden bg-[#2E2C2D]/[0.06] relative">
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
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
              </motion.div>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E2C2D]/70 text-[10px] sm:text-xs font-bold"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {avgLearnerXP} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          {[0, Math.round(maxXP * 0.25), Math.round(maxXP * 0.5), Math.round(maxXP * 0.75), maxXP].map((v) => (
            <span key={v} className="text-[#2E2C2D]/25 text-[8px] sm:text-[9px] font-medium">{v}XP</span>
          ))}
        </div>

        <div
          className="rounded-full px-4 py-2.5 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, rgba(106,104,223,0.1) 0%, rgba(253,145,217,0.08) 50%, rgba(239,185,149,0.06) 100%)",
            border: "1.5px solid rgba(46,44,45,0.08)",
          }}
        >
          <span className="text-[11px] sm:text-xs">✨</span>
          <p
            className="text-[11px] sm:text-xs font-semibold"
            style={{
              background: "linear-gradient(90deg, #2E2C2D 0%, #EC4899 40%, #6A68DF 80%, #EFB995 100%)",
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
  const [totalExams, setTotalExams] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  const fetchWeeklySummary = useCallback(async () => {
    if (!user) return;
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-summary");
      if (error) throw error;
      setWeeklySummary(data?.summary || null);
    } catch (err) {
      console.error("Weekly summary error:", err);
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  }, [user]);

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
        // Get all subjects for the student's class to determine total chapters
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id, total_chapters")
          .lte("min_class", profileData?.class || 1)
          .gte("max_class", profileData?.class || 10);

        const totalAvailableChapters = (subjectsData || []).reduce((sum, s) => sum + (s.total_chapters || 0), 0);

        // Chapters completed from student_progress
        const { data: progressData } = await supabase
          .from("student_progress")
          .select("chapters_completed")
          .eq("user_id", user.id);

        const completedChapters = (progressData || []).reduce((sum, p) => sum + (p.chapters_completed || 0), 0);
        setLessonsCompleted(completedChapters);
        setTotalLessons(totalAvailableChapters || completedChapters || 0);

        // Problem solving rate from all assessments
        const { data: allAssessmentData } = await supabase
          .from("assessments")
          .select("correct_answers, total_questions")
          .eq("user_id", user.id);

        let totalCorrect = 0, totalQ = 0;
        (allAssessmentData || []).forEach((a) => {
          totalCorrect += a.correct_answers || 0;
          totalQ += a.total_questions || 0;
        });
        setProblemSolvingRate(totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0);

        // Total exams attended
        setTotalExams((allAssessmentData || []).length);

        // Leaderboard rank
        const { data: leaderboardData } = await supabase
          .from("leaderboard_entries")
          .select("user_id, total_xp")
          .eq("is_public", true)
          .order("total_xp", { ascending: false });

        if (leaderboardData) {
          const idx = leaderboardData.findIndex((e) => e.user_id === user.id);
          setLeaderboardRank(idx >= 0 ? idx + 1 : null);
        }

      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Auto-fetch weekly summary
    fetchWeeklySummary();
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
              <Loader2 className="w-10 h-10 text-[#EC4899]/60" />
            </motion.div>
            <p className="text-[#2E2C2D]/50 font-poppins font-medium">Loading analytics...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const monthLabel = format(currentMonth, "MMMM");

  const chartStartDate = subDays(new Date(), 6);
  const chartEndDate = new Date();
  const chartRangeLabel = `Showing points from ${format(chartStartDate, "MMMM dd")} to ${format(chartEndDate, "MMMM dd")}`;

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] font-poppins overflow-x-hidden w-full max-w-full">
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 overflow-hidden">

          {/* ========== HEADER ========== */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="[&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0">
                <AvatarUpload userId={user.id} userName={displayName} size="sm" showUploadButton={false} />
              </div>
              <div>
                <h1 className="text-[#2E2C2D] font-semibold text-base sm:text-lg leading-tight flex items-center gap-1">Hi, {displayName}!{isVerifiedEmail(user?.email) && <VerifiedBadge size={16} />}</h1>
                <p className="text-[#2E2C2D]/50 text-xs font-normal">{classText}, বাংলা ভার্সন</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2E2C2D]/[0.08]"
                style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <img src={statStreak3d} alt="" className="w-5 h-5 object-contain" />
                <span className="text-[#2E2C2D] font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{currentStreak}</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2E2C2D]/[0.08]"
                style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <img src={statXp3d} alt="" className="w-5 h-5 object-contain" />
                <span className="text-[#2E2C2D] font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{totalXP}</span>
              </div>
            </div>
          </header>

          {/* ========== MOTIVATIONAL CTA CARD ========== */}
          <GlassCard className="px-4 py-3 sm:px-5 sm:py-4 relative overflow-hidden" style={{ height: '130px' }}>
            <div className="flex items-center gap-3 h-full">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#6A68DF]/15"
                style={{
                  background: "linear-gradient(-45deg, rgba(106,104,223,0.08) 0%, rgba(236,72,153,0.05) 100%)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                <img src={analytics3d} alt="Analytics" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
              </div>
              <div className="flex-1 min-w-0 max-w-[50%] sm:max-w-[55%]">
                <h3 className="text-[#2E2C2D] font-bold text-xs sm:text-lg leading-tight">Hey, you've been doing great recently!</h3>
                <p className="text-[#2E2C2D]/50 text-[9px] sm:text-xs leading-snug mt-0.5 line-clamp-2">
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

          {/* ========== AI WEEKLY SUMMARY CARD ========== */}
          <div
            className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
            style={{
              background: "linear-gradient(135deg, rgba(106,104,223,0.1) 0%, rgba(253,145,217,0.08) 25%, rgba(239,185,149,0.06) 50%, rgba(254,254,254,0.95) 75%, rgba(188,150,240,0.08) 100%)",
              boxShadow: "0 2px 20px rgba(106,104,223,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(120deg, transparent 20%, rgba(254,254,254,0.4) 40%, rgba(253,145,217,0.03) 50%, transparent 70%)",
              }}
            />
            <div className="relative z-10 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #6A68DF, #FD91D9)",
                      boxShadow: "0 4px 16px rgba(106,104,223,0.3)",
                    }}
                  >
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#2E2C2D] font-bold text-sm sm:text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {profile?.version === "bangla" ? "সাপ্তাহিক সারাংশ" : "Weekly Summary"}
                    </h3>
                    <p className="text-[#2E2C2D]/35 text-[9px] sm:text-[10px]">
                      {profile?.version === "bangla" ? "AI দ্বারা তৈরি" : "AI-generated insight"}
                    </p>
                  </div>
              </div>

              <AnimatePresence mode="wait">
                {weeklySummary ? (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl p-3.5"
                    style={{
                      background: "rgba(46,44,45,0.03)",
                      border: "1px solid rgba(46,44,45,0.06)",
                    }}
                  >
                    <p className="text-[#2E2C2D]/80 text-xs sm:text-sm leading-relaxed font-medium">
                      {weeklySummary}
                    </p>
                  </motion.div>
                ) : summaryLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-6 gap-3"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-[#6A68DF]/50" />
                    </motion.div>
                    <p className="text-[#2E2C2D]/40 text-xs font-medium">
                      {profile?.version === "bangla" ? "সারাংশ তৈরি হচ্ছে..." : "Generating your summary..."}
                    </p>
                  </motion.div>
                ) : summaryError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-[#2E2C2D]/35 text-xs">
                      {profile?.version === "bangla" ? "সারাংশ তৈরি করা যায়নি" : "Could not generate summary"}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* ========== PROFILE STAT CARDS ========== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { img: statStreak3d, value: String(currentStreak), label: "Total Streak", grad: "linear-gradient(135deg, #EC4899, #DB2777)", bg: "linear-gradient(150deg, rgba(236,72,153,0.12) 0%, rgba(219,39,119,0.06) 50%, rgba(106,104,223,0.04) 100%)", shadow: "0 2px 16px rgba(236,72,153,0.08), 0 0 0 1px rgba(0,0,0,0.02)" },
              { img: statRank3d, value: `#${leaderboardRank ?? "—"}`, label: "Rank", grad: "linear-gradient(135deg, #6A68DF, #EC4899)", bg: "linear-gradient(150deg, rgba(106,104,223,0.12) 0%, rgba(88,80,200,0.06) 50%, rgba(236,72,153,0.04) 100%)", shadow: "0 2px 16px rgba(106,104,223,0.08), 0 0 0 1px rgba(0,0,0,0.02)" },
              { img: statExams3d, value: String(totalExams), label: "Exams", grad: "linear-gradient(135deg, #FD91D9, #EFB995)", bg: "linear-gradient(150deg, rgba(253,145,217,0.1) 0%, rgba(239,185,149,0.06) 50%, rgba(106,104,223,0.04) 100%)", shadow: "0 2px 16px rgba(253,145,217,0.06), 0 0 0 1px rgba(0,0,0,0.02)" },
              { img: statXp3d, value: String(totalXP), label: "Total XP", grad: "linear-gradient(135deg, #FD91D9, #AF2D50)", bg: "linear-gradient(150deg, rgba(253,145,217,0.08) 0%, rgba(175,45,80,0.1) 50%, rgba(253,145,217,0.04) 100%)", shadow: "0 2px 16px rgba(175,45,80,0.08), 0 0 0 1px rgba(0,0,0,0.02)" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
                style={{ background: card.bg, boxShadow: card.shadow }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.3) 50%, transparent 70%)" }} />
                <div className="relative z-10 p-3 sm:p-3.5 flex flex-col items-center text-center">
                  <img src={card.img} alt={card.label} className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1.5" />
                  <p className="text-[#2E2C2D] text-xl sm:text-3xl font-extrabold leading-none tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <span style={{ background: card.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{card.value}</span>
                  </p>
                  <p className="text-[#2E2C2D]/60 text-[9px] sm:text-xs font-bold mt-1 whitespace-nowrap tracking-wide uppercase">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ========== STREAK CALENDAR CARD ========== */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center">
                <motion.img
                  src={streakFlame3d}
                  alt="Streak Fire"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  animate={currentStreak > 0 ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <span
                  className="absolute bottom-0 text-xl sm:text-2xl text-[#2E2C2D] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    WebkitTextStroke: '1.5px rgba(236,72,153,0.4)',
                  }}>
                  {currentStreak}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[#2E2C2D] text-sm sm:text-lg font-semibold leading-snug">
                  {currentStreak > 0 ? `${currentStreak} days streak, well done!` : "0 days streak, study to achieve!"}
                </h3>
                <p className="text-[#2E2C2D]/50 text-[11px] sm:text-sm font-light">{streakComment}</p>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2E2C2D]/[0.05] hover:bg-[#2E2C2D]/[0.1] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#2E2C2D]/60" />
              </button>
              <h4 className="text-[#2E2C2D] font-semibold text-sm sm:text-base">{monthLabel}</h4>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2E2C2D]/[0.05] hover:bg-[#2E2C2D]/[0.1] transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#2E2C2D]/60" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS_EN.map((day) => (
                <div key={day} className="text-center text-[10px] sm:text-xs text-[#2E2C2D]/40 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-x-0 gap-y-0">
              {calendarDays.paddingBefore.map((_, i) => (
                <div key={`pad-${i}`} className="h-10 sm:h-11" />
              ))}

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
                        !isActive && !isFuture && !isBeforeRegistration && "text-[#2E2C2D]/60",
                        isFuture && "text-[#2E2C2D]/20",
                        isBeforeRegistration && "text-[#2E2C2D]/15",
                        isToday && !isActive && "ring-1 ring-[#EC4899]/40",
                      )}
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(236, 72, 153, 0.6)'
                          : isFuture || isBeforeRegistration
                            ? 'rgba(46, 44, 45, 0.04)'
                            : 'rgba(46, 44, 45, 0.06)',
                      }}
                    >
                      <div
                        className="absolute inset-[5px] rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(236, 72, 153, 0.2)'
                            : 'rgba(46, 44, 45, 0.03)',
                        }}
                      />
                      <span className="relative z-10">{day.getDate()}</span>
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
              <img src={statXp3d} alt="XP Star" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_20px_rgba(236,72,153,0.5)]" />
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
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
              >
                <span className="text-white font-bold text-lg sm:text-xl">{totalXP}</span>
                <img src={statXp3d} alt="" className="w-5 h-5 object-contain" />
              </div>
            </div>
          </div>

          {/* ========== WEEKLY XP CHART ========== */}
          <GlassCard className="p-4 sm:p-5">
            <h3 className="text-[#2E2C2D] font-bold text-sm sm:text-base text-center mb-1">Weekly XP Points History</h3>
            <p className="text-[#2E2C2D]/35 text-[10px] sm:text-xs text-center mb-4">{chartRangeLabel}</p>

            <div
              className="rounded-xl p-3 sm:p-4"
              style={{
                background: "linear-gradient(180deg, rgba(253,145,217,0.08) 0%, rgba(255,255,255,0.5) 100%)",
              }}
            >
              <div className="h-48 sm:h-56 overflow-hidden w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(46,44,45,0.45)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "rgba(46,44,45,0.3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={() => null} />
                    <Line
                      type="linear"
                      dataKey="xp"
                      stroke="#EC4899"
                      strokeWidth={2}
                      dot={<StarDot />}
                      activeDot={{ r: 6, fill: "#FD91D9", stroke: "#fff", strokeWidth: 2 }}
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
            className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
            style={{
              background: "linear-gradient(135deg, rgba(106,104,223,0.12) 0%, rgba(253,145,217,0.08) 30%, rgba(239,185,149,0.06) 60%, rgba(254,254,254,0.95) 100%)",
              boxShadow: "0 2px 20px rgba(106,104,223,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 20%, rgba(254,254,254,0.3) 40%, rgba(253,145,217,0.02) 50%, transparent 70%)" }} />
            <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[#2E2C2D] font-bold text-sm sm:text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Learn Time
                </h3>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(46,44,45,0.05)", border: "1.5px solid rgba(46,44,45,0.08)" }}
                >
                  <Clock className="w-4 h-4 text-[#2E2C2D]/60" />
                </div>
              </div>

              <div className="mb-2.5">
                <span
                  className="text-[#2E2C2D] text-3xl sm:text-4xl font-bold leading-none"
                  style={{ fontFamily: "'Black Han Sans', sans-serif" }}
                >
                  {studyHours[studyTimeRange]}
                </span>
                <span className="text-[#2E2C2D]/50 text-sm sm:text-base font-medium ml-1">Hour</span>
              </div>

              <div className="h-24 sm:h-28 mb-2.5 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} barSize={8}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(46,44,45,0.45)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={() => null} />
                    <Bar
                      dataKey="hours"
                      radius={[4, 4, 0, 0]}
                      fill="rgba(106,104,223,0.5)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-2">
                {(["weekly", "monthly", "quarterly", "yearly"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setStudyTimeRange(range)}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200"
                    style={{
                      background: studyTimeRange === range ? "rgba(106,104,223,0.12)" : "transparent",
                      color: studyTimeRange === range ? "#6A68DF" : "rgba(46,44,45,0.5)",
                      border: studyTimeRange === range ? "2px solid rgba(106,104,223,0.3)" : "2px solid rgba(46,44,45,0.1)",
                      boxShadow: studyTimeRange === range ? "0 2px 8px rgba(106,104,223,0.15)" : "none",
                    }}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========== LESSONS & PROBLEM SOLVING ========== */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Lessons Completed */}
            <div
              className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
              style={{
                background: "linear-gradient(150deg, rgba(106,104,223,0.12) 0%, rgba(188,150,240,0.08) 50%, rgba(253,145,217,0.05) 100%)",
                boxShadow: "0 2px 16px rgba(106,104,223,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.3) 50%, transparent 70%)" }} />
              <div className="relative z-10 p-4 sm:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(106,104,223,0.1)", border: "1.5px solid rgba(106,104,223,0.15)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(106,104,223,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
                  </svg>
                </div>
                <p className="text-[#2E2C2D]/50 text-[10px] sm:text-xs font-medium mb-1">Lessons<br/>Completed</p>
                <p
                  className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <span style={{ background: "linear-gradient(135deg, #6A68DF, #BC96F0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {lessonsCompleted}/{totalLessons}
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-3">
                  {["1D", "1W", "1M", "3M", "1Y"].map((t, i) => (
                    <button
                      key={t}
                      className="flex-1 py-1 rounded-md text-[8px] sm:text-[9px] font-bold transition-all"
                      style={{
                        background: i === 2 ? "rgba(106,104,223,0.12)" : "rgba(46,44,45,0.04)",
                        color: i === 2 ? "#6A68DF" : "rgba(46,44,45,0.4)",
                        border: i === 2 ? "1px solid rgba(106,104,223,0.2)" : "1px solid rgba(46,44,45,0.06)",
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
              className="rounded-2xl overflow-hidden border border-[#2E2C2D]/[0.06] relative"
              style={{
                background: "linear-gradient(150deg, rgba(253,145,217,0.1) 0%, rgba(239,185,149,0.08) 50%, rgba(106,104,223,0.05) 100%)",
                boxShadow: "0 2px 16px rgba(253,145,217,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.3) 50%, transparent 70%)" }} />
              <div className="relative z-10 p-4 sm:p-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(253,145,217,0.1)", border: "1.5px solid rgba(253,145,217,0.15)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(253,145,217,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <p className="text-[#2E2C2D]/50 text-[10px] sm:text-xs font-medium mb-1">Problem<br/>Solving Rate</p>
                <p
                  className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight"
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
                        background: i === 2 ? "rgba(253,145,217,0.12)" : "rgba(46,44,45,0.04)",
                        color: i === 2 ? "#EC4899" : "rgba(46,44,45,0.4)",
                        border: i === 2 ? "1px solid rgba(253,145,217,0.2)" : "1px solid rgba(46,44,45,0.06)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
