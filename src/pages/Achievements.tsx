import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Trophy,
  Star,
  Flame,
  Zap,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Compass,
  Medal,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle,
  Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

interface UserProgress {
  study_sessions: number;
  assessments: number;
  streak_days: number;
  total_xp: number;
  topics_studied: number;
}

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  target: Target,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  compass: Compass,
  medal: Medal,
  "trending-up": TrendingUp,
  footprints: Footprints,
};

const categoryColors: Record<string, string> = {
  beginner: "bg-success/10 text-success border-success/20",
  learning: "bg-primary/10 text-primary border-primary/20",
  assessment: "bg-accent/10 text-accent border-accent/20",
  achievement: "bg-warning/10 text-warning border-warning/20",
  streak: "bg-destructive/10 text-destructive border-destructive/20",
  xp: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  exploration: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  mastery: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  bloom: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    study_sessions: 0,
    assessments: 0,
    streak_days: 0,
    total_xp: 0,
    topics_studied: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Fetch all achievements
        const { data: achievementsData } = await supabase
          .from("achievements")
          .select("*")
          .order("category", { ascending: true });

        if (achievementsData) {
          setAchievements(achievementsData);
        }

        // Fetch user's earned achievements
        const { data: userAchievementsData } = await supabase
          .from("user_achievements")
          .select("achievement_id, earned_at")
          .eq("user_id", user.id);

        if (userAchievementsData) {
          setUserAchievements(userAchievementsData);
        }

        // Fetch user progress data
        const [sessionsRes, assessmentsRes, statsRes, topicsRes] = await Promise.all([
          supabase.from("study_sessions").select("id").eq("user_id", user.id),
          supabase.from("assessments").select("id").eq("user_id", user.id),
          supabase.from("student_stats").select("current_streak, total_xp").eq("user_id", user.id).maybeSingle(),
          supabase.from("topic_mastery").select("id").eq("user_id", user.id),
        ]);

        setUserProgress({
          study_sessions: sessionsRes.data?.length || 0,
          assessments: assessmentsRes.data?.length || 0,
          streak_days: statsRes.data?.current_streak || 0,
          total_xp: statsRes.data?.total_xp || 0,
          topics_studied: topicsRes.data?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const isEarned = (achievementId: string) =>
    userAchievements.some((ua) => ua.achievement_id === achievementId);

  const getProgress = (achievement: Achievement): number => {
    let current = 0;
    switch (achievement.requirement_type) {
      case "study_sessions":
        current = userProgress.study_sessions;
        break;
      case "assessments":
        current = userProgress.assessments;
        break;
      case "streak_days":
        current = userProgress.streak_days;
        break;
      case "total_xp":
        current = userProgress.total_xp;
        break;
      case "topics_studied":
        current = userProgress.topics_studied;
        break;
      default:
        current = 0;
    }
    return Math.min(100, Math.round((current / achievement.requirement_value) * 100));
  };

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const totalXPEarned = achievements
    .filter((a) => isEarned(a.id))
    .reduce((sum, a) => sum + a.xp_reward, 0);

  const categories = [...new Set(achievements.map((a) => a.category))];

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-xl">Achievements</h1>
            <p className="text-sm text-muted-foreground">Track your learning milestones</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{earnedCount}/{totalCount}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{totalXPEarned}</p>
              <p className="text-sm text-muted-foreground">XP from Badges</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">{userProgress.streak_days}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">{Math.round((earnedCount / totalCount) * 100)}%</p>
              <p className="text-sm text-muted-foreground">Completion</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement Categories */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  earned={isEarned(achievement.id)}
                  progress={getProgress(achievement)}
                  delay={index * 0.05}
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements
                  .filter((a) => a.category === cat)
                  .map((achievement, index) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      earned={isEarned(achievement.id)}
                      progress={getProgress(achievement)}
                      delay={index * 0.05}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
  progress: number;
  delay: number;
}

const AchievementCard = ({ achievement, earned, progress, delay }: AchievementCardProps) => {
  const IconComponent = iconMap[achievement.icon] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all",
          earned
            ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
            : "opacity-80"
        )}
      >
        {earned && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                earned
                  ? categoryColors[achievement.category] || "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {earned ? (
                <IconComponent className="w-7 h-7" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn("font-semibold truncate", !earned && "text-muted-foreground")}>
                  {achievement.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {achievement.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn("text-xs", categoryColors[achievement.category])}>
                  +{achievement.xp_reward} XP
                </Badge>
                {!earned && (
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                )}
              </div>
              {!earned && (
                <Progress value={progress} className="h-1.5 mt-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Achievements;