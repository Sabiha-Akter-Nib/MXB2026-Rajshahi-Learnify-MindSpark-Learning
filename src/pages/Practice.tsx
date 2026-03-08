import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Brain, Sparkles, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Loader2, RefreshCw, Trophy, Target, Lightbulb, BookOpen, Zap, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import TutorBackground from "@/components/tutor/TutorBackground";
import mascotImg from "@/assets/ai-mascot-3d.png";
import SubjectSelector from "@/components/tutor/SubjectSelector";

// ── Types ──
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

// ── Constants ──
const GRADIENT = "linear-gradient(135deg, hsl(300, 65%, 52%) 0%, hsl(270, 60%, 55%) 40%, hsl(30, 78%, 76%) 100%)";

const bloomLevels = [
  { id: "remember", name: "Remember", nameBn: "মনে রাখা", color: "hsl(270, 60%, 55%)" },
  { id: "understand", name: "Understand", nameBn: "বোঝা", color: "hsl(300, 65%, 52%)" },
  { id: "apply", name: "Apply", nameBn: "প্রয়োগ", color: "hsl(330, 70%, 55%)" },
  { id: "analyze", name: "Analyze", nameBn: "বিশ্লেষণ", color: "hsl(265, 58%, 52%)" },
  { id: "evaluate", name: "Evaluate", nameBn: "মূল্যায়ন", color: "hsl(345, 65%, 55%)" },
  { id: "create", name: "Create", nameBn: "সৃষ্টি", color: "hsl(30, 78%, 60%)" },
];

const quickTopics = [
  { en: "Mathematics", bn: "গণিত" },
  { en: "General Science", bn: "সাধারণ বিজ্ঞান" },
  { en: "English Grammar", bn: "ইংরেজি ব্যাকরণ" },
  { en: "Bangladesh History", bn: "বাংলাদেশের ইতিহাস" },
];

const Practice = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
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
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [searchParams] = useSearchParams();
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("class, version, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);
      setLoading(false);
    };
    fetchData();
    const subjectParam = searchParams.get("subject");
    const topicParam = searchParams.get("topic");
    if (subjectParam) setSelectedSubjectId(subjectParam);
    if (topicParam) setTopic(topicParam);
  }, [user, navigate, searchParams]);

  const generateQuestions = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", description: "Please enter a topic to practice.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setAnsweredQuestions(new Set());
    setSessionStartTime(new Date());
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-practice", {
        body: {
          topic,
          studentClass: profile?.class || 5,
          version: profile?.version || "bangla",
          count: 5,
          bloomLevel: selectedBloomLevel !== "all" ? selectedBloomLevel : undefined,
        },
      });
      if (invokeError) throw new Error(invokeError.message || "Failed to generate questions");
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({ title: "Generation Failed", description: "Could not generate practice questions. Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const trackPracticeCompletion = async () => {
    if (!user || !sessionStartTime) return;
    const durationMinutes = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
    const xpEarned = score * 5 + (score === questions.length ? 10 : 0);
    try {
      await supabase.functions.invoke("track-session", {
        body: { subjectId: selectedSubjectId || null, durationMinutes, xpEarned, topic, bloomLevel: questions[0]?.bloomLevel || "understand" },
      });
      const masteryScore = Math.round((score / questions.length) * 100);
      const isWeak = masteryScore < 70;
      const { data: existingMastery } = await supabase.from("topic_mastery").select("*").eq("user_id", user.id).eq("topic_name", topic).maybeSingle();
      if (existingMastery) {
        await supabase.from("topic_mastery").update({
          attempts: existingMastery.attempts + 1,
          correct_answers: existingMastery.correct_answers + score,
          mastery_score: Math.round(((existingMastery.correct_answers + score) / (existingMastery.attempts * questions.length + questions.length)) * 100),
          is_weak_topic: isWeak,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", existingMastery.id);
      } else {
        await supabase.from("topic_mastery").insert({
          user_id: user.id, topic_name: topic, subject_id: selectedSubjectId || null,
          attempts: 1, correct_answers: score, mastery_score: masteryScore,
          is_weak_topic: isWeak, bloom_level: questions[0]?.bloomLevel || "understand",
          last_practiced_at: new Date().toISOString(),
        });
      }
      toast({ title: `+${xpEarned} XP Earned!`, description: score === questions.length ? "Perfect score bonus!" : "Keep practicing!" });
    } catch (error) {
      console.error("Error tracking practice:", error);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answeredQuestions.has(currentIndex)) return;
    setSelectedAnswer(optionIndex);
    setAnsweredQuestions((prev) => new Set([...prev, currentIndex]));
    if (optionIndex === questions[currentIndex].correctIndex) setScore((prev) => prev + 1);
    setTimeout(() => setShowExplanation(true), 500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TutorBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBangla = profile?.version === "bangla";
  const currentQuestion = questions[currentIndex];
  const isComplete = answeredQuestions.size === questions.length && questions.length > 0;

  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />

      {/* ═══ Header — identical to AI Tutor ═══ */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50 transition-colors" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 hsla(270,50%,75%,0)", "0 0 12px 4px hsla(270,50%,75%,0.15)", "0 0 0 0 hsla(270,50%,75%,0)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white/50 shadow-lg"
                    style={{ background: "linear-gradient(135deg, hsla(270, 50%, 90%, 0.5), hsla(320, 40%, 90%, 0.4), hsla(30, 60%, 92%, 0.4))" }}
                  >
                    <img src={mascotImg} alt="AI" className="w-10 h-10 object-contain" />
                  </motion.div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[hsl(145,63%,52%)] rounded-full border-[2.5px] border-card shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-heading font-bold text-base text-foreground">OddhaboshAI</h1>
                    <span
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider font-heading text-white"
                      style={{ background: GRADIENT }}
                    >
                      Practice
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-heading">
                    <span className="w-1.5 h-1.5 bg-[hsl(145,63%,52%)] rounded-full animate-pulse" />
                    {profile ? `Class ${profile.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Score badge */}
            {questions.length > 0 && (
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded-full"
                style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                  backdropFilter: "blur(24px)",
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.15)",
                }}
              >
                <Trophy className="w-4 h-4" style={{ color: "hsl(30, 78%, 60%)" }} />
                <span className="font-bold text-sm font-heading" style={{ color: "hsl(270, 60%, 45%)" }}>
                  {score}/{questions.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* ═══ WELCOME STATE — Setup Form ═══ */}
          {questions.length === 0 && !generating && (
            <div className="flex flex-col items-center justify-center px-4 min-h-[70vh]">
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="relative mb-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full scale-[2.5]"
                  style={{ background: "radial-gradient(circle, hsla(300, 55%, 65%, 0.2) 0%, hsla(270, 60%, 70%, 0.12) 40%, transparent 70%)" }}
                />
                <motion.img
                  src={mascotImg}
                  alt="OddhaboshAI"
                  className="w-36 h-36 sm:w-44 sm:h-44 relative z-10 drop-shadow-2xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2 z-20"
                >
                  <Zap className="w-7 h-7 text-warning fill-warning drop-shadow-lg" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-1 -left-2 z-20"
                >
                  <Star className="w-5 h-5 text-accent fill-accent" />
                </motion.div>
              </motion.div>

              {/* Greeting */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-5"
              >
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1 tracking-tight">
                  {isBangla ? "অনুশীলন শুরু করো! 🧠" : "Let's Practice! 🧠"}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-xs leading-relaxed mx-auto">
                  {isBangla ? "একটি বিষয় লেখো, AI তোমার জন্য প্রশ্ন তৈরি করবে" : "Enter a topic and AI will generate questions for you"}
                </p>
              </motion.div>

              {/* ── Setup Card ── */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="w-full max-w-md space-y-3"
              >
                {/* Subject Selector Button */}
                <button
                  onClick={() => setShowSubjectSelector(!showSubjectSelector)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
                  style={{
                    background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                    backdropFilter: "blur(24px) saturate(1.5)",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    boxShadow: `0 4px 16px hsla(270, 60%, 55%, 0.12), 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4.5 h-4.5" style={{ color: "hsl(270, 60%, 55%)" }} />
                    <span className="text-sm font-semibold" style={{ color: selectedSubjectName ? "hsl(270, 60%, 45%)" : "hsl(0, 0%, 55%)" }}>
                      {selectedSubjectName || (isBangla ? "বিষয় নির্বাচন করো" : "Select Subject")}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Subject Selector Dropdown */}
                <AnimatePresence>
                  {showSubjectSelector && user && profile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl p-3 border border-border/30 shadow-lg"
                        style={{
                          background: "linear-gradient(-45deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))",
                          backdropFilter: "blur(20px)",
                          boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                        }}
                      >
                        <SubjectSelector
                          userId={user.id}
                          studentClass={profile.class}
                          selectedSubject={selectedSubjectId}
                          onSubjectChange={(id, name) => {
                            setSelectedSubjectId(id);
                            setSelectedSubjectName(name);
                            setShowSubjectSelector(false);
                          }}
                          isBangla={isBangla}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Topic Input */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                    backdropFilter: "blur(24px) saturate(1.5)",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 16px hsla(300, 65%, 52%, 0.1), 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) generateQuestions(); }}
                    placeholder={isBangla ? "বিষয় বা অধ্যায় লেখো..." : "Enter topic or chapter..."}
                    className="w-full px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-heading"
                  />
                </div>

                {/* Bloom Level Pills */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <button
                    onClick={() => setSelectedBloomLevel("all")}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all"
                    style={{
                      background: selectedBloomLevel === "all"
                        ? "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))"
                        : "transparent",
                      border: selectedBloomLevel === "all"
                        ? "1.5px solid hsla(270, 60%, 55%, 0.3)"
                        : "1.5px solid rgba(0,0,0,0.08)",
                      color: selectedBloomLevel === "all" ? "hsl(270, 60%, 45%)" : "hsl(0, 0%, 50%)",
                      backdropFilter: selectedBloomLevel === "all" ? "blur(20px)" : "none",
                      boxShadow: selectedBloomLevel === "all" ? "0 2px 8px hsla(270,60%,55%,0.15)" : "none",
                    }}
                  >
                    {isBangla ? "সব" : "All Levels"}
                  </button>
                  {bloomLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedBloomLevel(level.id)}
                      className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all"
                      style={{
                        background: selectedBloomLevel === level.id
                          ? "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))"
                          : "transparent",
                        border: selectedBloomLevel === level.id
                          ? `1.5px solid ${level.color}40`
                          : "1.5px solid rgba(0,0,0,0.08)",
                        color: selectedBloomLevel === level.id ? level.color : "hsl(0, 0%, 50%)",
                        backdropFilter: selectedBloomLevel === level.id ? "blur(20px)" : "none",
                        boxShadow: selectedBloomLevel === level.id ? `0 2px 8px ${level.color}25` : "none",
                      }}
                    >
                      {isBangla ? level.nameBn : level.name}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={generateQuestions}
                  disabled={!topic.trim()}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading disabled:opacity-40 transition-all shadow-lg"
                  style={{
                    background: GRADIENT,
                    boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)",
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                  {isBangla ? "প্রশ্ন তৈরি করো" : "Generate Questions"}
                </motion.button>
              </motion.div>

              {/* Quick Topics */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6"
              >
                <p className="text-muted-foreground text-xs text-center mb-2.5 font-heading">
                  {isBangla ? "দ্রুত বিষয়" : "Quick topics"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickTopics.map((t) => (
                    <motion.button
                      key={t.en}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTopic(isBangla ? t.bn : t.en)}
                      className="px-4 py-2 rounded-full text-xs font-semibold font-heading transition-all"
                      style={{
                        background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                        backdropFilter: "blur(20px)",
                        border: "1.5px solid rgba(255,255,255,0.5)",
                        color: "hsl(270, 60%, 45%)",
                        boxShadow: "0 2px 8px hsla(270,60%,55%,0.1)",
                      }}
                    >
                      {isBangla ? t.bn : t.en}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* ═══ GENERATING STATE ═══ */}
          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-5"
            >
              <motion.img
                src={mascotImg}
                alt="Thinking"
                className="w-28 h-28 drop-shadow-2xl"
                animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(270, 60%, 55%)" }} />
                <p className="text-muted-foreground text-sm font-heading font-medium">
                  {isBangla ? "প্রশ্ন তৈরি হচ্ছে..." : "Generating questions..."}
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ QUESTION STATE ═══ */}
          {questions.length > 0 && !isComplete && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5 max-w-2xl mx-auto"
            >
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ background: GRADIENT }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground font-heading">
                  {currentIndex + 1}/{questions.length}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ background: bloomLevels.find((b) => b.id === currentQuestion.bloomLevel)?.color || "hsl(270, 60%, 55%)" }}
                >
                  {currentQuestion.bloomLevel}
                </span>
              </div>

              {/* Question Card */}
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))",
                  backdropFilter: "blur(24px) saturate(1.5)",
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 8px 32px hsla(270, 60%, 55%, 0.08), 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <h3 className="font-heading font-bold text-base sm:text-lg text-foreground mb-5 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, idx) => {
                    const isAnswered = answeredQuestions.has(currentIndex);
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let cardStyle: React.CSSProperties = {
                      background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))",
                      backdropFilter: "blur(16px)",
                      border: "1.5px solid rgba(255,255,255,0.5)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    };

                    if (isAnswered && isCorrect) {
                      cardStyle = {
                        background: "linear-gradient(-45deg, hsla(145, 63%, 95%, 0.95), hsla(145, 63%, 90%, 0.8))",
                        border: "2px solid hsl(145, 63%, 52%)",
                        boxShadow: "0 4px 16px hsla(145, 63%, 52%, 0.2)",
                      };
                    } else if (isAnswered && isSelected && !isCorrect) {
                      cardStyle = {
                        background: "linear-gradient(-45deg, hsla(0, 70%, 95%, 0.95), hsla(0, 70%, 92%, 0.8))",
                        border: "2px solid hsl(0, 70%, 60%)",
                        boxShadow: "0 4px 16px hsla(0, 70%, 60%, 0.2)",
                      };
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!isAnswered ? { scale: 1.01, y: -2 } : {}}
                        whileTap={!isAnswered ? { scale: 0.99 } : {}}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswered}
                        className="w-full p-3.5 sm:p-4 rounded-xl text-left flex items-center gap-3 transition-all"
                        style={cardStyle}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white"
                          style={{
                            background: isAnswered && isCorrect
                              ? "hsl(145, 63%, 52%)"
                              : isAnswered && isSelected && !isCorrect
                              ? "hsl(0, 70%, 60%)"
                              : GRADIENT,
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground">{option}</span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "hsl(145, 63%, 52%)" }} />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl p-4 overflow-hidden"
                    style={{
                      background: "linear-gradient(-45deg, hsla(270, 60%, 97%, 0.95), hsla(300, 55%, 97%, 0.9))",
                      border: "1.5px solid hsla(270, 60%, 55%, 0.15)",
                      boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.08)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: GRADIENT }}
                      >
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1 font-heading" style={{ color: "hsl(270, 60%, 45%)" }}>
                          {isBangla ? "ব্যাখ্যা" : "Explanation"}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={prevQuestion}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-heading disabled:opacity-30 transition-all"
                  style={{
                    background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                    backdropFilter: "blur(20px)",
                    border: "1.5px solid rgba(255,255,255,0.5)",
                    color: "hsl(270, 60%, 45%)",
                    boxShadow: "0 2px 8px hsla(270,60%,55%,0.1)",
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {isBangla ? "আগের" : "Previous"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={nextQuestion}
                  disabled={currentIndex === questions.length - 1 || !answeredQuestions.has(currentIndex)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all shadow-lg"
                  style={{
                    background: GRADIENT,
                    boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.3)",
                  }}
                >
                  {isBangla ? "পরের" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ RESULTS STATE ═══ */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onAnimationComplete={trackPracticeCompletion}
              className="flex flex-col items-center justify-center min-h-[65vh] gap-6"
            >
              {/* Trophy mascot */}
              <motion.div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full scale-[2.5]"
                  style={{ background: "radial-gradient(circle, hsla(30, 78%, 60%, 0.25), transparent 70%)" }}
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, hsla(30, 78%, 76%, 0.3), hsla(270, 60%, 90%, 0.3))",
                      backdropFilter: "blur(20px)",
                      border: "2px solid rgba(255,255,255,0.4)",
                      boxShadow: "0 8px 32px hsla(30, 78%, 60%, 0.2)",
                    }}
                  >
                    <Trophy className="w-12 h-12" style={{ color: "hsl(30, 78%, 55%)" }} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Score text */}
              <div className="text-center">
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground mb-1">
                  {score === questions.length
                    ? isBangla ? "অসাধারণ! 🎉" : "Perfect! 🎉"
                    : score >= questions.length * 0.7
                    ? isBangla ? "চমৎকার! 🌟" : "Great job! 🌟"
                    : isBangla ? "ভালো চেষ্টা! 💪" : "Good try! 💪"}
                </h2>
                <p className="text-muted-foreground text-sm font-heading">
                  {isBangla
                    ? `${questions.length} টি প্রশ্নের মধ্যে ${score} টি সঠিক`
                    : `${score} out of ${questions.length} correct`}
                </p>
              </div>

              {/* Score Breakdown — Glass Cards */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {[
                  { value: score, label: isBangla ? "সঠিক" : "Correct", color: "hsl(145, 63%, 52%)" },
                  { value: questions.length - score, label: isBangla ? "ভুল" : "Wrong", color: "hsl(0, 70%, 60%)" },
                  { value: score * 5 + (score === questions.length ? 10 : 0), label: "XP", color: "hsl(270, 60%, 55%)", prefix: "+" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                      backdropFilter: "blur(24px)",
                      border: "1.5px solid rgba(255,255,255,0.6)",
                      boxShadow: `0 4px 16px ${item.color}20`,
                    }}
                  >
                    <p className="text-2xl font-extrabold font-heading" style={{ color: item.color }}>
                      {item.prefix || ""}{item.value}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setQuestions([]); setTopic(""); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold font-heading transition-all"
                  style={{
                    background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                    backdropFilter: "blur(20px)",
                    border: "1.5px solid rgba(255,255,255,0.5)",
                    color: "hsl(270, 60%, 45%)",
                    boxShadow: "0 2px 8px hsla(270,60%,55%,0.1)",
                  }}
                >
                  <Target className="w-4 h-4" />
                  {isBangla ? "নতুন টপিক" : "New Topic"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={generateQuestions}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
                  style={{
                    background: GRADIENT,
                    boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)",
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  {isBangla ? "আবার চেষ্টা করো" : "Practice Again"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Practice;
