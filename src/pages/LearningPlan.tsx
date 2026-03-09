import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Target, CheckCircle2, Sparkles, Loader2,
  Zap, Star, Trophy, Flame, Award, Lock, Gift,
  BookOpen, Brain, RefreshCw, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TutorBackground from "@/components/tutor/TutorBackground";
import mascotImg from "@/assets/ai-mascot-3d.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import rocketImg from "@/assets/rocket-3d.png";
import streakFlame from "@/assets/streak-flame-3d.png";

const GRADIENT = "linear-gradient(135deg, hsl(300, 65%, 52%) 0%, hsl(270, 60%, 55%) 40%, hsl(30, 78%, 76%) 100%)";

interface DailyGoal {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  xpReward: number;
  type: "practice" | "assessment" | "tutor" | "streak" | "study_time";
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  icon: string;
  link?: string;
  badgeName?: string;
  badgeNameBn?: string;
}

// Generate random daily goals based on student data
const generateDailyGoals = (
  stats: { total_xp: number; current_streak: number; total_study_minutes: number } | null,
  isBangla: boolean
): DailyGoal[] => {
  const streak = stats?.current_streak || 0;
  const xp = stats?.total_xp || 0;
  const studyMin = stats?.total_study_minutes || 0;

  // Pool of possible goals — pick 5 randomly
  const goalPool: DailyGoal[] = [
    {
      id: "practice-5", title: "Complete 5 Practice Questions", titleBn: "৫টি অনুশীলন প্রশ্ন সম্পূর্ণ করো",
      description: "Solve 5 MCQs in any subject", descriptionBn: "যেকোনো বিষয়ে ৫টি MCQ সমাধান করো",
      xpReward: 10, type: "practice", targetValue: 5, currentValue: 0, isCompleted: false,
      icon: "target", link: "/practice", badgeName: "Practice Warrior", badgeNameBn: "অনুশীলন যোদ্ধা",
    },
    {
      id: "assessment-1", title: "Take a Model Test", titleBn: "একটি মডেল টেস্ট দাও",
      description: "Complete at least 1 model test today", descriptionBn: "আজ অন্তত ১টি মডেল টেস্ট সম্পূর্ণ করো",
      xpReward: 15, type: "assessment", targetValue: 1, currentValue: 0, isCompleted: false,
      icon: "award", link: "/assessment", badgeName: "Test Taker", badgeNameBn: "পরীক্ষার্থী",
    },
    {
      id: "tutor-chat", title: "Ask AI Tutor a Question", titleBn: "AI টিউটরকে একটি প্রশ্ন করো",
      description: "Have a learning conversation with AI", descriptionBn: "AI এর সাথে একটি শেখার আলোচনা করো",
      xpReward: 5, type: "tutor", targetValue: 1, currentValue: 0, isCompleted: false,
      icon: "brain", link: "/tutor", badgeName: "Curious Mind", badgeNameBn: "কৌতূহলী মন",
    },
    {
      id: "streak-keep", title: "Maintain Your Streak", titleBn: "তোমার স্ট্রিক ধরে রাখো",
      description: `Current streak: ${streak} days`, descriptionBn: `বর্তমান স্ট্রিক: ${streak} দিন`,
      xpReward: 5, type: "streak", targetValue: 1, currentValue: streak > 0 ? 1 : 0, isCompleted: streak > 0,
      icon: "flame", badgeName: "Streak Master", badgeNameBn: "স্ট্রিক মাস্টার",
    },
    {
      id: "study-15", title: "Study for 15 Minutes", titleBn: "১৫ মিনিট পড়াশোনা করো",
      description: "Spend at least 15 min learning", descriptionBn: "অন্তত ১৫ মিনিট শেখায় সময় দাও",
      xpReward: 8, type: "study_time", targetValue: 15, currentValue: 0, isCompleted: false,
      icon: "clock", link: "/tutor", badgeName: "Time Investor", badgeNameBn: "সময় বিনিয়োগকারী",
    },
    {
      id: "practice-10", title: "Solve 10 Questions", titleBn: "১০টি প্রশ্ন সমাধান করো",
      description: "Practice makes perfect!", descriptionBn: "অনুশীলনে সিদ্ধি!",
      xpReward: 20, type: "practice", targetValue: 10, currentValue: 0, isCompleted: false,
      icon: "star", link: "/practice", badgeName: "Question Slayer", badgeNameBn: "প্রশ্ন জয়ী",
    },
    {
      id: "xp-50", title: "Earn 50 XP Today", titleBn: "আজ ৫০ XP অর্জন করো",
      description: "Reach 50 XP through any activity", descriptionBn: "যেকোনো কাজের মাধ্যমে ৫০ XP পৌঁছাও",
      xpReward: 10, type: "practice", targetValue: 50, currentValue: 0, isCompleted: false,
      icon: "zap", badgeName: "XP Hunter", badgeNameBn: "XP শিকারী",
    },
    {
      id: "assessment-score", title: "Score 80%+ on a Test", titleBn: "একটি টেস্টে ৮০%+ স্কোর করো",
      description: "Prove your mastery!", descriptionBn: "তোমার দক্ষতা প্রমাণ করো!",
      xpReward: 25, type: "assessment", targetValue: 1, currentValue: 0, isCompleted: false,
      icon: "trophy", link: "/assessment", badgeName: "High Scorer", badgeNameBn: "উচ্চ স্কোরার",
    },
  ];

  // Deterministic shuffle based on today's date
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...goalPool].sort((a, b) => {
    const hashA = (seed * 31 + a.id.charCodeAt(0)) % 100;
    const hashB = (seed * 31 + b.id.charCodeAt(0)) % 100;
    return hashA - hashB;
  });

  return shuffled.slice(0, 5);
};

const iconMap: Record<string, React.ElementType> = {
  target: Target, award: Award, brain: Brain, flame: Flame,
  clock: Clock, star: Star, zap: Zap, trophy: Trophy,
};

const goalColors = [
  { accent: "hsl(270, 60%, 55%)", bg: "hsla(270, 60%, 55%, 0.08)", border: "hsla(270, 60%, 55%, 0.2)" },
  { accent: "hsl(300, 65%, 52%)", bg: "hsla(300, 65%, 52%, 0.08)", border: "hsla(300, 65%, 52%, 0.2)" },
  { accent: "hsl(30, 78%, 55%)", bg: "hsla(30, 78%, 55%, 0.08)", border: "hsla(30, 78%, 55%, 0.2)" },
  { accent: "hsl(145, 60%, 45%)", bg: "hsla(145, 60%, 45%, 0.08)", border: "hsla(145, 60%, 45%, 0.2)" },
  { accent: "hsl(200, 65%, 52%)", bg: "hsla(200, 65%, 52%, 0.08)", border: "hsla(200, 65%, 52%, 0.2)" },
];

const LearningPlanPage = () => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<{ class: number; version: string; full_name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayXpEarned, setTodayXpEarned] = useState(0);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isBangla = profile?.version === "bangla";

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, statsRes, sessionsRes, assessmentsRes] = await Promise.all([
        supabase.from("profiles").select("class, version, full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("student_stats").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("study_sessions").select("*").eq("user_id", user.id).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from("assessments").select("*").eq("user_id", user.id).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (statsRes.data) setStats(statsRes.data);

      const todaySessions = sessionsRes.data || [];
      const todayAssessments = assessmentsRes.data || [];
      const todayXp = todaySessions.reduce((s, t) => s + (t.xp_earned || 0), 0) + todayAssessments.reduce((s, a) => s + (a.xp_earned || 0), 0);
      setTodayXpEarned(todayXp);

      // Generate goals and update progress from today's data
      const baseGoals = generateDailyGoals(statsRes.data, profileRes.data?.version === "bangla");

      // Update goal progress based on today's activity
      const updatedGoals = baseGoals.map(goal => {
        let currentValue = goal.currentValue;
        let isCompleted = goal.isCompleted;

        if (goal.id === "practice-5" || goal.id === "practice-10") {
          const totalQuestions = todayAssessments.reduce((s, a) => s + (a.total_questions || 0), 0);
          currentValue = Math.min(totalQuestions, goal.targetValue);
          isCompleted = currentValue >= goal.targetValue;
        } else if (goal.id === "assessment-1") {
          currentValue = todayAssessments.length;
          isCompleted = currentValue >= 1;
        } else if (goal.id === "tutor-chat") {
          currentValue = todaySessions.filter(s => s.topic).length > 0 ? 1 : 0;
          isCompleted = currentValue >= 1;
        } else if (goal.id === "study-15") {
          const totalMin = todaySessions.reduce((s, t) => s + (t.duration_minutes || 0), 0);
          currentValue = Math.min(totalMin, 15);
          isCompleted = currentValue >= 15;
        } else if (goal.id === "xp-50") {
          currentValue = Math.min(todayXp, 50);
          isCompleted = currentValue >= 50;
        } else if (goal.id === "assessment-score") {
          const highScore = todayAssessments.some(a => a.total_questions > 0 && (a.correct_answers / a.total_questions) >= 0.8);
          currentValue = highScore ? 1 : 0;
          isCompleted = highScore;
        }

        return { ...goal, currentValue, isCompleted };
      });

      setGoals(updatedGoals);
      setIsLoading(false);
    };
    fetchData();
  }, [user, loading]);

  const completedGoals = goals.filter(g => g.isCompleted).length;
  const totalGoals = goals.length;
  const totalPossibleXp = goals.reduce((s, g) => s + g.xpReward, 0);
  const earnedGoalXp = goals.filter(g => g.isCompleted).reduce((s, g) => s + g.xpReward, 0);
  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TutorBackground />
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(270,60%,55%)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{ boxShadow: ["0 0 0 0 hsla(270,50%,75%,0)", "0 0 12px 4px hsla(270,50%,75%,0.15)", "0 0 0 0 hsla(270,50%,75%,0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white/50 shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsla(270, 50%, 90%, 0.5), hsla(320, 40%, 90%, 0.4), hsla(30, 60%, 92%, 0.4))" }}
                >
                  <img src={mascotImg} alt="AI" className="w-10 h-10 object-contain" />
                </motion.div>
              </div>
              <div>
                <h1 className="font-heading font-bold text-base text-foreground">{isBangla ? "আজকের লক্ষ্য 🎯" : "Daily Goals 🎯"}</h1>
                <p className="text-[11px] text-muted-foreground font-heading">{isBangla ? "প্রতিদিনের চ্যালেঞ্জ সম্পূর্ণ করো" : "Complete today's challenges"}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">

          {/* Hero mascot + overall progress */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="relative">
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: "radial-gradient(circle, hsla(270, 55%, 65%, 0.2), transparent 70%)" }} />
            <motion.img src={mascotImg} alt="AI" className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
            {completedGoals === totalGoals && totalGoals > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
                className="absolute -top-2 -right-2 z-20 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(45,95%,55%), hsl(30,90%,50%))", boxShadow: "0 4px 16px hsla(45,95%,55%,0.4)" }}>
                <Trophy className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </motion.div>

          {/* Progress ring */}
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsla(270,60%,55%,0.08)" strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#goalGrad)" strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: "0 264" }} animate={{ strokeDasharray: `${(overallProgress / 100) * 264} 264` }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }} />
              <defs><linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(300,65%,52%)" /><stop offset="50%" stopColor="hsl(270,60%,55%)" /><stop offset="100%" stopColor="hsl(30,78%,76%)" />
              </linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold font-heading" style={{ color: "hsl(270,60%,45%)" }}>{completedGoals}/{totalGoals}</span>
              <span className="text-[9px] font-semibold text-muted-foreground">{isBangla ? "সম্পন্ন" : "Complete"}</span>
            </div>
          </motion.div>

          {/* Motivational message */}
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
            <h2 className="text-lg sm:text-xl font-extrabold font-heading text-foreground">
              {completedGoals === totalGoals && totalGoals > 0
                ? (isBangla ? "সব লক্ষ্য সম্পন্ন! 🏆" : "All Goals Complete! 🏆")
                : completedGoals > 0
                  ? (isBangla ? "চালিয়ে যাও! তুমি দারুণ করছো 🔥" : "Keep going! You're doing great 🔥")
                  : (isBangla ? "আজকের লক্ষ্যগুলো সম্পূর্ণ করো! 💪" : "Complete today's goals! 💪")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-heading">
              {isBangla ? `মোট ${totalPossibleXp} XP অর্জনযোগ্য • ${earnedGoalXp} XP অর্জিত` : `${totalPossibleXp} XP available • ${earnedGoalXp} XP earned`}
            </p>
          </motion.div>

          {/* Today's XP stat */}
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl w-full max-w-sm" style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))",
              backdropFilter: "blur(24px)", border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 20px hsla(270,60%,55%,0.06)",
            }}>
            <img src={statXp3d} alt="XP" className="w-10 h-10 object-contain" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-heading">{isBangla ? "আজ অর্জিত" : "Earned Today"}</p>
              <p className="text-lg font-extrabold font-heading" style={{ color: "hsl(270,60%,45%)" }}>{todayXpEarned} XP</p>
            </div>
            <img src={streakFlame} alt="" className="w-8 h-8 object-contain opacity-60" />
          </motion.div>

          {/* Goal cards */}
          <div className="w-full space-y-3">
            {goals.map((goal, idx) => {
              const color = goalColors[idx % goalColors.length];
              const IconComp = iconMap[goal.icon] || Target;
              const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;

              return (
                <motion.div key={goal.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.08 }}
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: goal.isCompleted
                      ? "linear-gradient(-45deg, rgba(34,197,94,0.06), rgba(254,254,254,0.9))"
                      : "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))",
                    backdropFilter: "blur(24px) saturate(1.5)",
                    border: goal.isCompleted ? "1.5px solid hsla(145,63%,52%,0.3)" : `1.5px solid ${color.border}`,
                    boxShadow: goal.isCompleted ? "0 4px 20px hsla(145,63%,52%,0.1)" : `0 4px 20px ${color.bg}`,
                  }}
                >
                  {/* Decorative elements */}
                  <img src={rocketImg} alt="" className="absolute -top-2 -right-2 w-12 h-12 object-contain pointer-events-none" style={{ opacity: 0.06 }} />

                  <div className="flex items-start gap-3.5 relative z-10">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: goal.isCompleted ? "hsla(145,63%,52%,0.15)" : color.bg,
                        color: goal.isCompleted ? "hsl(145,63%,52%)" : color.accent,
                      }}
                    >
                      {goal.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <IconComp className="w-5 h-5" />}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold font-heading leading-tight ${goal.isCompleted ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                            {isBangla ? goal.titleBn : goal.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-heading">
                            {isBangla ? goal.descriptionBn : goal.description}
                          </p>
                        </div>

                        {/* XP badge */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0" style={{
                          background: goal.isCompleted ? "hsla(145,63%,52%,0.1)" : "hsla(270,60%,55%,0.08)",
                        }}>
                          <Zap className="w-3 h-3" style={{ color: goal.isCompleted ? "hsl(145,63%,52%)" : "hsl(270,60%,55%)" }} />
                          <span className="text-[10px] font-bold font-heading" style={{ color: goal.isCompleted ? "hsl(145,63%,52%)" : "hsl(270,60%,55%)" }}>
                            +{goal.xpReward}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-2 rounded-full overflow-hidden" style={{ background: "hsla(0,0%,0%,0.04)" }}>
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.6 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
                          style={{ background: goal.isCompleted ? "hsl(145,63%,52%)" : color.accent }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-heading text-muted-foreground">
                          {goal.currentValue}/{goal.targetValue}
                        </span>

                        {/* Badge unlock hint */}
                        {!goal.isCompleted && goal.badgeName && (
                          <div className="flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-muted-foreground/40" />
                            <span className="text-[9px] text-muted-foreground/50 font-heading">
                              {isBangla ? goal.badgeNameBn : goal.badgeName}
                            </span>
                          </div>
                        )}
                        {goal.isCompleted && goal.badgeName && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                            className="flex items-center gap-1">
                            <Gift className="w-2.5 h-2.5" style={{ color: "hsl(145,63%,52%)" }} />
                            <span className="text-[9px] font-bold font-heading" style={{ color: "hsl(145,63%,52%)" }}>
                              {isBangla ? "ব্যাজ আনলক!" : "Badge Unlocked!"}
                            </span>
                          </motion.div>
                        )}
                      </div>

                      {/* Action button */}
                      {!goal.isCompleted && goal.link && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mt-3">
                          <Link to={goal.link}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-heading text-white transition-all"
                            style={{ background: color.accent, boxShadow: `0 4px 12px ${color.border}` }}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {isBangla ? "শুরু করো" : "Start Now"}
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* All complete celebration */}
          <AnimatePresence>
            {completedGoals === totalGoals && totalGoals > 0 && (
              <motion.div initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: "spring" }}
                className="w-full rounded-2xl p-5 text-center relative overflow-hidden" style={{
                  background: "linear-gradient(135deg, hsla(145,63%,52%,0.08), hsla(270,60%,55%,0.05))",
                  backdropFilter: "blur(24px)", border: "1.5px solid hsla(145,63%,52%,0.2)",
                }}>
                <motion.img src={rocketImg} alt="" className="w-16 h-16 mx-auto mb-2"
                  animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                <h3 className="text-base font-extrabold font-heading text-foreground">
                  {isBangla ? "আজকের সব লক্ষ্য সম্পন্ন! 🎉" : "All Daily Goals Complete! 🎉"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-heading">
                  {isBangla ? "কাল নতুন চ্যালেঞ্জ আসবে!" : "New challenges tomorrow!"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard link */}
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="w-full">
            <Link to="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold font-heading transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))",
                backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)",
                color: "hsl(270, 60%, 45%)",
              }}>
              <ArrowLeft className="w-4 h-4" />{isBangla ? "ড্যাশবোর্ডে ফিরে যাও" : "Back to Dashboard"}
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LearningPlanPage;
