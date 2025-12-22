import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  RefreshCw,
  BookOpen,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanTask {
  id: string;
  topic: string;
  bloom_level: string;
  target_xp: number;
  is_completed: boolean;
  priority: number;
  subjects?: { name: string; name_bn: string } | null;
}

interface LearningPlan {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

const BLOOM_COLORS: Record<string, string> = {
  remember: "bg-blue-500",
  understand: "bg-green-500",
  apply: "bg-yellow-500",
  analyze: "bg-orange-500",
  evaluate: "bg-red-500",
  create: "bg-purple-500",
};

const LearningPlanPage = () => {
  const [activePlan, setActivePlan] = useState<LearningPlan | null>(null);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchActivePlan();
      fetchWeakTopics();
    }
  }, [user]);

  const fetchActivePlan = async () => {
    setIsLoading(true);
    try {
      const { data: plans } = await supabase
        .from("learning_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (plans && plans.length > 0) {
        setActivePlan(plans[0]);
        
        const { data: planTasks } = await supabase
          .from("learning_plan_tasks")
          .select("*, subjects(name, name_bn)")
          .eq("plan_id", plans[0].id)
          .order("priority");

        setTasks(planTasks || []);
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeakTopics = async () => {
    const { data } = await supabase
      .from("topic_mastery")
      .select("*, subjects(name, name_bn)")
      .eq("user_id", user?.id)
      .eq("is_weak_topic", true)
      .order("mastery_score", { ascending: true })
      .limit(5);

    setWeakTopics(data || []);
  };

  const generatePlan = async (planType: "daily" | "weekly") => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-learning-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            planType,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setActivePlan(data.plan);
      setTasks(data.tasks || []);

      toast({
        title: "Plan Created!",
        description: data.message,
      });
    } catch (error) {
      console.error("Error generating plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate learning plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("learning_plan_tasks")
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, is_completed: !currentStatus } : t
      ));

      if (!currentStatus) {
        toast({
          title: "Task Completed!",
          description: "Keep up the great work! 🎉",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalXpTarget = tasks.reduce((sum, t) => sum + t.target_xp, 0);
  const earnedXp = tasks.filter(t => t.is_completed).reduce((sum, t) => sum + t.target_xp, 0);
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-semibold">Learning Plan</h1>
              <p className="text-xs text-muted-foreground">
                Personalized study schedule
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {!activePlan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Active Plan</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Generate a personalized learning plan based on your progress and weak areas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => generatePlan("daily")}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Calendar className="w-5 h-5 mr-2" />
                )}
                Generate Daily Plan
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => generatePlan("weekly")}
                disabled={isGenerating}
              >
                Generate Weekly Plan
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold capitalize">
                      {activePlan.plan_type} Plan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activePlan.start_date).toLocaleDateString()} - {new Date(activePlan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePlan(activePlan.plan_type as "daily" | "weekly")}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                    Regenerate
                  </Button>
                </div>

                <Progress value={progress} className="h-3 mb-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedTasks} of {tasks.length} tasks completed
                  </span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{earnedXp}/{totalXpTarget} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <div className="space-y-3 mb-8">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    "transition-all",
                    task.is_completed && "bg-success/5 border-success/30"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                          className="mt-1"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-6 h-6 text-success" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={cn(
                                "font-medium",
                                task.is_completed && "line-through text-muted-foreground"
                              )}>
                                {task.topic}
                              </p>
                              {task.subjects && (
                                <p className="text-sm text-muted-foreground">
                                  {task.subjects.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded text-white capitalize",
                                BLOOM_COLORS[task.bloom_level] || "bg-gray-500"
                              )}>
                                {task.bloom_level}
                              </span>
                              <span className="text-sm font-medium text-primary">
                                +{task.target_xp} XP
                              </span>
                            </div>
                          </div>

                          {!task.is_completed && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <Link to={`/tutor?topic=${encodeURIComponent(task.topic)}`}>
                                  <Brain className="w-4 h-4 mr-1" />
                                  Study
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                asChild
                              >
                                <Link to={`/assessment?topic=${encodeURIComponent(task.topic)}`}>
                                  <Target className="w-4 h-4 mr-1" />
                                  Practice
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Weak Topics Section */}
        {weakTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-destructive" />
                Weak Areas to Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{topic.topic_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {topic.subjects?.name} • Mastery: {topic.mastery_score}%
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/assessment?topic=${encodeURIComponent(topic.topic_name)}&subject=${topic.subject_id}`}>
                      Practice
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default LearningPlanPage;
