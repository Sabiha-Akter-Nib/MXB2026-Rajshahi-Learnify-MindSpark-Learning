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
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  class: number;
  version: string;
}

const subjects = [
  { icon: BookText, name: "Bangla 1st Paper", progress: 65, color: "bg-primary", chapters: 12, completed: 8 },
  { icon: Languages, name: "English 1st Paper", progress: 78, color: "bg-accent", chapters: 10, completed: 8 },
  { icon: Calculator, name: "Mathematics", progress: 42, color: "bg-warning", chapters: 15, completed: 6 },
  { icon: Atom, name: "General Science", progress: 55, color: "bg-success", chapters: 14, completed: 8 },
  { icon: Globe, name: "BGS", progress: 30, color: "bg-primary-light", chapters: 12, completed: 4 },
  { icon: Laptop, name: "ICT", progress: 88, color: "bg-accent", chapters: 8, completed: 7 },
];

const recentActivities = [
  { subject: "Mathematics", topic: "Quadratic Equations", time: "2 hours ago", score: 85 },
  { subject: "English", topic: "Tenses Practice", time: "Yesterday", score: 92 },
  { subject: "Science", topic: "Photosynthesis", time: "2 days ago", score: 78 },
];

const upcomingTasks = [
  { subject: "Mathematics", task: "Complete Chapter 5 Practice", due: "Today" },
  { subject: "Bangla", task: "Read Poem: Kobita", due: "Tomorrow" },
  { subject: "Science", task: "Lab Report Submission", due: "In 3 days" },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, class, version")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
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
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: BookOpen, label: "Subjects" },
            { icon: Brain, label: "AI Tutor" },
            { icon: Target, label: "Practice" },
            { icon: Award, label: "Achievements" },
            { icon: Calendar, label: "Schedule" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.label === "AI Tutor" ? "/tutor" : "#"}
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
            to="#"
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
                <span className="font-semibold text-accent">0 Day Streak</span>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: "Total XP", value: "0", color: "primary" },
              { icon: Flame, label: "Day Streak", value: 0, color: "accent" },
              { icon: Target, label: "Weekly Goal", value: "0/70%", color: "success" },
              { icon: Clock, label: "Study Time", value: "0h 0m", color: "warning" },
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject, index) => {
                  const IconComponent = subject.icon;
                  return (
                    <motion.div
                      key={subject.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", subject.color)}>
                          <IconComponent className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{subject.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.completed}/{subject.chapters} chapters
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
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Continue Learning */}
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-primary-foreground">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Continue Learning</p>
                    <p className="font-heading font-semibold">Mathematics</p>
                  </div>
                </div>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Chapter 5: Quadratic Equations - Lesson 3
                </p>
                <Button variant="glass" className="w-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" asChild>
                  <Link to="/tutor">
                    <Play className="w-4 h-4 mr-2" />
                    Resume Lesson
                  </Link>
                </Button>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4">Upcoming Tasks</h3>
                <div className="space-y-3">
                  {upcomingTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.task}</p>
                        <p className="text-xs text-muted-foreground">{task.subject} • {task.due}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.topic}</p>
                        <p className="text-xs text-muted-foreground">{activity.subject} • {activity.time}</p>
                      </div>
                      <div className="flex items-center gap-1 text-success font-semibold text-sm">
                        <TrendingUp className="w-4 h-4" />
                        {activity.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
