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
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isAfter, isBefore, addDays } from "date-fns";

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
      ...props.style,
    }}
    {...props}
  >
    {children}
  </div>
);

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Custom star dot for chart - deep purple with curved/rounded edges + XP label above
const StarDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const xpValue = payload?.xp ?? 0;
  return (
    <g>
      {/* XP value label above star */}
      {xpValue > 0 && (
        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          fill="#BBA7FD"
          fontSize={10}
          fontWeight="bold"
        >
          +{xpValue}
        </text>
      )}
      {/* Deep purple rounded star */}
      <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12.5 3.5 13.5 5.5 14.9 7.9C16.3 7.5 18.5 7.2 21 7.5C19.5 9.5 18 11 17.5 12C18 13 19.5 14.5 21 16.5C18.5 16.8 16.3 16.5 14.9 16.1C13.5 18.5 12.5 20.5 12 22C11.5 20.5 10.5 18.5 9.1 16.1C7.7 16.5 5.5 16.8 3 16.5C4.5 14.5 6 13 6.5 12C6 11 4.5 9.5 3 7.5C5.5 7.2 7.7 7.5 9.1 7.9C10.5 5.5 11.5 3.5 12 2Z"
          fill="#6E3FC7"
          stroke="#5B2DA8"
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </g>
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
  // Rolling 7-day window based on "today", shifts by 1 each day
  const [chartAnchorDate] = useState(new Date());
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
          .select("created_at, duration_minutes, xp_earned")
          .eq("user_id", user.id);

        const { data: assessments } = await supabase
          .from("assessments")
          .select("completed_at, xp_earned")
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

        // Rolling 7-day XP chart (today is last day, each new day shifts +1)
        const today = new Date();
        const weekData: { label: string; xp: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(today, i);
          const dayLabel = format(d, "EEE");
          const dateLabel = format(d, "dd MMM");
          weekData.push({ label: `${dayLabel}\n${dateLabel}`, xp: 0 });
        }

        // Sum XP per day from sessions + assessments
        const sevenDaysAgo = subDays(today, 6);

        sessions?.forEach((s) => {
          const sDate = new Date(s.created_at);
          if (sDate >= sevenDaysAgo) {
            const dayIndex = 6 - Math.floor((today.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              weekData[dayIndex].xp += s.xp_earned || 0;
            }
          }
        });

        assessments?.forEach((a) => {
          const aDate = new Date(a.completed_at);
          if (aDate >= sevenDaysAgo) {
            const dayIndex = 6 - Math.floor((today.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              weekData[dayIndex].xp += a.xp_earned || 0;
            }
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
  const monthLabel = format(currentMonth, "MMMM yyyy");

  // Chart date range
  const chartStartDate = subDays(new Date(), 6);
  const chartEndDate = new Date();
  const chartRangeLabel = `${format(chartStartDate, "MMM dd")} – ${format(chartEndDate, "MMM dd, yyyy")}`;

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] font-poppins overflow-x-hidden">
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* ========== HEADER ========== */}
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
          <GlassCard className="p-3 sm:p-4">
            {/* Streak header - compact */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex-shrink-0 relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <motion.img
                  src={streakFlame3d}
                  alt="Streak Fire"
                  className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
                  animate={currentStreak > 0 ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <span
                  className="absolute -bottom-1 text-lg sm:text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    WebkitTextStroke: '1.5px rgba(140,80,220,0.8)',
                  }}>
                  {currentStreak}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xs sm:text-base font-semibold leading-snug">
                  {currentStreak > 0 ? `${currentStreak} days streak, well done!` : "0 days streak, study to achieve!"}
                </h3>
                <p className="text-white/50 text-[10px] sm:text-xs font-light">{streakComment}</p>
              </div>
            </div>

            {/* Month navigation with year */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
              </button>
              <h4 className="text-white font-semibold text-xs sm:text-sm">{monthLabel}</h4>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>

            {/* Day labels - tighter gap */}
            <div className="grid grid-cols-7 gap-[3px] sm:gap-1 mb-1">
              {DAYS_EN.map((day) => (
                <div key={day} className="text-center text-[9px] sm:text-[11px] text-white/50 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - tighter gap */}
            <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
              {calendarDays.paddingBefore.map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
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
                    className="aspect-square flex items-center justify-center"
                  >
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-medium transition-all relative",
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
                      <div
                        className="absolute inset-1 rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(187, 167, 253, 0.3)'
                            : 'rgba(217, 217, 217, 0.15)',
                        }}
                      />
                      <span className="relative z-10">{day.getDate()}</span>
                      {/* Fire on current day - positioned at bottom like dashboard */}
                      {isToday && (
                        <img
                          src={streakFlame3d}
                          alt=""
                          className="absolute -bottom-2.5 w-5 h-5 sm:w-6 sm:h-6 object-contain z-20 drop-shadow-[0_0_4px_rgba(255,120,0,0.6)]"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* ========== TOTAL XP CARD - compact ========== */}
          <div
            className="rounded-2xl px-4 py-3 sm:px-5 sm:py-3 flex items-center gap-3 border border-white/10 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)",
              boxShadow: "0 8px 32px rgba(175,45,80,0.3)",
              height: "100px",
            }}
          >
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
              <img src={statXp3d} alt="XP Star" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_20px_rgba(168,85,247,0.5)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-lg leading-tight">Total XP Points</h3>
              <p className="text-white/70 text-[10px] sm:text-xs mb-1.5">Your total earned points</p>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="text-white font-bold text-base sm:text-lg">{totalXP}</span>
                <img src={statXp3d} alt="" className="w-4 h-4 object-contain" />
              </div>
            </div>
          </div>

          {/* ========== WEEKLY XP CHART ========== */}
          <GlassCard className="p-3 sm:p-4">
            <h3 className="text-white font-bold text-xs sm:text-sm text-center mb-0.5">Weekly XP Points History</h3>
            <p className="text-white/40 text-[9px] sm:text-[11px] text-center mb-3">{chartRangeLabel}</p>

            <div
              className="rounded-xl p-2 sm:p-3"
              style={{
                background: "linear-gradient(180deg, rgba(253,145,217,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              <div className="h-44 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData} margin={{ top: 25, right: 10, bottom: 0, left: -10 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(80,60,120,0.6)", fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "rgba(80,60,120,0.4)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={25}
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
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      dot={<StarDot />}
                      activeDot={{ r: 6, fill: "#6E3FC7", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* ========== ADVANCED PANELS ========== */}
          <div className="flex flex-col gap-4">
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
