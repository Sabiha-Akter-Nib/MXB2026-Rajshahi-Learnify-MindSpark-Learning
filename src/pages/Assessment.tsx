import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  Loader2,
  ArrowRight,
  RotateCcw,
  Target,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpValue: number;
}

interface AssessmentResult {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

const BLOOM_LEVELS = [
  { id: "remember", label: "Remember", labelBn: "মনে রাখা", color: "bg-blue-500" },
  { id: "understand", label: "Understand", labelBn: "বোঝা", color: "bg-green-500" },
  { id: "apply", label: "Apply", labelBn: "প্রয়োগ", color: "bg-yellow-500" },
  { id: "analyze", label: "Analyze", labelBn: "বিশ্লেষণ", color: "bg-orange-500" },
  { id: "evaluate", label: "Evaluate", labelBn: "মূল্যায়ন", color: "bg-red-500" },
  { id: "create", label: "Create", labelBn: "সৃষ্টি", color: "bg-purple-500" },
];

const Assessment = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{
    results: AssessmentResult[];
    score: number;
    xpEarned: number;
    shouldLevelUp: boolean;
    nextLevel: string;
  } | null>(null);
  const [bloomLevel, setBloomLevel] = useState("remember");
  const [bloomLevelIndex, setBloomLevelIndex] = useState(0);
  const [noTutorContext, setNoTutorContext] = useState(false);
  const [isBangla, setIsBangla] = useState(false);

  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const topic = searchParams.get("topic") || "General Knowledge";
  const subjectId = searchParams.get("subject");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkTutorContextAndGenerate();
    }
  }, [user]);

  // Check if there's AI tutor context first
  const checkTutorContextAndGenerate = async () => {
    setIsLoading(true);
    try {
      // Get user profile for language preference
      const { data: profile } = await supabase
        .from("profiles")
        .select("version")
        .eq("user_id", user?.id)
        .single();
      
      setIsBangla(profile?.version === "bangla");

      // Get the latest conversation
      const { data: conversations } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!conversations || conversations.length === 0) {
        setNoTutorContext(true);
        setIsLoading(false);
        return;
      }

      // Get the last assistant message from the latest conversation
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("content")
        .eq("conversation_id", conversations[0].id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!messages || messages.length === 0) {
        setNoTutorContext(true);
        setIsLoading(false);
        return;
      }

      // We have tutor context, generate questions from it
      const lastAssistantMessage = messages[0].content;
      await generateQuestionsFromContext(lastAssistantMessage);
    } catch (error) {
      console.error("Error checking tutor context:", error);
      setNoTutorContext(true);
      setIsLoading(false);
    }
  };

  const generateQuestionsFromContext = async (tutorContext: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-assessment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "generate",
            userId: user?.id,
            subjectId,
            topic,
            bloomLevel,
            tutorContext,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "প্রশ্ন তৈরি করতে ব্যর্থ হয়েছে।" : "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-assessment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "submit",
            userId: user?.id,
            subjectId,
            topic,
            bloomLevel,
            answers: finalAnswers,
            questions,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResults(data);
      setShowResult(true);

      if (data.shouldLevelUp) {
        toast({
          title: "🎉 Level Up!",
          description: isBangla 
            ? `তুমি ${data.nextLevel.toUpperCase()} লেভেলে উন্নীত হয়েছো!`
            : `You've advanced to ${data.nextLevel.toUpperCase()} level!`,
        });
        const nextLevelIndex = BLOOM_LEVELS.findIndex(b => b.id === data.nextLevel);
        setBloomLevelIndex(nextLevelIndex);
        setBloomLevel(data.nextLevel);
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "মূল্যায়ন জমা দিতে ব্যর্থ হয়েছে।" : "Failed to submit assessment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextLevel = async () => {
    // Move to next Bloom's level
    const nextLevelIndex = bloomLevelIndex + 1;
    if (nextLevelIndex < BLOOM_LEVELS.length) {
      setBloomLevelIndex(nextLevelIndex);
      setBloomLevel(BLOOM_LEVELS[nextLevelIndex].id);
      setShowResult(false);
      setResults(null);
      
      // Get the last tutor context again and generate new questions
      try {
        const { data: conversations } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", user?.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (conversations && conversations.length > 0) {
          const { data: messages } = await supabase
            .from("chat_messages")
            .select("content")
            .eq("conversation_id", conversations[0].id)
            .eq("role", "assistant")
            .order("created_at", { ascending: false })
            .limit(1);

          if (messages && messages.length > 0) {
            await generateQuestionsFromContext(messages[0].content);
          }
        }
      } catch (error) {
        console.error("Error loading next level:", error);
      }
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentBloom = BLOOM_LEVELS.find((b) => b.id === bloomLevel);
  const isLastLevel = bloomLevel === "create";

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isBangla ? "মূল্যায়ন তৈরি হচ্ছে..." : "Generating assessment..."}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no tutor context
  if (noTutorContext) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-semibold">
              {isBangla ? "মূল্যায়ন" : "Assessment"}
            </h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {isBangla ? "প্রথমে AI Tutor এর সাথে কথা বলো!" : "Talk to AI Tutor First!"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isBangla 
                ? "মূল্যায়ন প্রশ্নগুলো AI Tutor এর সাথে তোমার শেষ কথোপকথনের উপর ভিত্তি করে তৈরি হবে। প্রথমে AI Tutor এর সাথে যেকোনো বিষয়ে পড়াশোনা করো, তারপর এখানে ফিরে এসো।"
                : "Assessment questions will be generated based on your last conversation with the AI Tutor. First, study any topic with the AI Tutor, then come back here."}
            </p>
            <Button size="lg" asChild>
              <Link to="/tutor">
                <Brain className="w-5 h-5 mr-2" />
                {isBangla ? "AI Tutor এ যাও" : "Go to AI Tutor"}
              </Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (showResult && results) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-semibold">
              {isBangla ? "মূল্যায়ন সম্পন্ন" : "Assessment Complete"}
            </h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4",
              results.score >= 80 ? "bg-success/20" : results.score >= 60 ? "bg-warning/20" : "bg-destructive/20"
            )}>
              {results.score >= 80 ? (
                <Trophy className="w-12 h-12 text-success" />
              ) : results.score >= 60 ? (
                <Target className="w-12 h-12 text-warning" />
              ) : (
                <RotateCcw className="w-12 h-12 text-destructive" />
              )}
            </div>

            <h2 className="text-3xl font-bold mb-2">{results.score}%</h2>
            <p className="text-muted-foreground mb-4">
              {results.results.filter(r => r.isCorrect).length} {isBangla ? "টি সঠিক" : "of"} {results.results.length} {isBangla ? "" : "correct"}
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">+{results.xpEarned} XP</span>
              </div>
              <div className={cn("px-4 py-2 rounded-full text-white", currentBloom?.color)}>
                {isBangla ? currentBloom?.labelBn : currentBloom?.label} {isBangla ? "লেভেল" : "Level"}
              </div>
            </div>

            {results.shouldLevelUp && !isLastLevel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-xl mb-6"
              >
                <p className="font-semibold text-primary">
                  🎉 {isBangla ? "অভিনন্দন! তুমি লেভেল আপ করেছো!" : "Congratulations! You've leveled up!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `পরবর্তী চ্যালেঞ্জ: ${BLOOM_LEVELS[bloomLevelIndex + 1]?.labelBn || ""} লেভেলের প্রশ্ন`
                    : `Next challenge: ${results.nextLevel.toUpperCase()} level questions`}
                </p>
              </motion.div>
            )}
          </motion.div>

          <div className="space-y-4 mb-8">
            {results.results.map((result, i) => (
              <Card key={i} className={cn(
                "border-2",
                result.isCorrect ? "border-success/30 bg-success/5" : "border-muted/30 bg-muted/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium mb-2">{result.question}</p>
                      {!result.isCorrect && (
                        <p className="text-sm text-muted-foreground">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            {isLastLevel ? (
              <Button className="flex-1" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isBangla ? "ড্যাশবোর্ডে ফিরে যাও" : "Back to Dashboard"}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isBangla ? "ড্যাশবোর্ড" : "Dashboard"}
                  </Link>
                </Button>
                <Button className="flex-1" onClick={handleNextLevel}>
                  {isBangla ? "পরবর্তী লেভেল" : "Next Level"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-heading font-semibold">{topic}</h1>
                <div className={cn("text-xs px-2 py-0.5 rounded text-white inline-block", currentBloom?.color)}>
                  {isBangla ? currentBloom?.labelBn : currentBloom?.label} {isBangla ? "লেভেল" : "Level"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground">
                {isBangla ? `প্রশ্ন ${currentIndex + 1}/${questions.length}` : `Question ${currentIndex + 1}/${questions.length}`}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <p className="text-lg font-medium leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectAnswer(i)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          selectedAnswer === i
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            selectedAnswer === i
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full"
                onClick={handleNext}
                disabled={selectedAnswer === null || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : currentIndex === questions.length - 1 ? (
                  isBangla ? "মূল্যায়ন জমা দাও" : "Submit Assessment"
                ) : (
                  <>
                    {isBangla ? "পরবর্তী প্রশ্ন" : "Next Question"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Assessment;