import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Target, Brain, Award, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BloomProgress {
  level: string;
  count: number;
  color: string;
}

interface XPHistory {
  date: string;
  xp: number;
}

interface TopicMastery {
  topic: string;
  mastery: number;
  subject: string;
}

const BLOOM_COLORS = {
  remember: "#3B82F6",
  understand: "#22C55E",
  apply: "#EAB308",
  analyze: "#F97316",
  evaluate: "#EF4444",
  create: "#A855F7",
};

// Glowing card wrapper component
const GlowCard = ({ 
  children, 
  color = "primary",
  className = "",
  index = 0,
}: { 
  children: React.ReactNode; 
  color?: string;
  className?: string;
  index?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        "bg-card/70 border-border/50",
        "shadow-xl transition-all duration-500",
        className
      )}
      style={{
        boxShadow: isHovered 
          ? `0 25px 60px -15px hsl(var(--${color}) / 0.3), 0 0 30px -10px hsl(var(--${color}) / 0.2)`
          : undefined,
      }}
    >
      {/* Glowing orb */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: `hsl(var(--${color}) / 0.1)` }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: isHovered ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full pointer-events-none"
        animate={{ translateX: isHovered ? "200%" : "-100%" }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      
      {children}
    </motion.div>
  );
};

// Animated icon with jump and underline
const AnimatedIcon = ({ 
  icon: Icon, 
  color,
  isHovered,
}: { 
  icon: React.ElementType;
  color: string;
  isHovered: boolean;
}) => {
  return (
    <div className="relative">
      <motion.div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          `bg-${color}/10`
        )}
        style={{
          backgroundColor: `hsl(var(--${color}) / 0.1)`,
          color: `hsl(var(--${color}))`,
        }}
        animate={isHovered ? { y: [0, -10, 0], scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-6 h-6" />
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{ 
            boxShadow: isHovered 
              ? `0 0 20px 3px hsl(var(--${color}) / 0.4)` 
              : "0 0 0 0 transparent" 
          }}
        />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 left-0 h-1 rounded-full"
        style={{ background: `hsl(var(--${color}))` }}
        initial={{ width: 0 }}
        animate={{ width: isHovered ? "100%" : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// Stats mini card with animations
const StatsMiniCard = ({
  icon,
  label,
  value,
  color,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 border backdrop-blur-sm",
        "bg-card/60 border-border/40",
        "transition-all duration-300"
      )}
      style={{
        boxShadow: isHovered 
          ? `0 15px 40px -10px hsl(var(--${color}) / 0.25)` 
          : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <AnimatedIcon icon={icon} color={color} isHovered={isHovered} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold" style={{ color: `hsl(var(--${color}))` }}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ProgressVisualization = ({ 
  refreshKey = 0, 
  onRefresh,
  isRefreshing = false 
}: { 
  refreshKey?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) => {
  const [bloomProgress, setBloomProgress] = useState<BloomProgress[]>([]);
  const [xpHistory, setXpHistory] = useState<XPHistory[]>([]);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  // Re-trigger animations when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      setAnimationKey(prev => prev + 1);
    }
  }, [refreshKey]);

  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      const { data: assessments } = await supabase
        .from("assessments")
        .select("bloom_level, xp_earned, completed_at")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: true });

      const bloomCounts: Record<string, number> = {
        remember: 0,
        understand: 0,
        apply: 0,
        analyze: 0,
        evaluate: 0,
        create: 0,
      };

      assessments?.forEach((a) => {
        if (a.bloom_level && bloomCounts[a.bloom_level] !== undefined) {
          bloomCounts[a.bloom_level]++;
        }
      });

      setBloomProgress(
        Object.entries(bloomCounts).map(([level, count]) => ({
          level: level.charAt(0).toUpperCase() + level.slice(1),
          count,
          color: BLOOM_COLORS[level as keyof typeof BLOOM_COLORS],
        }))
      );

      const xpByDay: Record<string, number> = {};
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        last7Days.push(dateStr);
        xpByDay[dateStr] = 0;
      }

      assessments?.forEach((a) => {
        const dateStr = new Date(a.completed_at).toISOString().split("T")[0];
        if (xpByDay[dateStr] !== undefined) {
          xpByDay[dateStr] += a.xp_earned;
        }
      });

      setXpHistory(
        last7Days.map((date) => ({
          date: new Date(date).toLocaleDateString("en", { weekday: "short" }),
          xp: xpByDay[date],
        }))
      );

      const { data: mastery } = await supabase
        .from("topic_mastery")
        .select("topic_name, mastery_score, subjects(name)")
        .eq("user_id", user?.id)
        .order("mastery_score", { ascending: false })
        .limit(10);

      setTopicMastery(
        mastery?.map((m) => ({
          topic: m.topic_name,
          mastery: m.mastery_score,
          subject: (m.subjects as any)?.name || "General",
        })) || []
      );
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-80 bg-muted/50 rounded-2xl" />
        ))}
      </div>
    );
  }

  const totalAssessments = bloomProgress.reduce((sum, b) => sum + b.count, 0);
  const totalXP = xpHistory.reduce((sum, x) => sum + x.xp, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsMiniCard icon={TrendingUp} label="Weekly XP" value={totalXP} color="primary" index={0} />
        <StatsMiniCard icon={Target} label="Assessments" value={totalAssessments} color="success" index={1} />
        <StatsMiniCard icon={Brain} label="Topics Tracked" value={topicMastery.length} color="accent" index={2} />
        <StatsMiniCard icon={Award} label="Avg Mastery" value={`${topicMastery.length > 0 ? Math.round(topicMastery.reduce((s, t) => s + t.mastery, 0) / topicMastery.length) : 0}%`} color="warning" index={3} />
      </div>

      {/* All 3 charts displayed at once in a grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP History Chart */}
        <GlowCard color="primary" index={0} className="h-80">
          <div className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="w-4 h-4" />
              </motion.div>
              <h3 className="font-semibold text-lg">XP History</h3>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xpHistory}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="hsl(var(--primary))"
                    fill="url(#xpGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Bloom Levels Chart */}
        <GlowCard color="accent" index={1} className="h-80">
          <div className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <h3 className="font-semibold text-lg">Bloom Levels</h3>
              </div>
              {onRefresh && (
                <motion.button
                  onClick={onRefresh}
                  className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Refresh animations"
                >
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={{ duration: 0.8, ease: "linear", repeat: isRefreshing ? Infinity : 0 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              )}
            </div>
            
            {/* Animated Bloom Level Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {bloomProgress.map((bloom, index) => (
                <motion.div
                  key={`${bloom.level}-${animationKey}`}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3 + index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    y: -3,
                    boxShadow: `0 8px 25px -5px ${bloom.color}40`
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-white cursor-default"
                  style={{ 
                    backgroundColor: bloom.color,
                    boxShadow: `0 2px 10px -2px ${bloom.color}50`
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {bloom.level}: {bloom.count}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            <div className="flex-1 flex items-center justify-center">
              {totalAssessments > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bloomProgress.filter((b) => b.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="count"
                      nameKey="level"
                      labelLine={false}
                    >
                      {bloomProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Complete assessments to see progress</p>
                </div>
              )}
            </div>
          </div>
        </GlowCard>

        {/* Topic Mastery Chart */}
        <GlowCard color="success" index={2} className="h-80">
          <div className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Target className="w-4 h-4" />
                </motion.div>
                <h3 className="font-semibold text-lg">Mastery</h3>
              </div>
              {onRefresh && (
                <motion.button
                  onClick={onRefresh}
                  className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Refresh animations"
                >
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={{ duration: 0.8, ease: "linear", repeat: isRefreshing ? Infinity : 0 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {topicMastery.length > 0 ? (
                <div className="space-y-3">
                  {topicMastery.slice(0, 5).map((topic, index) => (
                    <motion.div
                      key={`${topic.topic}-${animationKey}`}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.4 + index * 0.12,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="space-y-1"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <motion.span 
                          className="font-medium truncate max-w-[140px]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.12 }}
                        >
                          {topic.topic}
                        </motion.span>
                        <motion.span 
                          className="text-success font-bold"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.7 + index * 0.12,
                            type: "spring",
                            stiffness: 300
                          }}
                        >
                          {topic.mastery}%
                        </motion.span>
                      </div>
                      <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          key={`bar-${topic.topic}-${animationKey}`}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.mastery}%` }}
                          transition={{ 
                            delay: 0.5 + index * 0.12,
                            duration: 0.8,
                            ease: "easeOut"
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Practice to see mastery scores</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
};

export default ProgressVisualization;
