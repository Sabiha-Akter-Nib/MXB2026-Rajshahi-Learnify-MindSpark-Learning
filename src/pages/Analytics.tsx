import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap, 
  BookOpen,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, AreaChart, Area } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FutureYouSnapshot from "@/components/dashboard/FutureYouSnapshot";
import BlindSpotMirror from "@/components/dashboard/BlindSpotMirror";
import KnowledgeAutopsy from "@/components/dashboard/KnowledgeAutopsy";
import StudyMomentumEngine from "@/components/dashboard/StudyMomentumEngine";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";

interface DailyData {
  date: string;
  label: string;
  xp: number;
  minutes: number;
}

interface SubjectXP {
  name: string;
  xp: number;
  color: string;
}

// Liquid glass card
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-white/[0.12] backdrop-blur-2xl",
      className
    )}
    style={{
      background: "linear-gradient(-45deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.07) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
    }}
    {...props}
  >
    {children}
  </div>
);

const Analytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [subjectXP, setSubjectXP] = useState<SubjectXP[]>([]);
  const [totalStats, setTotalStats] = useState({ xp: 0, minutes: 0, sessions: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // Fetch last 14 days of study sessions
        const fourteenDaysAgo = subDays(new Date(), 14);
        
        const [{ data: sessions }, { data: assessments }, { data: subjects }, { data: progress }] = await Promise.all([
          supabase
            .from("study_sessions")
            .select("created_at, duration_minutes, xp_earned, subject_id")
            .eq("user_id", user.id)
            .gte("created_at", fourteenDaysAgo.toISOString())
            .order("created_at", { ascending: true }),
          supabase
            .from("assessments")
            .select("completed_at, xp_earned, time_taken_seconds, subject_id")
            .eq("user_id", user.id)
            .gte("completed_at", fourteenDaysAgo.toISOString()),
          supabase
            .from("subjects")
            .select("id, name, color"),
          supabase
            .from("student_progress")
            .select("subject_id, xp_earned")
            .eq("user_id", user.id),
        ]);

        // Build daily chart data
        const dayMap = new Map<string, { xp: number; minutes: number }>();
        for (let i = 13; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, "yyyy-MM-dd");
          dayMap.set(key, { xp: 0, minutes: 0 });
        }

        sessions?.forEach((s) => {
          const key = format(new Date(s.created_at), "yyyy-MM-dd");
          const entry = dayMap.get(key);
          if (entry) {
            entry.xp += s.xp_earned || 0;
            entry.minutes += s.duration_minutes || 0;
          }
        });

        assessments?.forEach((a) => {
          const key = format(new Date(a.completed_at), "yyyy-MM-dd");
          const entry = dayMap.get(key);
          if (entry) {
            entry.xp += a.xp_earned || 0;
            entry.minutes += Math.round((a.time_taken_seconds || 0) / 60);
          }
        });

        const daily: DailyData[] = [];
        dayMap.forEach((val, key) => {
          daily.push({
            date: key,
            label: format(new Date(key), "dd MMM"),
            xp: val.xp,
            minutes: val.minutes,
          });
        });
        setDailyData(daily);

        // Build subject XP breakdown
        const subjectMap = new Map<string, string>();
        const subjectColors: Record<string, string> = {
          emerald: "#34D399", green: "#22C55E", blue: "#3B82F6",
          sky: "#38BDF8", purple: "#A855F7", cyan: "#06B6D4",
          amber: "#F59E0B", indigo: "#6366F1",
        };
        subjects?.forEach((s) => subjectMap.set(s.id, s.name));

        const xpBySubject = new Map<string, number>();
        progress?.forEach((p) => {
          const name = subjectMap.get(p.subject_id) || "Unknown";
          xpBySubject.set(name, (xpBySubject.get(name) || 0) + (p.xp_earned || 0));
        });

        const subXP: SubjectXP[] = [];
        xpBySubject.forEach((xp, name) => {
          const subject = subjects?.find((s) => s.name === name);
          subXP.push({
            name: name.length > 12 ? name.substring(0, 12) + "..." : name,
            xp,
            color: subjectColors[subject?.color || "purple"] || "#A855F7",
          });
        });
        setSubjectXP(subXP.sort((a, b) => b.xp - a.xp).slice(0, 8));

        // Total stats
        const totalXP = daily.reduce((s, d) => s + d.xp, 0);
        const totalMin = daily.reduce((s, d) => s + d.minutes, 0);
        const totalSessions = (sessions?.length || 0) + (assessments?.length || 0);
        setTotalStats({ xp: totalXP, minutes: totalMin, sessions: totalSessions });

      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

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

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] font-poppins overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* Header */}
          <header className="pl-14 md:pl-0">
            <h1 className="text-white font-bold text-xl sm:text-2xl">Analytics</h1>
            <p className="text-white/50 text-xs sm:text-sm">Deep insights into your learning journey</p>
          </header>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-3 sm:p-4 flex flex-col items-center text-center gap-1">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <span className="text-white font-bold text-lg sm:text-xl">{totalStats.xp}</span>
              <span className="text-white/40 text-[10px] sm:text-xs">XP (14 days)</span>
            </GlassCard>
            <GlassCard className="p-3 sm:p-4 flex flex-col items-center text-center gap-1">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <span className="text-white font-bold text-lg sm:text-xl">{totalStats.minutes}m</span>
              <span className="text-white/40 text-[10px] sm:text-xs">Study Time</span>
            </GlassCard>
            <GlassCard className="p-3 sm:p-4 flex flex-col items-center text-center gap-1">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <span className="text-white font-bold text-lg sm:text-xl">{totalStats.sessions}</span>
              <span className="text-white/40 text-[10px] sm:text-xs">Sessions</span>
            </GlassCard>
          </div>

          {/* XP Over Time Chart */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-sm sm:text-base">XP Over Time</h3>
              <span className="text-white/30 text-xs ml-auto">Last 14 days</span>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "rgba(30,15,45,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="#A855F7" strokeWidth={2} fill="url(#xpGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Study Time Chart */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Study Time (minutes)</h3>
              <span className="text-white/30 text-xs ml-auto">Last 14 days</span>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "rgba(30,15,45,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  />
                  <Bar dataKey="minutes" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Subject XP Breakdown */}
          {subjectXP.length > 0 && (
            <GlassCard className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-semibold text-sm sm:text-base">XP by Subject</h3>
              </div>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectXP} layout="vertical">
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ background: "rgba(30,15,45,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    />
                    <Bar dataKey="xp" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {/* Advanced Panels */}
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
