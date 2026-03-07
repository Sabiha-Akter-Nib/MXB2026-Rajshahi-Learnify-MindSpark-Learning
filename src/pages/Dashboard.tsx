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
  Laptop } from
"lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import DailyNotificationTrigger from "@/components/notifications/DailyNotificationTrigger";

// 3D Assets
import aiTutor3d from "@/assets/module-ai-tutor-3d.png";
import practice3d from "@/assets/module-practice-3d.webp";
import assessment3d from "@/assets/module-assessment-3d.webp";
import learningPlan3d from "@/assets/module-learning-plan-3d.png";
import leaderboard3d from "@/assets/module-leaderboard-3d.png";
import streakFlame3d from "@/assets/streak-flame-3d.png";
import statStudy3d from "@/assets/stat-study-3d.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import statStudyCardBg from "@/assets/stat-study-card-bg.png";
import statXpCardBg from "@/assets/stat-xp-card-bg.png";
import subjectBooks3d from "@/assets/subject-books-3d.png";

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
  'book': BookOpen
};

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Liquid glass card wrapper — Light -45deg 80%, Refraction 100%, Depth 100%, Dispersion 95%, Frost 0%, Splay 0%
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
<div
  className={cn(
    "rounded-2xl border border-white/[0.15] backdrop-blur-2xl",
    className
  )}
  style={{
    background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 0.5px rgba(255,255,255,0.08)",
  }}
  {...props}>
  
    {children}
  </div>;


const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    weekly_xp: 0,
    weekly_study_minutes: 0,
    weekly_goal_percent: 0,
    today_study_minutes: 0,
    activeDaysThisWeek: new Set<number>(),
    isFirstTimeUser: true
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
        const { data: profileData } = await supabase.
        from("profiles").
        select("full_name, class, version").
        eq("user_id", user.id).
        maybeSingle();
        if (profileData) setProfile(profileData);

        const { data: statsData } = await supabase.
        from("student_stats").
        select("total_xp, current_streak, total_study_minutes").
        eq("user_id", user.id).
        maybeSingle();
        if (statsData) {
          setStats({
            ...statsData,
            current_streak: streak.currentStreak ?? statsData.current_streak
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

        const { data: weeklySessionsData } = await supabase.
        from("study_sessions").
        select("xp_earned, duration_minutes, created_at").
        eq("user_id", user.id).
        gte("created_at", weekStartDate.toISOString());

        const { data: weeklyAssessmentsData } = await supabase.
        from("assessments").
        select("xp_earned").
        eq("user_id", user.id).
        gte("created_at", weekStartDate.toISOString());

        const sessionsXP = weeklySessionsData?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0;
        const assessmentsXP = weeklyAssessmentsData?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;
        const weeklyXP = sessionsXP + assessmentsXP;
        const weeklyMinutes = weeklySessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

        const todaySessionMinutes = weeklySessionsData?.reduce((sum, s) => {
          return new Date(s.created_at) >= todayStart ? sum + (s.duration_minutes || 0) : sum;
        }, 0) || 0;

        const { data: todayAssessments } = await supabase.
        from("assessments").
        select("id, time_taken_seconds").
        eq("user_id", user.id).
        gte("completed_at", todayStart.toISOString());

        const todayAssessmentMinutes = todayAssessments?.reduce((sum, a) => {
          return sum + Math.max(1, Math.round((a.time_taken_seconds || 60) / 60));
        }, 0) || 0;

        const todayMinutes = todaySessionMinutes + todayAssessmentMinutes;
        const weeklyGoalPercent = Math.min(Math.round(weeklyXP / 500 * 100), 100);

        const activeDays = new Set<number>();
        weeklySessionsData?.forEach((s) => {
          const d = new Date(s.created_at);
          const bd = d.getDay() === 6 ? 0 : d.getDay() + 1;
          if (s.duration_minutes >= 1) activeDays.add(bd);
        });

        const { data: weeklyAssessmentDates } = await supabase.
        from("assessments").
        select("completed_at").
        eq("user_id", user.id).
        gte("completed_at", weekStartDate.toISOString());

        weeklyAssessmentDates?.forEach((a) => {
          const d = new Date(a.completed_at);
          const bd = d.getDay() === 6 ? 0 : d.getDay() + 1;
          activeDays.add(bd);
        });

        const { count } = await supabase.
        from("study_sessions").
        select("id", { count: "exact", head: true }).
        eq("user_id", user.id);

        setWeeklyStats({
          weekly_xp: weeklyXP,
          weekly_study_minutes: weeklyMinutes,
          weekly_goal_percent: weeklyGoalPercent,
          today_study_minutes: todayMinutes,
          activeDaysThisWeek: activeDays,
          isFirstTimeUser: (count || 0) === 0
        });

        const studentClass = profileData?.class || 6;
        const { data: subjectsData } = await supabase.
        from("subjects").
        select("*").
        lte("min_class", studentClass).
        gte("max_class", studentClass);

        const { data: progressData } = await supabase.
        from("student_progress").
        select("subject_id, chapters_completed, xp_earned").
        eq("user_id", user.id);

        if (subjectsData) {
          const progressMap = new Map((progressData || []).map((p) => [p.subject_id, p]));
          setSubjects(subjectsData.map((subject) => {
            const progress = progressMap.get(subject.id);
            const completed = progress?.chapters_completed || 0;
            return {
              ...subject,
              progress: Math.round(completed / subject.total_chapters * 100),
              completed,
              IconComponent: iconMap[subject.icon] || BookOpen
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

  // Streak logic (no more Tugi mascot images — fire only)
  const currentStreak = streak.currentStreak ?? stats?.current_streak ?? 0;
  const todayStudyMinutes = weeklyStats.today_study_minutes;
  const hasStudiedToday = todayStudyMinutes >= 1;

  const streakComment = useMemo(() => {
    if (currentStreak === 0 && !weeklyStats.isFirstTimeUser) return "Your streak broke! Start studying now!";
    if (!hasStudiedToday && !weeklyStats.isFirstTimeUser) return "You haven't studied today yet!";
    if (currentStreak >= 7) return "Amazing streak! Keep the fire burning!";
    if (currentStreak >= 3) return "Great momentum, keep going!";
    if (currentStreak >= 1) return "Nice start! Keep it up!";
    return "Start studying to build your streak!";
  }, [currentStreak, hasStudiedToday, weeklyStats.isFirstTimeUser]);

  // Map BD week days to Mon-Sun display
  const dayMapping = [2, 3, 4, 5, 6, 0, 1];

  if (loading || isLoadingData) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-10 h-10 text-white/70" />
          </motion.div>
          <p className="text-white/60 font-poppins font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>);

  }

  if (!user) return null;

  const displayName = profile?.full_name || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const versionText = profile?.version === "bangla" ? "Bangla Version" : "English Version";

  const modules = [
  { label: "AI Tutor", img: aiTutor3d, href: "/tutor" },
  { label: "Practice", img: practice3d, href: "/practice" },
  { label: "Learning Plan", img: learningPlan3d, href: "/learning-plan" },
  { label: "Assessment", img: assessment3d, href: "/assessment" },
  { label: "Leaderboard", img: leaderboard3d, href: "/leaderboard" }];


  // Uniform gap for all sections
  const CARD_GAP = "gap-5";

  return (
    <div
      className="min-h-[100dvh] font-poppins overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)" }}>
      
      <div className={cn("w-full max-w-2xl mx-auto px-4 py-6 flex flex-col", CARD_GAP)}>

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

        {/* ========== NAVIGATION MODULES ========== */}
        <GlassCard className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start justify-between">
            {modules.map((mod) =>
            <Link
              key={mod.label}
              to={mod.href}
              className="flex flex-col items-center gap-1.5 group flex-1">
              
                <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center">
                
                  <img src={mod.img} alt={mod.label} className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
                </motion.div>
                <span className="text-white/80 text-[11px] sm:text-sm text-center leading-tight font-normal whitespace-nowrap">{mod.label}</span>
              </Link>
            )}
          </div>
        </GlassCard>

        {/* ========== STREAK CARD ========== */}
        <GlassCard className="px-3 py-3 sm:px-4 sm:py-3.5 flex items-center gap-3">
          {/* Fire with overlaid number in rounded container */}
          <div className="flex-shrink-0 relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <motion.img
              src={streakFlame3d}
              alt="Streak Fire"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              animate={currentStreak > 0 ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} />
            <span
              className="absolute bottom-0 text-2xl sm:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                WebkitTextStroke: '1.5px rgba(140,80,220,0.8)',
              }}>
              {currentStreak}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm sm:text-lg leading-snug font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {currentStreak > 0 ?
              `${currentStreak} days streak, well done!` :
              "0 days streak, study to achieve!"}
            </h3>
            <p className="text-white/50 mb-2 font-light text-[11px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{streakComment}</p>
            <div className="flex items-center gap-2 sm:gap-2.5">
              {DAYS_EN.map((day, i) => {
                const bdIndex = dayMapping[i];
                const isActive = weeklyStats.activeDaysThisWeek.has(bdIndex);
                const now = new Date();
                const jsDay = now.getDay();
                const todayBdIndex = jsDay === 6 ? 0 : jsDay + 1;
                const isToday = bdIndex === todayBdIndex;
                const isTodayActive = isToday && isActive;
                return (
                  <div key={day} className="flex flex-col items-center gap-0.5">
                    {/* Outer circle */}
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative"
                      style={{
                        backgroundColor: isActive
                          ? 'rgba(187, 167, 253, 0.7)'
                          : 'rgba(217, 217, 217, 0.7)',
                      }}>
                      {/* Inner circle */}
                      <div
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isActive
                            ? 'rgba(187, 167, 253, 0.3)'
                            : 'rgba(217, 217, 217, 0.3)',
                        }}>
                      </div>
                      {/* Flame sitting on circle, bottom-aligned */}
                      {isTodayActive && (
                        <img
                          src={streakFlame3d}
                          alt=""
                          className="absolute bottom-0 w-7 h-7 sm:w-8 sm:h-8 object-contain z-10"
                        />
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-white/40">{day}</span>
                  </div>);
              })}
            </div>
          </div>
        </GlassCard>

        {/* ========== AI PRACTICE CTA ========== */}
        <Link to="/tutor">
          <div
            className="rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5 flex items-center gap-3 border border-white/10"
            style={{
              background: "linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)",
              boxShadow: "0 8px 32px rgba(175,45,80,0.3)"
            }}>
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
              <img src={aiTutor3d} alt="AI Tutor" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-lg whitespace-nowrap overflow-hidden text-ellipsis">Practice learning with AI</h3>
              <p className="text-white/70 leading-snug text-[11px] sm:text-sm">
                Learn with your AI partner for clarity, explanations, and easy doubt-solving
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/25 backdrop-blur-sm border border-white/30 text-white text-xs sm:text-sm font-semibold shadow-lg">
                Start
              </div>
            </div>
          </div>
        </Link>

        {/* ========== STAT CARDS (2 columns) ========== */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Study Time */}
          <GlassCard className="p-3 sm:p-4 flex flex-row items-center gap-2.5 sm:gap-3">
            <div
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.15] backdrop-blur-2xl"
              style={{
                background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}>
              <img src={statStudy3d} alt="Study time" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h4 className="text-white font-bold text-xs sm:text-base leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontFamily: "'Poppins', sans-serif" }}>Total Study Time</h4>
              <span className="text-white font-bold text-xl sm:text-3xl leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                {formatStudyTime(weeklyStats.today_study_minutes)}
              </span>
            </div>
          </GlassCard>

          {/* Total XP */}
          <GlassCard className="p-3 sm:p-4 flex flex-row items-center gap-2.5 sm:gap-3">
            <div
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.15] backdrop-blur-2xl"
              style={{
                background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}>
              <img src={statXp3d} alt="XP" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h4 className="text-white font-bold text-xs sm:text-base leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontFamily: "'Poppins', sans-serif" }}>Total XP Points</h4>
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-xl sm:text-3xl leading-none whitespace-nowrap">{stats?.total_xp || 0}</span>
                <img src={statXp3d} alt="" className="w-4 h-4 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ========== SUBJECT PROGRESS ========== */}
        <GlassCard className="p-4 sm:p-5">
          {/* Header with 3D book */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
              <img src={subjectBooks3d} alt="Subjects" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
            </div>
            <div
              className="flex-1 rounded-xl p-3"
              style={{
                background: "linear-gradient(135deg, rgba(253,145,217,0.35) 0%, rgba(175,45,80,0.35) 100%)"
              }}>
              
              <h3 className="text-white font-semibold text-sm sm:text-base">Your subject-wise progress</h3>
              <p className="text-white/50 text-[10px] sm:text-xs">
                Track your progress and check exam readiness
              </p>
            </div>
          </div>

          {/* Subject grid */}
          {subjects.length === 0 ?
          <div className="text-center py-8 text-white/40 text-sm">No subjects found for your class.</div> :

          <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject, index) =>
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl p-3 border border-white/10 bg-white/5 backdrop-blur-sm">
              
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <img src={subjectBooks3d} alt="" className="w-5 h-5 object-contain" />
                    </div>
                    <span className="text-white text-xs sm:text-sm font-medium truncate">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #E040A0, #A040E0)"
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }} />
                  
                    </div>
                    <span className="text-[10px] text-white/40 font-medium">{subject.progress}%</span>
                  </div>
                </motion.div>
            )}
            </div>
          }
        </GlassCard>

        {/* Daily Notification Trigger (invisible) */}
        <DailyNotificationTrigger />
      </div>
    </div>);

};

export default Dashboard;