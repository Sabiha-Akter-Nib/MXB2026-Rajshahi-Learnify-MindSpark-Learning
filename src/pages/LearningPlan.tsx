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
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardBackground from "@/components/dashboard/DashboardBackground";

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

interface Subject {
  id: string;
  name: string;
  name_bn: string;
}

interface ChapterInput {
  subjectId: string;
  chapterName: string;
}

const BLOOM_LEVELS = [
  { value: "remember", label: "Remember" },
  { value: "understand", label: "Understand" },
  { value: "apply", label: "Apply" },
  { value: "analyze", label: "Analyze" },
  { value: "evaluate", label: "Evaluate" },
  { value: "create", label: "Create" },
];

const PLAN_TYPES = [
  { value: "daily", label: "Daily Plan" },
  { value: "weekly", label: "Weekly Plan" },
];

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedBloomLevel, setSelectedBloomLevel] = useState("remember");
  const [selectedPlanType, setSelectedPlanType] = useState("weekly");
  const [chapterInputs, setChapterInputs] = useState<ChapterInput[]>([
    { subjectId: "", chapterName: "" },
    { subjectId: "", chapterName: "" },
    { subjectId: "", chapterName: "" },
    { subjectId: "", chapterName: "" },
    { subjectId: "", chapterName: "" },
  ]);

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
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("class")
      .eq("user_id", user?.id)
      .single();

    const studentClass = profile?.class || 5;

    const { data } = await supabase
      .from("subjects")
      .select("id, name, name_bn")
      .lte("min_class", studentClass)
      .gte("max_class", studentClass);

    setSubjects(data || []);
  };

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

  const updateChapterInput = (index: number, field: keyof ChapterInput, value: string) => {
    const updated = [...chapterInputs];
    updated[index] = { ...updated[index], [field]: value };
    setChapterInputs(updated);
  };

  const isFormValid = () => {
    // At least one chapter with both subject and chapter name filled
    return chapterInputs.some(
      (input) => input.subjectId && input.chapterName.trim()
    );
  };

  const generatePlan = async () => {
    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in at least one chapter with subject and chapter name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Filter only filled chapter inputs
      const validChapters = chapterInputs.filter(
        (input) => input.subjectId && input.chapterName.trim()
      );

      const { data, error } = await supabase.functions.invoke("generate-learning-plan", {
        body: {
          userId: user?.id,
          chapters: validChapters.map((ch) => ({
            subjectId: ch.subjectId,
            subjectName: subjects.find((s) => s.id === ch.subjectId)?.name || "",
            chapterName: ch.chapterName.trim(),
          })),
          bloomLevel: selectedBloomLevel,
          planType: selectedPlanType,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setActivePlan(data.plan);
      setTasks(data.tasks || []);

      toast({
        title: "Plan Created!",
        description: `${data.tasks?.length || 0} quizzes generated at ${selectedBloomLevel} level.`,
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

  const resetPlan = async () => {
    if (activePlan) {
      await supabase
        .from("learning_plans")
        .update({ status: "completed" })
        .eq("id", activePlan.id);
    }
    setActivePlan(null);
    setTasks([]);
    setChapterInputs([
      { subjectId: "", chapterName: "" },
      { subjectId: "", chapterName: "" },
      { subjectId: "", chapterName: "" },
      { subjectId: "", chapterName: "" },
      { subjectId: "", chapterName: "" },
    ]);
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

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: !currentStatus } : t
        )
      );

      if (!currentStatus) {
        toast({
          title: "Task Completed!",
          description: "Keep up the great work!",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const totalXpTarget = tasks.reduce((sum, t) => sum + t.target_xp, 0);
  const earnedXp = tasks
    .filter((t) => t.is_completed)
    .reduce((sum, t) => sum + t.target_xp, 0);
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <DashboardBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3 relative">
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

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {!activePlan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 bg-white/95 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Create Your Learning Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Enter up to 5 chapters from different subjects. We'll generate
                  quizzes based on your selected Bloom's Taxonomy level.
                </p>

                {/* Plan Type Selection */}
                <div className="space-y-2">
                  <Label>Select Plan Type</Label>
                  <Select
                    value={selectedPlanType}
                    onValueChange={setSelectedPlanType}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bloom's Level Selection */}
                <div className="space-y-2">
                  <Label>Select Bloom's Taxonomy Level</Label>
                  <Select
                    value={selectedBloomLevel}
                    onValueChange={setSelectedBloomLevel}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOM_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-3 h-3 rounded-full",
                                BLOOM_COLORS[level.value]
                              )}
                            />
                            {level.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chapter Inputs */}
                <div className="space-y-4">
                  <Label>Enter Chapters (at least 1 required)</Label>
                  {chapterInputs.map((input, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground min-w-[2rem]">
                        <span className="font-medium">{index + 1}.</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Select
                          value={input.subjectId}
                          onValueChange={(value) =>
                            updateChapterInput(index, "subjectId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-[2]">
                        <Input
                          placeholder="Enter chapter name..."
                          value={input.chapterName}
                          onChange={(e) =>
                            updateChapterInput(index, "chapterName", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={generatePlan}
                  disabled={isGenerating || !isFormValid()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Learning Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm border-white/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold capitalize">
                      {activePlan.plan_type} Plan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activePlan.start_date).toLocaleDateString()} -{" "}
                      {new Date(activePlan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPlan}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Plan
                  </Button>
                </div>

                <Progress value={progress} className="h-3 mb-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedTasks} of {tasks.length} quizzes completed
                  </span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">
                      {earnedXp}/{totalXpTarget} XP
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks/Quizzes */}
            <div className="space-y-3 mb-8">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      "transition-all bg-white/95 backdrop-blur-sm",
                      task.is_completed ? "border-success/30" : "border-white/30"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() =>
                            toggleTaskComplete(task.id, task.is_completed)
                          }
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
                              <p
                                className={cn(
                                  "font-medium",
                                  task.is_completed &&
                                    "line-through text-muted-foreground"
                                )}
                              >
                                {task.topic}
                              </p>
                              {task.subjects && (
                                <p className="text-sm text-muted-foreground">
                                  {task.subjects.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded text-white capitalize",
                                  BLOOM_COLORS[task.bloom_level] || "bg-gray-500"
                                )}
                              >
                                {task.bloom_level}
                              </span>
                              <span className="text-sm font-medium text-primary">
                                +{task.target_xp} XP
                              </span>
                            </div>
                          </div>

                          {!task.is_completed && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  to={`/tutor?topic=${encodeURIComponent(
                                    task.topic
                                  )}`}
                                >
                                  <Brain className="w-4 h-4 mr-1" />
                                  Study
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link
                                  to={`/assessment?topic=${encodeURIComponent(
                                    task.topic
                                  )}&bloomLevel=${task.bloom_level}&subjectId=${task.subjects ? subjects.find(s => s.name === task.subjects?.name)?.id || '' : ''}&chapterName=${encodeURIComponent(task.topic)}&subjectName=${encodeURIComponent(task.subjects?.name || '')}&fromPlan=true`}
                                >
                                  <Target className="w-4 h-4 mr-1" />
                                  Take Quiz
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
      </main>
    </div>
  );
};

export default LearningPlanPage;
