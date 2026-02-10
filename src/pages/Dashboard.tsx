import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  TrendingUp,
  Clock,
  Target,
  Flame,
  ChevronRight,
  Play,
  Calculator,
  BookText,
  Atom,
  FlaskConical,
  Leaf,
  Globe,
  Laptop,
  Languages,
  Sparkles,
  BarChart3,
  Calendar,
  Award,
  Trophy,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Loader2,
  LucideIcon,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import QuickActions from "@/components/dashboard/QuickActions";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import RevisionReminders from "@/components/dashboard/RevisionReminders";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import AnimatedStatsCard from "@/components/dashboard/AnimatedStatsCard";
import StreakCard from "@/components/dashboard/StreakCard";
import FutureYouSnapshot from "@/components/dashboard/FutureYouSnapshot";
import BlindSpotMirror from "@/components/dashboard/BlindSpotMirror";
import KnowledgeAutopsy from "@/components/dashboard/KnowledgeAutopsy";
import WeeklyAchievements from "@/components/dashboard/WeeklyAchievements";
import StudyMomentumEngine from "@/components/dashboard/StudyMomentumEngine";

import AvatarUpload from "@/components/avatar/AvatarUpload";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import DailyNotificationTrigger from "@/components/notifications/DailyNotificationTrigger";

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
  activeDaysThisWeek: Set<number>; // 0=Sat … 6=Fri (BD week)
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

// Icon mapping
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

// Color mapping
const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  'primary': { bg: 'bg-primary', text: 'text-primary', border: 'border-primary/20' },
  'accent': { bg: 'bg-accent', text: 'text-accent', border: 'border-accent/20' },
  'warning': { bg: 'bg-warning', text: 'text-warning', border: 'border-warning/20' },
  'success': { bg: 'bg-success', text: 'text-success', border: 'border-success/20' },
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Ensure streak is updated for “daily visit” (not only after a study session)
  const streak = useStreakTracker(user?.id);
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Reflect hook-updated streak into local stats state (so all UI uses the same number)
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
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, class, version")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch student stats
        const { data: statsData } = await supabase
          .from("student_stats")
          .select("total_xp, current_streak, total_study_minutes")
          .eq("user_id", user.id)
          .maybeSingle();

        if (statsData) {
          // Prefer the streak computed/updated by the hook (daily-visit aware)
          setStats({
            ...statsData,
            current_streak: streak.currentStreak || statsData.current_streak,
          });
        }

        // Compute the start of the current BD week (Saturday 00:00 Asia/Dhaka)
        const now = new Date();
        const jsDay = now.getDay(); // 0=Sun
        const bdDayIndex = jsDay === 6 ? 0 : jsDay + 1; // Sat=0
        const weekStartDate = new Date(now);
        weekStartDate.setDate(weekStartDate.getDate() - bdDayIndex);
        weekStartDate.setHours(0, 0, 0, 0);

        const oneWeekAgo = weekStartDate; // sessions from this week only

        // Get today's start (midnight)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: weeklySessionsData } = await supabase
          .from("study_sessions")
          .select("xp_earned, duration_minutes, created_at")
          .eq("user_id", user.id)
          .gte("created_at", oneWeekAgo.toISOString());

        const { data: weeklyAssessmentsData } = await supabase
          .from("assessments")
          .select("xp_earned")
          .eq("user_id", user.id)
          .gte("created_at", oneWeekAgo.toISOString());

        const sessionsXP =
          weeklySessionsData?.reduce((sum, s) => sum + (s.xp_earned || 0), 0) || 0;
        const assessmentsXP =
          weeklyAssessmentsData?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;
        const weeklyXP = sessionsXP + assessmentsXP;
        const weeklyMinutes =
          weeklySessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

        // Calculate today's study minutes (sessions + assessments count as 1 min each)
        const todaySessionMinutes =
          weeklySessionsData?.reduce((sum, s) => {
            const sessionDate = new Date(s.created_at);
            if (sessionDate >= todayStart) {
              return sum + (s.duration_minutes || 0);
            }
            return sum;
          }, 0) || 0;

        // Fetch today's assessments count (each counts as 1 min minimum)
        const { data: todayAssessments } = await supabase
          .from("assessments")
          .select("id, time_taken_seconds")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart.toISOString());

        const todayAssessmentMinutes = todayAssessments?.reduce((sum, a) => {
          return sum + Math.max(1, Math.round((a.time_taken_seconds || 60) / 60));
        }, 0) || 0;

        const todayMinutes = todaySessionMinutes + todayAssessmentMinutes;

        const weeklyGoalXP = 500;
        const weeklyGoalPercent = Math.min(
          Math.round((weeklyXP / weeklyGoalXP) * 100),
          100
        );

        // Compute active days this week (BD week: Sat=0 … Fri=6)
        // Count both study sessions (≥1min) AND assessments as active days
        const activeDays = new Set<number>();
        weeklySessionsData?.forEach((s) => {
          const d = new Date(s.created_at);
          const jsDay = d.getDay(); // 0=Sun
          const bdDay = jsDay === 6 ? 0 : jsDay + 1;
          if (s.duration_minutes >= 1) activeDays.add(bdDay);
        });

        // Also fetch assessment dates this week and count them as active
        const { data: weeklyAssessmentDates } = await supabase
          .from("assessments")
          .select("completed_at")
          .eq("user_id", user.id)
          .gte("completed_at", oneWeekAgo.toISOString());

        weeklyAssessmentDates?.forEach((a) => {
          const d = new Date(a.completed_at);
          const jsDay = d.getDay();
          const bdDay = jsDay === 6 ? 0 : jsDay + 1;
          activeDays.add(bdDay);
        });

        // Check if first-time user (no sessions at all before this week)
        const { count } = await supabase
          .from("study_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        const isFirstTime = (count || 0) === 0;

        setWeeklyStats({
          weekly_xp: weeklyXP,
          weekly_study_minutes: weeklyMinutes,
          weekly_goal_percent: weeklyGoalPercent,
          today_study_minutes: todayMinutes,
          activeDaysThisWeek: activeDays,
          isFirstTimeUser: isFirstTime,
        });

        // Fetch subjects based on student class
        const studentClass = profileData?.class || 5;
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .lte("min_class", studentClass)
          .gte("max_class", studentClass);

        // Fetch student progress for each subject
        const { data: progressData } = await supabase
          .from("student_progress")
          .select("subject_id, chapters_completed, xp_earned")
          .eq("user_id", user.id);

        // Combine subjects with progress
        if (subjectsData) {
          const progressMap = new Map(
            (progressData || []).map((p) => [p.subject_id, p])
          );

          const subjectsWithProgress: SubjectWithProgress[] = subjectsData.map(
            (subject) => {
              const progress = progressMap.get(subject.id);
              const completed = progress?.chapters_completed || 0;
              const percentage = Math.round(
                (completed / subject.total_chapters) * 100
              );

              return {
                ...subject,
                progress: percentage,
                completed,
                IconComponent: iconMap[subject.icon] || BookOpen,
              };
            }
          );

          setSubjects(subjectsWithProgress);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user, streak.currentStreak]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Format study time
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DashboardBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name?.split(" ")[0] || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const versionText = profile?.version === "bangla" ? "বাংলা" : "English";

  const navItems = [
    { icon: BarChart3, label: "Dashboard", active: true, href: "/dashboard" },
    { icon: BookOpen, label: "Subjects", href: "/subjects" },
    { icon: Brain, label: "AI Tutor", href: "/tutor" },
    { icon: Target, label: "Practice", href: "/practice" },
    { icon: Award, label: "Achievements", href: "/achievements" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Calendar, label: "Schedule", href: "/learning-plan" },
  ];

  return (
    <div className="min-h-screen flex relative">
      <DashboardBackground />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80
        }}
        className={cn(
          "bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground border-r border-sidebar-border/50 flex flex-col fixed h-screen z-40",
          "lg:translate-x-0",
          !sidebarOpen && "max-lg:-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border/50">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                MindSpark
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  item.active
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.active && sidebarOpen && (
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    layoutId="activeIndicator"
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-sidebar-border/50 space-y-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300 w-full", sidebarOpen ? "lg:ml-[280px]" : "lg:ml-20")}>
        {/* Top Bar */}
        <header className="sticky top-0 bg-background/60 backdrop-blur-xl border-b border-border/50 z-30 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted/50 rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
              <div>
                <motion.h1 
                  className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="hidden sm:inline">Welcome back, </span><span className="bg-gradient-to-r from-[hsl(270,65%,55%)] via-[hsl(320,70%,55%)] to-[hsl(35,90%,55%)] bg-clip-text text-transparent drop-shadow-sm">{displayName}</span><span className="hidden sm:inline"> 🚀</span>
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground text-xs sm:text-sm hidden sm:block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {classText} • {versionText} Version
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Streak Badge */}
              <motion.div 
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 rounded-full border border-amber-200 shadow-md"
                whileHover={{ scale: 1.05 }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(var(--accent), 0)",
                    "0 0 20px 2px rgba(var(--accent), 0.2)",
                    "0 0 0 0 rgba(var(--accent), 0)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </motion.div>
                <span className="font-semibold text-accent text-sm sm:text-base">{streak.currentStreak || stats?.current_streak || 0} Day Streak</span>
              </motion.div>

              {/* Mobile Streak */}
              <motion.div 
                className="flex sm:hidden items-center gap-1 px-2 py-1 bg-amber-50 rounded-full border border-amber-200"
              >
                <Flame className="w-4 h-4 text-accent" />
                <span className="font-semibold text-accent text-xs">{streak.currentStreak || stats?.current_streak || 0}</span>
              </motion.div>

              {/* Profile Avatar */}
              <AvatarUpload 
                userId={user.id} 
                userName={profile?.full_name || ""} 
                size="sm" 
                showUploadButton={false}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Streak Card - Full Width */}
          <StreakCard
            currentStreak={streak.currentStreak || stats?.current_streak || 0}
            totalStudyMinutes={weeklyStats.today_study_minutes}
            isFirstTimeUser={weeklyStats.isFirstTimeUser}
            activeDaysThisWeek={weeklyStats.activeDaysThisWeek}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <AnimatedStatsCard
              icon={TrendingUp}
              label="Weekly XP"
              value={weeklyStats.weekly_xp}
              color="primary"
              index={0}
            />
            <AnimatedStatsCard
              icon={Target}
              label="Weekly Goal"
              value={weeklyStats.weekly_goal_percent}
              suffix="%"
              color="success"
              index={1}
            />
            <AnimatedStatsCard
              icon={Clock}
              label="Today's Study"
              value={formatStudyTime(weeklyStats.today_study_minutes)}
              color="warning"
              index={2}
              isAnimatedNumber={false}
            />
          </div>

          {/* Future You Snapshot (single wide layout across all devices) */}
          <FutureYouSnapshot />

          {/* Study Momentum Engine - NEW World-class Feature */}
          <StudyMomentumEngine />

          {/* Blind Spot Mirror - Full Width */}
          <BlindSpotMirror />

          {/* Knowledge Autopsy - Full Width */}
          <KnowledgeAutopsy />

          {/* Weekly Achievements - Full Width */}
          <WeeklyAchievements />


          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subjects Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <BookOpen className="w-5 h-5 text-primary" />
                  </motion.div>
                  <h2 className="font-heading font-semibold text-xl">Your Subjects</h2>
                </div>
                <Link to="/subjects" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline group">
                  View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  </motion.div>
                  <p>No subjects found for your class.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.slice(0, 6).map((subject, index) => {
                    const IconComponent = subject.IconComponent;
                    const colors = colorClasses[subject.color] || colorClasses.primary;
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={cn(
                          "group bg-muted/30 backdrop-blur-sm rounded-xl p-4 cursor-pointer border transition-all duration-300",
                          "hover:bg-muted/50 hover:shadow-lg",
                          colors.border
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div 
                            className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-sm", colors.bg)}
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.3 }}
                          >
                            <IconComponent className="w-5 h-5 text-primary-foreground" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">
                              NCTB Curriculum
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className={cn("font-semibold", colors.text)}>{subject.progress}%</span>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn("absolute inset-y-0 left-0 rounded-full", colors.bg)}
                              initial={{ width: 0 }}
                              animate={{ width: `${subject.progress}%` }}
                              transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Revision Reminders */}
              <RevisionReminders />

              {/* Continue Learning */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent rounded-2xl p-6 text-primary-foreground shadow-xl"
              >
                {/* Animated background elements */}
                <motion.div
                  className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Brain className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <p className="text-primary-foreground/80 text-sm">Start Learning</p>
                      <p className="font-heading font-semibold text-lg">AI Tutor</p>
                    </div>
                  </div>
                  <p className="text-primary-foreground/80 text-sm mb-4">
                    Ask questions about any NCTB subject
                  </p>
                  <Button 
                    className="w-full bg-white/20 hover:bg-white/30 border-white/30 text-primary-foreground backdrop-blur-sm shadow-lg" 
                    asChild
                  >
                    <Link to="/tutor">
                      <Play className="w-4 h-4 mr-2" />
                      Start Session
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Progress Visualization Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ProgressVisualization 
              refreshKey={progressRefreshKey} 
              onRefresh={() => {
                setIsRefreshing(true);
                setProgressRefreshKey(prev => prev + 1);
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              isRefreshing={isRefreshing}
            />
          </motion.div>

          {/* Daily Notification Trigger (invisible component) */}
          <DailyNotificationTrigger />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
