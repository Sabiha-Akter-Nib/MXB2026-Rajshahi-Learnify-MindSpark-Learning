import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
const colorMap: Record<string, string> = {
  'primary': 'bg-primary',
  'accent': 'bg-accent',
  'warning': 'bg-warning',
  'success': 'bg-success',
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithProgress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

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
          setStats(statsData);
        }

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
            (progressData || []).map(p => [p.subject_id, p])
          );

          const subjectsWithProgress: SubjectWithProgress[] = subjectsData.map(subject => {
            const progress = progressMap.get(subject.id);
            const completed = progress?.chapters_completed || 0;
            const percentage = Math.round((completed / subject.total_chapters) * 100);
            
            return {
              ...subject,
              progress: percentage,
              completed,
              IconComponent: iconMap[subject.icon] || BookOpen,
            };
          });

          setSubjects(subjectsWithProgress);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name?.split(" ")[0] || "Student";
  const classText = profile?.class ? `Class ${profile.class}` : "";
  const versionText = profile?.version === "bangla" ? "বাংলা" : "English";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col fixed h-screen z-40"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-heading font-bold text-lg"
            >
              MindSpark
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: BarChart3, label: "Dashboard", active: true, href: "/dashboard" },
            { icon: BookOpen, label: "Subjects", href: "/subjects" },
            { icon: Brain, label: "AI Tutor", href: "/tutor" },
            { icon: Target, label: "Practice", href: "/practice" },
            { icon: Award, label: "Achievements", href: "/achievements" },
            { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
            { icon: Calendar, label: "Schedule", href: "/learning-plan" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all", sidebarOpen ? "ml-[280px]" : "ml-20")}>
        {/* Top Bar */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="font-heading font-bold text-2xl">
                  Welcome back, {displayName}! 👋
                </h1>
                <p className="text-muted-foreground text-sm">
                  {classText} • {versionText} Version
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-semibold text-accent">{stats?.current_streak || 0} Day Streak</span>
              </div>

              {/* Profile */}
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: "Total XP", value: (stats?.total_xp || 0).toLocaleString(), color: "primary" },
              { icon: Flame, label: "Day Streak", value: stats?.current_streak || 0, color: "accent" },
              { icon: Target, label: "Weekly Goal", value: "0/70%", color: "success" },
              { icon: Clock, label: "Study Time", value: formatStudyTime(stats?.total_study_minutes || 0), color: "warning" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-5 border border-border shadow-sm card-hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      stat.color === "primary" && "bg-primary/10 text-primary",
                      stat.color === "accent" && "bg-accent/10 text-accent",
                      stat.color === "success" && "bg-success/10 text-success",
                      stat.color === "warning" && "bg-warning/10 text-warning"
                    )}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="font-heading font-bold text-2xl">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subjects Progress */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-xl">Your Subjects</h2>
                <Link to="/subjects" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No subjects found for your class.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.slice(0, 6).map((subject, index) => {
                    const IconComponent = subject.IconComponent;
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[subject.color] || "bg-primary")}>
                            <IconComponent className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {subject.completed}/{subject.total_chapters} chapters
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{subject.progress}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Revision Reminders */}
              <RevisionReminders />

              {/* Continue Learning */}
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-primary-foreground">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Start Learning</p>
                    <p className="font-heading font-semibold">AI Tutor</p>
                  </div>
                </div>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Ask questions about any NCTB subject
                </p>
                <Button variant="glass" className="w-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" asChild>
                  <Link to="/tutor">
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Visualization Section */}
          <Tabs defaultValue="progress" className="space-y-4">
            <TabsList>
              <TabsTrigger value="progress">Progress Charts</TabsTrigger>
              <TabsTrigger value="tips">Learning Tips</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress">
              <ProgressVisualization />
            </TabsContent>
            
            <TabsContent value="tips">
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4">Quick Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Study daily</p>
                      <p className="text-sm text-muted-foreground">Build your streak for XP bonus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Ask the AI Tutor</p>
                      <p className="text-sm text-muted-foreground">Get help with any topic</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Complete chapters</p>
                      <p className="text-sm text-muted-foreground">Earn XP and achievements</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
