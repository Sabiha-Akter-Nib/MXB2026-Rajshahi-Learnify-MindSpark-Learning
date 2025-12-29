import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  Target,
  Flame,
  ArrowRight,
  Sparkles,
  Brain,
  BarChart3,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { differenceInDays, differenceInHours, format, subDays } from "date-fns";

type MomentumLevel = "accelerating" | "steady" | "slowing" | "stalled";

interface DailyMetric {
  date: string;
  xp: number;
  minutes: number;
  sessions: number;
}

interface MomentumData {
  currentVelocity: number; // XP per hour
  velocityTrend: "up" | "down" | "stable";
  velocityChange: number; // percentage change
  momentumLevel: MomentumLevel;
  peakHour: number; // 0-23
  peakDay: string; // day of week
  dailyMetrics: DailyMetric[];
  predictedWeeklyXP: number;
  optimalStudyWindow: { start: number; end: number };
  focusScore: number; // 0-100
  consistencyScore: number; // 0-100
  efficiencyScore: number; // 0-100
  streakMultiplier: number;
  nextMilestone: { xp: number; name: string; daysAway: number };
}

const momentumConfig: Record<MomentumLevel, { color: string; label: string; labelBn: string; icon: React.ElementType }> = {
  accelerating: { color: "primary", label: "Accelerating", labelBn: "ত্বরণশীল", icon: TrendingUp },
  steady: { color: "success", label: "Steady", labelBn: "স্থির", icon: Minus },
  slowing: { color: "warning", label: "Slowing", labelBn: "ধীর হচ্ছে", icon: TrendingDown },
  stalled: { color: "destructive", label: "Stalled", labelBn: "থেমে গেছে", icon: Activity },
};

const StudyMomentumEngine = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isBangla, setIsBangla] = useState(false);
  const [momentumData, setMomentumData] = useState<MomentumData | null>(null);
  const [activeTab, setActiveTab] = useState<"velocity" | "prediction" | "optimization">("velocity");

  useEffect(() => {
    if (!user) return;
    fetchMomentumData();
  }, [user]);

  const fetchMomentumData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch profile for language preference
      const { data: profile } = await supabase
        .from("profiles")
        .select("version")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsBangla(profile?.version === "bangla");

      // Fetch last 14 days of study sessions
      const twoWeeksAgo = subDays(new Date(), 14);
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("xp_earned, duration_minutes, created_at")
        .eq("user_id", user.id)
        .gte("created_at", twoWeeksAgo.toISOString())
        .order("created_at", { ascending: true });

      // Fetch assessments for the same period
      const { data: assessments } = await supabase
        .from("assessments")
        .select("xp_earned, created_at")
        .eq("user_id", user.id)
        .gte("created_at", twoWeeksAgo.toISOString());

      // Fetch student stats for streak info
      const { data: stats } = await supabase
        .from("student_stats")
        .select("current_streak, total_xp")
        .eq("user_id", user.id)
        .maybeSingle();

      const momentum = calculateMomentum(sessions || [], assessments || [], stats);
      setMomentumData(momentum);
    } catch (error) {
      console.error("Error fetching momentum data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMomentum = (
    sessions: any[],
    assessments: any[],
    stats: any
  ): MomentumData => {
    // Group by date
    const dailyMap = new Map<string, DailyMetric>();
    
    sessions.forEach((s) => {
      const date = format(new Date(s.created_at), "yyyy-MM-dd");
      const existing = dailyMap.get(date) || { date, xp: 0, minutes: 0, sessions: 0 };
      existing.xp += s.xp_earned || 0;
      existing.minutes += s.duration_minutes || 0;
      existing.sessions += 1;
      dailyMap.set(date, existing);
    });

    assessments.forEach((a) => {
      const date = format(new Date(a.created_at), "yyyy-MM-dd");
      const existing = dailyMap.get(date) || { date, xp: 0, minutes: 0, sessions: 0 };
      existing.xp += a.xp_earned || 0;
      dailyMap.set(date, existing);
    });

    const dailyMetrics = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate velocity (XP per hour)
    const totalXP = dailyMetrics.reduce((sum, d) => sum + d.xp, 0);
    const totalMinutes = dailyMetrics.reduce((sum, d) => sum + d.minutes, 0);
    const currentVelocity = totalMinutes > 0 ? (totalXP / (totalMinutes / 60)) : 0;

    // Calculate velocity trend (compare last 7 days to previous 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentMetrics = dailyMetrics.filter((d) => new Date(d.date) >= sevenDaysAgo);
    const olderMetrics = dailyMetrics.filter((d) => new Date(d.date) < sevenDaysAgo);

    const recentXP = recentMetrics.reduce((sum, d) => sum + d.xp, 0);
    const olderXP = olderMetrics.reduce((sum, d) => sum + d.xp, 0);
    
    const velocityChange = olderXP > 0 ? ((recentXP - olderXP) / olderXP) * 100 : 0;
    const velocityTrend: "up" | "down" | "stable" = 
      velocityChange > 10 ? "up" : velocityChange < -10 ? "down" : "stable";

    // Determine momentum level
    const daysWithActivity = dailyMetrics.filter((d) => d.sessions > 0).length;
    const momentumLevel: MomentumLevel = 
      velocityTrend === "up" && daysWithActivity >= 5 ? "accelerating" :
      velocityTrend === "stable" && daysWithActivity >= 4 ? "steady" :
      velocityTrend === "down" || daysWithActivity < 3 ? "slowing" : 
      daysWithActivity < 2 ? "stalled" : "steady";

    // Find peak study times
    const hourCounts = new Map<number, number>();
    sessions.forEach((s) => {
      const hour = new Date(s.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + (s.xp_earned || 0));
    });
    
    let peakHour = 18; // default to 6 PM
    let peakHourXP = 0;
    hourCounts.forEach((xp, hour) => {
      if (xp > peakHourXP) {
        peakHour = hour;
        peakHourXP = xp;
      }
    });

    // Find peak day
    const dayCounts = new Map<string, number>();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    sessions.forEach((s) => {
      const day = dayNames[new Date(s.created_at).getDay()];
      dayCounts.set(day, (dayCounts.get(day) || 0) + (s.xp_earned || 0));
    });
    
    let peakDay = "Saturday";
    let peakDayXP = 0;
    dayCounts.forEach((xp, day) => {
      if (xp > peakDayXP) {
        peakDay = day;
        peakDayXP = xp;
      }
    });

    // Predict weekly XP based on current momentum
    const avgDailyXP = dailyMetrics.length > 0 
      ? totalXP / dailyMetrics.length 
      : 0;
    const predictedWeeklyXP = Math.round(avgDailyXP * 7 * (1 + velocityChange / 200));

    // Calculate optimal study window (2 hours around peak)
    const optimalStudyWindow = {
      start: (peakHour - 1 + 24) % 24,
      end: (peakHour + 1) % 24,
    };

    // Calculate scores
    const consistencyScore = Math.min(100, Math.round((daysWithActivity / 14) * 100));
    const efficiencyScore = Math.min(100, Math.round(currentVelocity * 2)); // 50 XP/hour = 100%
    const focusScore = Math.round((consistencyScore + efficiencyScore) / 2);

    // Streak multiplier
    const currentStreak = stats?.current_streak || 0;
    const streakMultiplier = 1 + Math.min(currentStreak * 0.05, 0.5); // max 1.5x

    // Next milestone
    const currentTotalXP = stats?.total_xp || 0;
    const milestones = [
      { xp: 500, name: "Spark Igniter" },
      { xp: 1000, name: "Knowledge Seeker" },
      { xp: 2500, name: "Rising Star" },
      { xp: 5000, name: "Master Mind" },
      { xp: 10000, name: "Legend" },
    ];
    
    const nextMilestone = milestones.find((m) => m.xp > currentTotalXP) || milestones[milestones.length - 1];
    const xpToMilestone = nextMilestone.xp - currentTotalXP;
    const daysToMilestone = avgDailyXP > 0 ? Math.ceil(xpToMilestone / avgDailyXP) : 30;

    return {
      currentVelocity: Math.round(currentVelocity * 10) / 10,
      velocityTrend,
      velocityChange: Math.round(velocityChange),
      momentumLevel,
      peakHour,
      peakDay,
      dailyMetrics,
      predictedWeeklyXP,
      optimalStudyWindow,
      focusScore,
      consistencyScore,
      efficiencyScore,
      streakMultiplier,
      nextMilestone: {
        xp: nextMilestone.xp,
        name: nextMilestone.name,
        daysAway: daysToMilestone,
      },
    };
  };

  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${h}:00 ${ampm}`;
  };

  const MomentumGauge = ({ value, max = 100 }: { value: number; max?: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const angle = (percentage / 100) * 180 - 90;

    return (
      <div className="relative w-48 h-24 mx-auto">
        {/* Background arc */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--success))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-16 bg-gradient-to-t from-foreground to-foreground/50 rounded-full origin-bottom"
          style={{ marginLeft: "-2px" }}
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        {/* Center point */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-foreground rounded-full shadow-lg" />
        
        {/* Value display */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <motion.span
            className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
          </motion.span>
          <span className="text-xs text-muted-foreground ml-1">XP/hr</span>
        </div>
      </div>
    );
  };

  const VelocityChart = ({ metrics }: { metrics: DailyMetric[] }) => {
    const maxXP = Math.max(...metrics.map((m) => m.xp), 1);
    
    return (
      <div className="flex items-end gap-1 h-24">
        {metrics.slice(-7).map((metric, i) => (
          <motion.div
            key={metric.date}
            className="flex-1 relative group"
            initial={{ height: 0 }}
            animate={{ height: `${(metric.xp / maxXP) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary-light rounded-t-sm" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-card px-1 rounded">
              {metric.xp}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
      </motion.div>
    );
  }

  if (!momentumData) return null;

  const config = momentumConfig[momentumData.momentumLevel];
  const MomentumIcon = config.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50"
      aria-label={isBangla ? "স্টাডি মোমেন্টাম ইঞ্জিন" : "Study Momentum Engine"}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent/20 blur-3xl"
        />
        {/* Animated pulse lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <motion.line
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </svg>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Gauge className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">
                {isBangla ? "স্টাডি মোমেন্টাম" : "Study Momentum"}
                <span className="text-xs text-muted-foreground ml-2">Engine™</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {isBangla ? "তোমার শেখার গতি বিশ্লেষণ" : "Real-time learning velocity analytics"}
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              config.color === "primary" && "bg-primary/10 text-primary",
              config.color === "success" && "bg-success/10 text-success",
              config.color === "warning" && "bg-warning/10 text-warning",
              config.color === "destructive" && "bg-destructive/10 text-destructive"
            )}
          >
            <MomentumIcon className="w-3.5 h-3.5" />
            <span>{isBangla ? config.labelBn : config.label}</span>
          </motion.div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: "velocity" as const, label: isBangla ? "গতি" : "Velocity", icon: Activity },
            { id: "prediction" as const, label: isBangla ? "পূর্বাভাস" : "Prediction", icon: Target },
            { id: "optimization" as const, label: isBangla ? "অপ্টিমাইজ" : "Optimize", icon: Sparkles },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "velocity" && (
            <motion.div
              key="velocity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Gauge */}
              <div className="text-center">
                <MomentumGauge value={momentumData.currentVelocity} max={100} />
                <p className="text-sm text-muted-foreground mt-2">
                  {momentumData.velocityTrend === "up" && (
                    <span className="text-primary flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +{momentumData.velocityChange}% {isBangla ? "গত সপ্তাহ থেকে" : "from last week"}
                    </span>
                  )}
                  {momentumData.velocityTrend === "down" && (
                    <span className="text-warning flex items-center justify-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      {momentumData.velocityChange}% {isBangla ? "গত সপ্তাহ থেকে" : "from last week"}
                    </span>
                  )}
                  {momentumData.velocityTrend === "stable" && (
                    <span className="text-muted-foreground flex items-center justify-center gap-1">
                      <Minus className="w-4 h-4" />
                      {isBangla ? "স্থির গতি" : "Stable velocity"}
                    </span>
                  )}
                </p>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: isBangla ? "ফোকাস" : "Focus", value: momentumData.focusScore, icon: Brain },
                  { label: isBangla ? "ধারাবাহিকতা" : "Consistency", value: momentumData.consistencyScore, icon: Flame },
                  { label: isBangla ? "দক্ষতা" : "Efficiency", value: momentumData.efficiencyScore, icon: Zap },
                ].map((score, i) => (
                  <motion.div
                    key={score.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/50 rounded-xl p-3 text-center border border-border/30"
                  >
                    <score.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{score.value}</p>
                    <p className="text-xs text-muted-foreground">{score.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Weekly chart */}
              <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                <p className="text-sm font-medium mb-3">{isBangla ? "সাপ্তাহিক XP" : "Weekly XP"}</p>
                <VelocityChart metrics={momentumData.dailyMetrics} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>7 {isBangla ? "দিন আগে" : "days ago"}</span>
                  <span>{isBangla ? "আজ" : "Today"}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "prediction" && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Predicted weekly XP */}
              <div className="bg-card/50 rounded-xl p-5 border border-border/30 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">
                  {isBangla ? "পূর্বাভাসিত সাপ্তাহিক XP" : "Predicted Weekly XP"}
                </p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                >
                  {momentumData.predictedWeeklyXP}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isBangla ? "বর্তমান গতিতে" : "at current pace"}
                </p>
              </div>

              {/* Next milestone */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {isBangla ? "পরবর্তী মাইলস্টোন" : "Next Milestone"}
                    </p>
                    <p className="font-semibold">{momentumData.nextMilestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {momentumData.nextMilestone.xp.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">~{momentumData.nextMilestone.daysAway}</p>
                    <p className="text-xs text-muted-foreground">{isBangla ? "দিন বাকি" : "days away"}</p>
                  </div>
                </div>
              </div>

              {/* Streak multiplier */}
              <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{isBangla ? "স্ট্রিক বোনাস" : "Streak Bonus"}</p>
                      <p className="text-xs text-muted-foreground">
                        {isBangla ? "XP গুণক সক্রিয়" : "XP multiplier active"}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent">
                    {momentumData.streakMultiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "optimization" && (
            <motion.div
              key="optimization"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Optimal study window */}
              <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <p className="font-medium">{isBangla ? "সেরা পড়ার সময়" : "Optimal Study Window"}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="text-2xl font-bold text-primary">
                    {formatHour(momentumData.optimalStudyWindow.start)}
                  </span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">
                    {formatHour(momentumData.optimalStudyWindow.end)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {isBangla 
                    ? "এই সময়ে তোমার সর্বোচ্চ XP অর্জন হয়" 
                    : "You earn the most XP during this window"}
                </p>
              </div>

              {/* Peak day */}
              <div className="bg-card/50 rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <p className="font-medium">{isBangla ? "সেরা দিন" : "Peak Performance Day"}</p>
                </div>
                <p className="text-2xl font-bold text-center text-accent">{momentumData.peakDay}</p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {isBangla ? "তোমার সবচেয়ে উৎপাদনশীল দিন" : "Your most productive day"}
                </p>
              </div>

              {/* Quick action */}
              <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Link to="/tutor" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  {isBangla ? "এখনই পড়া শুরু করো" : "Start Studying Now"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default StudyMomentumEngine;