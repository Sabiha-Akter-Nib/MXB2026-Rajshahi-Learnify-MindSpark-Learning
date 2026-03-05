import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  BookOpen,
  ChevronRight,
  Loader2,
  Flame,
  LucideIcon,
  BookText,
  Languages,
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  Globe,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import DailyNotificationTrigger from "@/components/notifications/DailyNotificationTrigger";
import { Progress } from "@/components/ui/progress";

// 3D Assets
import aiTutor3d from "@/assets/module-ai-tutor-3d.png";
import practice3d from "@/assets/module-practice-3d.webp";
import assessment3d from "@/assets/module-assessment-3d.webp";
import learningPlan3d from "@/assets/module-learning-plan-3d.png";
import leaderboard3d from "@/assets/module-leaderboard-3d.png";
import streakFlame3d from "@/assets/streak-flame-3d.png";
import statStudy3d from "@/assets/stat-study-3d.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import subjectProgress3d from "@/assets/subject-progress-3d.png";

// Streak mascot assets
import streakBg1 from "@/assets/streak-bg-1.png";
import streakBg2 from "@/assets/streak-bg-2.png";
import streakBg3 from "@/assets/streak-bg-3.png";
import streakBg4 from "@/assets/streak-bg-4.png";
import streakBg5 from "@/assets/streak-bg-5.png";
import streakBg6 from "@/assets/streak-bg-6.png";
import streakBg7 from "@/assets/streak-bg-7.png";
import streakBg8 from "@/assets/streak-bg-8.png";
import streakBgAngry from "@/assets/streak-bg-angry.png";
import streakBgAngry2 from "@/assets/streak-bg-angry-2.png";

const goodImages = [streakBg1, streakBg2, streakBg3, streakBg4, streakBg5, streakBg6, streakBg7, streakBg8];
const angryImages = [streakBgAngry, streakBgAngry2];

interface Profile {
  full_name: string;
  class: number;
  version: string;
}

interface StudentStats {
  total_xp: number;
  current_streak: number;
  total_study_minutes: number;
}

interface WeeklyStats {
  weekly_xp: number;
  weekly_study_minutes: number;
  weekly_goal_percent: number;
  today_study_minutes: number;
  activeDaysThisWeek: Set<number>;
  isFirstTimeUser: boolean;
}

interface Subject {
  id: string;
  name: string;
  name_bn: string;
  icon: string;
  color: string;
  total_chapters: number;
}

interface SubjectProgress {
  subject_id: string;
  chapters_completed: number;
  xp_earned: number;
}

interface SubjectWithProgress extends Subject {
  progress: number;
  completed: number;
  IconComponent: LucideIcon;
}

const iconMap: Record<string, LucideIcon> = {
  'book-text': BookText,
  'languages': Languages,
  'calculator': Calculator,
  'atom': Atom,
  'flask-conical': FlaskConical,
  'leaf': Leaf,
  'globe': Globe,
  'laptop': Laptop,
  'book': BookOpen,
};

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Liquid glass card wrapper
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 backdrop-blur-xl",
      className
    )}
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
    }}
    {...props}
  >
    {children}
  </div>
);

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    weekly_xp: 0,
    weekly_study_minutes: 0,
    weekly_goal_percent: 0,
    today_study_minutes: 0,
    activeDaysThisWeek: new Set<number>(),
    isFirstTimeUser: true,
  });
  const [subjects, setSubjects] = useState<SubjectWithProgress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const streak = useStreakTracker(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setStats((prev) => {
      if (!prev) return prev;
      if (prev.current_streak === streak.currentStreak) return prev;
      return { ...prev, current_streak: streak.currentStreak };
    });
  }, [user, streak.currentStreak]);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, class, version")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileData) setProfile(profileData);

        const { data: statsData } = await supabase
          .from("student_stats")
          .select("total_xp, current_streak, total_study_minutes")
          .eq("user_id", user.id)
          .maybeSingle();
        if (statsData) {
          setStats({
            ...statsData,
            current_streak: streak.currentStreak ?? statsData.current_streak,
          });
        }

        const now = new Date();
        const jsDay = now.getDay();
        const bdDayIndex = jsDay === 6 ? 0 : jsDay + 1;
        const weekStartDate = new Date(now);
        weekStartDate.setDate(weekStartDate.getDate() - bdDayIndex);
        weekStartDate.setHours(0, 0, 0, 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: weeklySessionsData } = await supabase
          .from("study_sessions")
          .select("xp_earned, duration_minutes, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekStartDate.toISOString());

        const { data: weeklyAssessmentsData } = await supabase
          .from("assessments")
          .select("xp_earned")
          .eq("user_id", user.id)
          .gte("created_at", weekStartDate.toISOString());

        const sessionsXP = weeklySessionsData?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0;
        const assessmentsXP = weeklyAssessmentsData?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;
        const weeklyXP = sessionsXP + assessmentsXP;
        const weeklyMinutes = weeklySessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

        const todaySessionMinutes = weeklySessionsData?.reduce((sum, s) => {
          return new Date(s.created_at) >= todayStart ? sum + (s.duration_minutes || 0) : sum;
        }, 0) || 0;

        const { data: todayAssessments } = await supabase
          .from("assessments")
          .select("id, time_taken_seconds")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart.toISOString());

        const todayAssessmentMinutes = todayAssessments?.reduce((sum, a) => {
          return sum + Math.max(1, Math.round((a.time_taken_seconds || 60) / 60));
        }, 0) || 0;

        const todayMinutes = todaySessionMinutes + todayAssessmentMinutes;
        const weeklyGoalPercent = Math.min(Math.round((weeklyXP / 500) * 100), 100);

        const activeDays = new Set<number>();
        weeklySessionsData?.forEach((s) => {
          const d = new Date(s.created_at);
          const bd = d.getDay() === 6 ? 0 : d.getDay() + 1;
          if (s.duration_minutes >= 1) activeDays.add(bd);
        });

        const { data: weeklyAssessmentDates } = await supabase
          .from("assessments")
          .select("completed_at")
          .eq("user_id", user.id)
          .gte("completed_at", weekStartDate.toISOString());

        weeklyAssessmentDates?.forEach((a) => {
          const d = new Date(a.completed_at);
          const bd = d.getDay() === 6 ? 0 : d.getDay() + 1;
          activeDays.add(bd);
        });

        const { count } = await supabase
          .from("study_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setWeeklyStats({
          weekly_xp: weeklyXP,
          weekly_study_minutes: weeklyMinutes,
          weekly_goal_percent: weeklyGoalPercent,
          today_study_minutes: todayMinutes,
          activeDaysThisWeek: activeDays,
          isFirstTimeUser: (count || 0) === 0,
        });

        const studentClass = profileData?.class || 6;
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .lte("min_class", studentClass)
          .gte("max_class", studentClass);

        const { data: progressData } = await supabase
          .from("student_progress")
          .select("subject_id, chapters_completed, xp_earned")
          .eq("user_id", user.id);

        if (subjectsData) {
          const progressMap = new Map((progressData || []).map((p) => [p.subject_id, p]));
          setSubjects(subjectsData.map((subject) => {
            const progress = progressMap.get(subject.id);
            const completed = progress?.chapters_completed || 0;
            return {
              ...subject,
              progress: Math.round((completed / subject.total_chapters) * 100),
              completed,
              IconComponent: iconMap[subject.icon] || BookOpen,
            };
          }));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDashboardData();
  }, [user, streak.currentStreak]);

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins} min`;
    return `${mins} min`;
  };

  // Streak mascot logic
  const currentStreak = streak.currentStreak ?? stats?.current_streak ?? 0;
  const todayStudyMinutes = weeklyStats.today_study_minutes;
  const hasStudiedToday = todayStudyMinutes >= 1;
  const isAngry = !hasStudiedToday && !weeklyStats.isFirstTimeUser;

  const mascotImage = useMemo(() => {
    if (isAngry) return angryImages[Math.floor(Math.random() * angryImages.length)];
    return goodImages[Math.floor(Math.random() * goodImages.length)];
  }, [isAngry]);

  const streakComment = useMemo(() => {
    if (currentStreak === 0 && !weeklyStats.isFirstTimeUser) return "Your streak broke! Start again!";
    if (!hasStudiedToday && !weeklyStats.isFirstTimeUser) return "You haven't studied today yet!";
    if (currentStreak >= 7) return "Amazing progress! well done!";
    if (currentStreak >= 3) return "Great momentum, keep going!";
    return "Well done! Keep it up!";
  }, [currentStreak, hasStudiedToday, weeklyStats.isFirstTimeUser]);

  // Map BD week days to Mon-Sun display
  // BD: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  // Display: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const dayMapping = [2, 3, 4, 5, 6, 0, 1]; // Mon→bd2, Tue→bd3, ...

  if (loading || isLoadingData) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-10 h-10 text-white/70" />
          </motion.div>
          <p className="text-white/60 font-poppins font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const versionText = profile?.version === "bangla" ? "Bangla Version" : "English Version";

  const modules = [
    { label: "AI Tutor", img: aiTutor3d, href: "/tutor" },
    { label: "Practice", img: practice3d, href: "/practice" },
    { label: "Assessment", img: assessment3d, href: "/assessment" },
    { label: "Learning Plan", img: learningPlan3d, href: "/learning-plan" },
    { label: "Leaderboard", img: leaderboard3d, href: "/leaderboard" },
  ];

  return (
    <div
      className="min-h-[100dvh] font-poppins overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}
    >
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ========== HEADER ========== */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarUpload userId={user.id} userName={displayName} size="sm" showUploadButton={false} />
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight">Hi, {displayName.split(" ")[0]}!</h1>
              <p className="text-white/50 text-xs">{classText}, {versionText}</p>
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

        {/* ========== NAVIGATION MODULES ========== */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            {modules.map((mod, i) => (
              <Link
                key={mod.label}
                to={mod.href}
                className="flex flex-col items-center gap-1.5 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"
                >
                  <img src={mod.img} alt={mod.label} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                </motion.div>
                <span className="text-white/80 text-[10px] sm:text-xs font-medium text-center leading-tight">{mod.label}</span>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* ========== STREAK CARD ========== */}
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
            <img src={mascotImage} alt="Streak mascot" className="w-full h-full object-contain rounded-xl" />
            <div className="absolute -bottom-1 -left-1 flex items-center">
              <img src={streakFlame3d} alt="Flame" className="w-8 h-8" />
              <span className="text-lg font-bold text-blue-300 -ml-1">{currentStreak}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base">
              {currentStreak} days streak, well done!
            </h3>
            <p className="text-white/50 text-xs mb-3">{streakComment}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {DAYS_EN.map((day, i) => {
                const bdIndex = dayMapping[i];
                const isActive = weeklyStats.activeDaysThisWeek.has(bdIndex);
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all",
                        isActive
                          ? "bg-gradient-to-br from-blue-400 to-purple-500 border-blue-300/50"
                          : "bg-white/5 border-white/10"
                      )}
                    >
                      {isActive && <Flame className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[9px] text-white/40">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* ========== AI PRACTICE CTA ========== */}
        <Link to="/tutor">
          <div
            className="rounded-2xl p-4 flex items-center gap-4 border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(180, 50, 100, 0.5) 0%, rgba(200, 60, 120, 0.3) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl bg-purple-900/50 flex items-center justify-center overflow-hidden border border-white/10">
              <img src={aiTutor3d} alt="AI Tutor" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base">Practice learning with AI</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Learn with your AI partner for clarity, explanations, and easy doubt-solving
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                Start
              </div>
            </div>
          </div>
        </Link>

        {/* ========== STAT CARDS (2 columns) ========== */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Study Time */}
          <GlassCard className="p-4 flex items-start gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
              <img src={statStudy3d} alt="Study time" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-semibold text-xs sm:text-sm">Total study time</h4>
              <p className="text-white/40 text-[10px] sm:text-xs">Today you studied for</p>
              <div className="mt-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10 inline-block">
                <span className="text-white font-semibold text-sm">
                  {formatStudyTime(weeklyStats.today_study_minutes)}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Total XP */}
          <GlassCard className="p-4 flex items-start gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
              <img src={statXp3d} alt="XP" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-semibold text-xs sm:text-sm">Total XP points</h4>
              <p className="text-white/40 text-[10px] sm:text-xs">Your points you have gained</p>
              <div className="mt-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10 inline-flex items-center gap-1">
                <span className="text-white font-semibold text-sm">{stats?.total_xp || 0}</span>
                <span className="text-yellow-400 text-sm">⭐</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ========== SUBJECT PROGRESS ========== */}
        <GlassCard className="p-4">
          {/* Header with 3D book */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
              <img src={subjectProgress3d} alt="Subjects" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div
              className="flex-1 rounded-xl p-3"
              style={{
                background: "linear-gradient(135deg, rgba(220, 50, 100, 0.4) 0%, rgba(180, 40, 80, 0.3) 100%)",
              }}
            >
              <h3 className="text-white font-semibold text-sm sm:text-base">Your total subject-wise progress</h3>
              <p className="text-white/50 text-[10px] sm:text-xs">
                See your total subject-wise progress and check if you're ready for your exam or not
              </p>
            </div>
          </div>

          {/* Subject grid */}
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-sm">No subjects found for your class.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl p-3 border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <img src={subjectProgress3d} alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-white text-xs sm:text-sm font-medium truncate">{subject.name}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #E040A0, #A040E0)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Daily Notification Trigger (invisible) */}
        <DailyNotificationTrigger />
      </div>
    </div>
  );
};

export default Dashboard;
