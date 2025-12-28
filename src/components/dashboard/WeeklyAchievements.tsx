import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Flame, 
  Target, 
  Clock,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type WeeklyAchievement = {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  icon: string;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  xp_reward: number;
};

const iconMap: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  "book-open": BookOpen,
  "flame": Flame,
  "target": Target,
  "clock": Clock,
  "trophy": Trophy,
};

const WeeklyAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<WeeklyAchievement[]>([]);
  const [weeklyXP, setWeeklyXP] = useState(0);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBangla, setIsBangla] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchWeeklyAchievements = async () => {
      setIsLoading(true);
      try {
        // Get user profile for language
        const { data: profile } = await supabase
          .from("profiles")
          .select("version")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsBangla(profile?.version === "bangla");

        // Call edge function to initialize/update weekly achievements
        const { data, error } = await supabase.functions.invoke("init-weekly-achievements");

        if (error) {
          console.error("Error fetching weekly achievements:", error);
          return;
        }

        if (data) {
          setAchievements(data.achievements || []);
          setWeeklyXP(data.weekly_xp || 0);
          setWeekStart(data.week_start || null);
        }
      } catch (e) {
        console.error("WeeklyAchievements error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyAchievements();
  }, [user]);

  const completedCount = achievements.filter((a) => a.is_completed).length;
  const totalXPReward = achievements
    .filter((a) => a.is_completed)
    .reduce((sum, a) => sum + a.xp_reward, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-6 shadow-xl"
      aria-label={isBangla ? "সাপ্তাহিক অর্জন" : "Weekly Achievements"}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-warning/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-accent flex items-center justify-center shadow-lg shadow-warning/10">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {isBangla ? "সাপ্তাহিক অর্জন" : "Weekly Achievements"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla
                ? `প্রতি সপ্তাহে রিসেট হয় • ${completedCount}/${achievements.length} সম্পন্ন`
                : `Resets every week • ${completedCount}/${achievements.length} completed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">
            {weeklyXP} XP
          </span>
        </div>
      </header>

      <div className="relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground text-center">
            {isBangla
              ? "সাপ্তাহিক চ্যালেঞ্জ লোড হচ্ছে..."
              : "Loading weekly challenges..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((achievement, index) => {
              const IconComponent = iconMap[achievement.icon] || Trophy;
              const progress = Math.round(
                (achievement.current_value / achievement.target_value) * 100
              );

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative rounded-xl border p-4 transition-all duration-300",
                    achievement.is_completed
                      ? "bg-success/10 border-success/30"
                      : "bg-background/40 border-border/40 hover:bg-muted/30"
                  )}
                >
                  {achievement.is_completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        achievement.is_completed
                          ? "bg-success/20"
                          : "bg-primary/10"
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "w-4 h-4",
                          achievement.is_completed ? "text-success" : "text-primary"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {achievement.achievement_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {achievement.achievement_description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {achievement.current_value}/{achievement.target_value}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          achievement.is_completed ? "text-success" : "text-accent"
                        )}
                      >
                        +{achievement.xp_reward} XP
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn(
                        "h-1.5",
                        achievement.is_completed && "[&>div]:bg-success"
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {totalXPReward > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3"
          >
            <Sparkles className="w-4 h-4 text-success" />
            <p className="text-sm font-medium text-success">
              {isBangla
                ? `এই সপ্তাহে ${totalXPReward} XP অর্জন করেছ!`
                : `Earned ${totalXPReward} XP from weekly achievements!`}
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default WeeklyAchievements;
