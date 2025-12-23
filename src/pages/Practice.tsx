import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Sparkles, CheckCircle2, XCircle, ChevronRight, Loader2, RefreshCw, Trophy, Target, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AssessmentBackground from "@/components/assessment/AssessmentBackground";
interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel: string;
}
interface Profile {
  class: number;
  version: string;
  full_name: string;
}
interface Subject {
  id: string;
  name: string;
  name_bn: string;
}
const bloomLevels = [{
  id: "remember",
  name: "Remember",
  color: "bg-blue-500"
}, {
  id: "understand",
  name: "Understand",
  color: "bg-green-500"
}, {
  id: "apply",
  name: "Apply",
  color: "bg-yellow-500"
}, {
  id: "analyze",
  name: "Analyze",
  color: "bg-orange-500"
}, {
  id: "evaluate",
  name: "Evaluate",
  color: "bg-red-500"
}, {
  id: "create",
  name: "Create",
  color: "bg-purple-500"
}];
const Practice = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [topic, setTopic] = useState("");
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      // Fetch profile
      const {
        data: profileData
      } = await supabase.from("profiles").select("class, version, full_name").eq("user_id", user.id).maybeSingle();
      if (profileData) {
        setProfile(profileData);

        // Fetch subjects for this class
        const {
          data: subjectsData
        } = await supabase.from("subjects").select("id, name, name_bn").lte("min_class", profileData.class).gte("max_class", profileData.class);
        setSubjects(subjectsData || []);
      }
      setLoading(false);
    };
    fetchData();
    const subjectParam = searchParams.get("subject");
    const topicParam = searchParams.get("topic");
    if (subjectParam) {
      setSelectedSubjectId(subjectParam);
    }
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [user, navigate, searchParams]);
  const generateQuestions = async () => {
    if (!topic.trim()) {
      toast({
        title: "Enter a topic",
        description: "Please enter a subject or topic to practice.",
        variant: "destructive"
      });
      return;
    }
    setGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setAnsweredQuestions(new Set());
    setSessionStartTime(new Date());
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-practice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          topic,
          studentClass: profile?.class || 5,
          version: profile?.version || "bangla",
          count: 5,
          bloomLevel: selectedBloomLevel !== "all" ? selectedBloomLevel : undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate practice questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  const trackPracticeCompletion = async () => {
    if (!user || !sessionStartTime) return;
    const durationMinutes = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
    const xpEarned = score * 5 + (score === questions.length ? 10 : 0); // Bonus for perfect

    try {
      // Track study session
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          userId: user.id,
          subjectId: selectedSubjectId || null,
          durationMinutes,
          xpEarned,
          topic,
          bloomLevel: questions[0]?.bloomLevel || "understand"
        })
      });

      // Update topic mastery
      const masteryScore = Math.round(score / questions.length * 100);
      const isWeak = masteryScore < 70;
      const {
        data: existingMastery
      } = await supabase.from("topic_mastery").select("*").eq("user_id", user.id).eq("topic_name", topic).maybeSingle();
      if (existingMastery) {
        await supabase.from("topic_mastery").update({
          attempts: existingMastery.attempts + 1,
          correct_answers: existingMastery.correct_answers + score,
          mastery_score: Math.round((existingMastery.correct_answers + score) / (existingMastery.attempts * questions.length + questions.length) * 100),
          is_weak_topic: isWeak,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq("id", existingMastery.id);
      } else {
        await supabase.from("topic_mastery").insert({
          user_id: user.id,
          topic_name: topic,
          subject_id: selectedSubjectId || null,
          attempts: 1,
          correct_answers: score,
          mastery_score: masteryScore,
          is_weak_topic: isWeak,
          bloom_level: questions[0]?.bloomLevel || "understand",
          last_practiced_at: new Date().toISOString()
        });
      }
      toast({
        title: `+${xpEarned} XP Earned!`,
        description: score === questions.length ? "Perfect score bonus!" : "Keep practicing!"
      });
    } catch (error) {
      console.error("Error tracking practice:", error);
    }
  };
  const handleAnswer = (optionIndex: number) => {
    if (answeredQuestions.has(currentIndex)) return;
    setSelectedAnswer(optionIndex);
    setAnsweredQuestions(prev => new Set([...prev, currentIndex]));
    if (optionIndex === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };
  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  const isBangla = profile?.version === "bangla";
  const currentQuestion = questions[currentIndex];
  const isComplete = answeredQuestions.size === questions.length && questions.length > 0;
  return <div className="min-h-screen relative">
      <AssessmentBackground />
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-border z-30 px-4 py-3 relative">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading font-semibold">
                {isBangla ? "অনুশীলন" : "Practice"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Class {profile?.class} • {topic || "Select topic"}
              </p>
            </div>
          </div>

          {questions.length > 0 && <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="font-medium">
                {score}/{questions.length}
              </span>
            </div>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 relative z-10">
        {/* Topic Input */}
        {questions.length === 0 && !generating && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-2xl">
                {isBangla ? "অনুশীলন শুরু করুন" : "Start Practice"}
              </h2>
              <p className="max-w-md mx-auto text-primary-foreground">
                {isBangla ? "একটি বিষয় বা অধ্যায় লিখুন এবং AI আপনার জন্য প্রশ্ন তৈরি করবে!" : "Enter a subject or chapter and AI will generate questions for you!"}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* Subject Selector */}
              {subjects.length > 0 && <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isBangla ? "বিষয় নির্বাচন করুন" : "Select a subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {isBangla ? subject.name_bn || subject.name : subject.name}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>}

              {/* Topic Input */}
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder={isBangla ? "যেমন: গণিত অধ্যায় ১, সাধারণ বিজ্ঞান..." : "e.g., Math Chapter 1, General Science..."} className="w-full px-4 py-3 rounded-xl border border-border bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />

              {/* Bloom Level Filter */}
              <Select value={selectedBloomLevel} onValueChange={setSelectedBloomLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {bloomLevels.map(level => <SelectItem key={level.id} value={level.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", level.color)} />
                        {level.name}
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Button onClick={generateQuestions} disabled={!topic.trim()} className="w-full h-12" variant="hero">
                <Sparkles className="w-5 h-5 mr-2" />
                {isBangla ? "প্রশ্ন তৈরি করুন" : "Generate Questions"}
              </Button>
            </div>

            {/* Quick Topics */}
            <div className="pt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                {isBangla ? "দ্রুত বিষয় নির্বাচন" : "Quick topics"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Mathematics", "General Science", "English Grammar", "Bangladesh History"].map(t => <button key={t} onClick={() => setTopic(t)} className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
                      {t}
                    </button>)}
              </div>
            </div>
          </motion.div>}

        {/* Loading */}
        {generating && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="text-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {isBangla ? "প্রশ্ন তৈরি হচ্ছে..." : "Generating questions..."}
            </p>
          </motion.div>}

        {/* Questions */}
        {questions.length > 0 && !isComplete && <motion.div key={currentIndex} initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", bloomLevels.find(b => b.id === currentQuestion.bloomLevel)?.color || "bg-primary", "text-white")}>
                  {currentQuestion.bloomLevel}
                </span>
              </div>
              <Progress value={(currentIndex + 1) / questions.length * 100} />
            </div>

            {/* Question */}
            <div className="bg-white/95 backdrop-blur-sm border border-border rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-lg mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
              const isAnswered = answeredQuestions.has(currentIndex);
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              return <motion.button key={idx} whileHover={!isAnswered ? {
                scale: 1.01
              } : {}} whileTap={!isAnswered ? {
                scale: 0.99
              } : {}} onClick={() => handleAnswer(idx)} disabled={isAnswered} className={cn("w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3", !isAnswered && "hover:border-primary/50 hover:bg-primary/5", isAnswered && isCorrect && "border-success bg-success/10", isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10", !isAnswered && "border-border")}>
                      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm shrink-0", isAnswered && isCorrect ? "bg-success text-success-foreground" : isAnswered && isSelected && !isCorrect ? "bg-destructive text-destructive-foreground" : "bg-muted")}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    </motion.button>;
            })}
              </div>
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && <motion.div initial={{
            opacity: 0,
            height: 0
          }} animate={{
            opacity: 1,
            height: "auto"
          }} exit={{
            opacity: 0,
            height: 0
          }} className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-primary mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={prevQuestion} disabled={currentIndex === 0}>
                Previous
              </Button>
              <Button onClick={nextQuestion} disabled={currentIndex === questions.length - 1 || !answeredQuestions.has(currentIndex)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>}

        {/* Results */}
        {isComplete && <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} onAnimationComplete={trackPracticeCompletion} className="text-center py-8 space-y-6">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-12 h-12 text-accent" />
            </div>

            <div>
              <h2 className="font-heading font-bold text-3xl mb-2">
                {score === questions.length ? isBangla ? "অসাধারণ! 🎉" : "Perfect! 🎉" : score >= questions.length * 0.7 ? isBangla ? "চমৎকার!" : "Great job!" : isBangla ? "ভালো চেষ্টা!" : "Good try!"}
              </h2>
              <p className="text-muted-foreground">
                {isBangla ? `আপনি ${questions.length} টি প্রশ্নের মধ্যে ${score} টি সঠিক উত্তর দিয়েছেন` : `You got ${score} out of ${questions.length} questions correct`}
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{score}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{questions.length - score}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-2xl font-bold text-accent">+{score * 5 + (score === questions.length ? 10 : 0)}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => setQuestions([])}>
                <Target className="w-4 h-4 mr-2" />
                New Topic
              </Button>
              <Button variant="hero" onClick={generateQuestions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Practice Again
              </Button>
            </div>
          </motion.div>}
      </main>
    </div>;
};
export default Practice;