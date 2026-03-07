import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isAfter, isBefore } from "date-fns";

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
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z"
        fill="#BBA7FD"
        stroke="#9B87F5"
        strokeWidth="1"
      />
    </svg>
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

        // Weekly XP chart (last 7 days)
        const weekData: { label: string; xp: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, "yyyy-MM-dd");
          const dayLabel = format(d, "EEE");
          const dateLabel = format(d, "dd, MMM");
          weekData.push({ label: `${dayLabel}\n${dateLabel}`, xp: 0 });
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
          const dayIndex = 6 - Math.floor((new Date().getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 7) {
            weekData[dayIndex].xp += s.xp_earned || 0;
          }
        });

        recentAssessments?.forEach((a) => {
          const dayIndex = 6 - Math.floor((new Date().getTime() - new Date(a.completed_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 7) {
            weekData[dayIndex].xp += a.xp_earned || 0;
          }
        });

        setWeeklyChartData(weekData);
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
                          className="absolute inset-[5px] w-auto h-auto object-contain z-20 pointer-events-none"
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
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
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
                    <Tooltip
                      contentStyle={{
                        background: "rgba(30,15,45,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "#fff",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
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

          {/* ========== ADVANCED PANELS ========== */}
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
