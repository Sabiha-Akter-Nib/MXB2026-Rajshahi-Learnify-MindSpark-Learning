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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Brain, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

const ProgressVisualization = () => {
  const [bloomProgress, setBloomProgress] = useState<BloomProgress[]>([]);
  const [xpHistory, setXpHistory] = useState<XPHistory[]>([]);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      // Fetch assessments for Bloom level progress
      const { data: assessments } = await supabase
        .from("assessments")
        .select("bloom_level, xp_earned, completed_at")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: true });

      // Calculate Bloom level distribution
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

      // Calculate XP history by day (last 7 days)
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

      // Fetch topic mastery
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
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  const totalAssessments = bloomProgress.reduce((sum, b) => sum + b.count, 0);
  const totalXP = xpHistory.reduce((sum, x) => sum + x.xp, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly XP</p>
                <p className="text-xl font-bold">{totalXP}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assessments</p>
                <p className="text-xl font-bold">{totalAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Topics Tracked</p>
                <p className="text-xl font-bold">{topicMastery.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Mastery</p>
                <p className="text-xl font-bold">
                  {topicMastery.length > 0
                    ? Math.round(topicMastery.reduce((s, t) => s + t.mastery, 0) / topicMastery.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="xp" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="xp">XP History</TabsTrigger>
          <TabsTrigger value="bloom">Bloom Levels</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
        </TabsList>

        <TabsContent value="xp">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">XP Earned This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpHistory}>
                    <defs>
                      <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="hsl(var(--primary))"
                      fill="url(#xpGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloom">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bloom's Taxonomy Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {totalAssessments > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bloomProgress.filter((b) => b.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="level"
                        label={({ level, count }) => `${level}: ${count}`}
                      >
                        {bloomProgress.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">Complete assessments to see your Bloom level progress</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mastery">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topic Mastery Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {topicMastery.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicMastery.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="topic"
                        width={120}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + "..." : value}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="mastery" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Practice topics to see mastery scores</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressVisualization;
