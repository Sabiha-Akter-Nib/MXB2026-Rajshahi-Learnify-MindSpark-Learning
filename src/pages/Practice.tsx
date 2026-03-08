import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Brain, Sparkles, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Loader2, RefreshCw, Trophy, Target, Lightbulb, BookOpen, Zap, Star, Clock, Award, Plus, X,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import TutorBackground from "@/components/tutor/TutorBackground";
import mascotImg from "@/assets/ai-mascot-3d.png";
import tugiImg from "@/assets/tugi-wave.png";
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
interface AnswerRecord {
  selectedIndex: number;
  isCorrect: boolean;
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

const questionCountOptions = [5, 10, 15, 20, 25];

interface TopicEntry {
  subjectId: string;
  subjectName: string;
  topic: string;
}

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
  const [answers, setAnswers] = useState<Map<number, AnswerRecord>>(new Map());
  const [topic, setTopic] = useState("");
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<string>("all");
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [showResults, setShowResults] = useState(false);
  const [searchParams] = useSearchParams();
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [resultsConfettiDone, setResultsConfettiDone] = useState(false);
  const [additionalTopics, setAdditionalTopics] = useState<TopicEntry[]>([]);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [addTopicText, setAddTopicText] = useState("");
  const [addSubjectId, setAddSubjectId] = useState("");
  const [addSubjectName, setAddSubjectName] = useState("");
  const [showAddSubjectSelector, setShowAddSubjectSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles").select("class, version, full_name")
        .eq("user_id", user.id).maybeSingle();
      if (profileData) setProfile(profileData);
      setLoading(false);
    };
    fetchData();
    const subjectParam = searchParams.get("subject");
    const topicParam = searchParams.get("topic");
    if (subjectParam) setSelectedSubjectId(subjectParam);
    if (topicParam) setTopic(topicParam);
  }, [user, navigate, searchParams]);

  const handleAddTopic = () => {
    if (!addTopicText.trim()) return;
    setAdditionalTopics(prev => [...prev, { subjectId: addSubjectId, subjectName: addSubjectName, topic: addTopicText.trim() }]);
    setAddTopicText("");
    setAddSubjectId("");
    setAddSubjectName("");
    setShowAddTopic(false);
  };

  const removeAdditionalTopic = (idx: number) => {
    setAdditionalTopics(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Scoring logic: 1 XP correct, -0.25 wrong ──
  const calculateScore = () => {
    let correct = 0;
    let wrong = 0;
    answers.forEach((record) => {
      if (record.isCorrect) correct++;
      else wrong++;
    });
    const rawScore = correct * 1 - wrong * 0.25;
    return { correct, wrong, totalXP: Math.max(0, parseFloat(rawScore.toFixed(2))) };
  };

  const getTimeTaken = () => {
    if (!sessionStartTime) return 0;
    const end = sessionEndTime || new Date();
    return Math.round((end.getTime() - sessionStartTime.getTime()) / 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const generateQuestions = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", description: "Please enter a topic to practice.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowResults(false);
    setSessionStartTime(new Date());
    setSessionEndTime(null);
    setResultsConfettiDone(false);
    try {
      // Combine main topic with additional topics
      const allTopics = [topic, ...additionalTopics.map(at => at.topic)].join(", ");
      const allSubjects = [selectedSubjectName, ...additionalTopics.map(at => at.subjectName).filter(Boolean)].filter(Boolean).join(", ");
      const { data, error: invokeError } = await supabase.functions.invoke("generate-practice", {
        body: {
          topic: allTopics, studentClass: profile?.class || 5, version: profile?.version || "bangla",
          count: questionCount, bloomLevel: selectedBloomLevel !== "all" ? selectedBloomLevel : undefined,
          subjectName: allSubjects || undefined,
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
    const { correct, totalXP } = calculateScore();
    const durationMinutes = Math.max(1, Math.round(getTimeTaken() / 60));
    try {
      await supabase.functions.invoke("track-session", {
        body: { subjectId: selectedSubjectId || null, durationMinutes, xpEarned: Math.round(totalXP), topic, bloomLevel: questions[0]?.bloomLevel || "understand" },
      });
      const masteryScore = Math.round((correct / questions.length) * 100);
      const isWeak = masteryScore < 70;
      const { data: existingMastery } = await supabase.from("topic_mastery").select("*").eq("user_id", user.id).eq("topic_name", topic).maybeSingle();
      if (existingMastery) {
        await supabase.from("topic_mastery").update({
          attempts: existingMastery.attempts + 1,
          correct_answers: existingMastery.correct_answers + correct,
          mastery_score: Math.round(((existingMastery.correct_answers + correct) / (existingMastery.attempts * questions.length + questions.length)) * 100),
          is_weak_topic: isWeak, last_practiced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq("id", existingMastery.id);
      } else {
        await supabase.from("topic_mastery").insert({
          user_id: user.id, topic_name: topic, subject_id: selectedSubjectId || null,
          attempts: 1, correct_answers: correct, mastery_score: masteryScore,
          is_weak_topic: isWeak, bloom_level: questions[0]?.bloomLevel || "understand", last_practiced_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error tracking practice:", error);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answers.has(currentIndex)) return;
    const isCorrect = optionIndex === questions[currentIndex].correctIndex;
    setSelectedAnswer(optionIndex);
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentIndex, { selectedIndex: optionIndex, isCorrect });
      return next;
    });
    setTimeout(() => setShowExplanation(true), 400);
  };

  const finishPractice = () => {
    setSessionEndTime(new Date());
    setShowResults(true);
    trackPracticeCompletion();
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
      // Restore previous answer state
      const prevRecord = answers.get(currentIndex - 1);
      setSelectedAnswer(prevRecord?.selectedIndex ?? null);
      setShowExplanation(!!prevRecord);
    }
  };

  const goToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    const record = answers.get(idx);
    setSelectedAnswer(record?.selectedIndex ?? null);
    setShowExplanation(!!record);
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
  const allAnswered = answers.size === questions.length && questions.length > 0;
  const { correct, wrong, totalXP } = calculateScore();
  const timeTaken = getTimeTaken();

  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50 transition-colors" asChild>
                <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
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
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider font-heading text-white" style={{ background: GRADIENT }}>Practice</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-heading">
                    <span className="w-1.5 h-1.5 bg-[hsl(145,63%,52%)] rounded-full animate-pulse" />
                    {profile ? `Class ${profile.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Live timer + score */}
            {questions.length > 0 && !showResults && (
              <div className="flex items-center gap-2">
                <LiveTimer startTime={sessionStartTime} />
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                    backdropFilter: "blur(24px)", border: "1.5px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.15)",
                  }}
                >
                  <Trophy className="w-3.5 h-3.5" style={{ color: "hsl(30, 78%, 60%)" }} />
                  <span className="font-bold text-xs font-heading" style={{ color: "hsl(270, 60%, 45%)" }}>
                    {correct}/{answers.size}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* ═══ WELCOME STATE ═══ */}
          {questions.length === 0 && !generating && (
            <div className="flex flex-col items-center justify-center px-4 min-h-[70vh]">
              {/* Mascot */}
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="relative mb-4">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: "radial-gradient(circle, hsla(300, 55%, 65%, 0.2) 0%, hsla(270, 60%, 70%, 0.12) 40%, transparent 70%)" }} />
                <motion.img src={mascotImg} alt="OddhaboshAI" className="w-36 h-36 sm:w-44 sm:h-44 relative z-10 drop-shadow-2xl"
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -top-2 -right-2 z-20">
                  <Zap className="w-7 h-7 text-warning fill-warning drop-shadow-lg" />
                </motion.div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-center mb-5">
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1 tracking-tight">
                  {isBangla ? "অনুশীলন শুরু করো! 🧠" : "Let's Practice! 🧠"}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-xs leading-relaxed mx-auto">
                  {isBangla ? "একটি বিষয় লেখো, AI তোমার জন্য প্রশ্ন তৈরি করবে" : "Enter a topic and AI will generate questions for you"}
                </p>
              </motion.div>

              {/* ── Setup Card ── */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }} className="w-full max-w-md space-y-3">
                {/* Subject Selector */}
                <button onClick={() => setShowSubjectSelector(!showSubjectSelector)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
                  style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(24px) saturate(1.5)", border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.12)" }}>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4" style={{ color: "hsl(270, 60%, 55%)" }} />
                    <span className="text-sm font-semibold" style={{ color: selectedSubjectName ? "hsl(270, 60%, 45%)" : "hsl(0, 0%, 55%)" }}>
                      {selectedSubjectName || (isBangla ? "বিষয় নির্বাচন করো" : "Select Subject")}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {showSubjectSelector && user && profile && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="rounded-2xl p-3 border border-border/30 shadow-lg" style={{ background: "linear-gradient(-45deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))", backdropFilter: "blur(20px)" }}>
                        <SubjectSelector userId={user.id} studentClass={profile.class} selectedSubject={selectedSubjectId}
                          onSubjectChange={(id, name) => { setSelectedSubjectId(id); setSelectedSubjectName(name); setShowSubjectSelector(false); }} isBangla={isBangla} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Topic Input */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(24px) saturate(1.5)", border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 16px hsla(300, 65%, 52%, 0.1)" }}>
                  <input ref={inputRef} type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) generateQuestions(); }}
                    placeholder={isBangla ? "বিষয় বা অধ্যায় লেখো..." : "Enter topic or chapter..."}
                    className="w-full px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-heading" />
                </div>

                {/* Question Count Selector */}
                <div>
                  <p className="text-muted-foreground text-xs text-center mb-2 font-heading">{isBangla ? "প্রশ্ন সংখ্যা নির্বাচন করো" : "Select number of questions"}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {questionCountOptions.map((count) => (
                      <motion.button key={count} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setQuestionCount(count)}
                        className="w-11 h-11 rounded-xl text-sm font-bold font-heading transition-all flex items-center justify-center"
                        style={{
                          background: questionCount === count ? GRADIENT : "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                          color: questionCount === count ? "white" : "hsl(270, 60%, 45%)",
                          border: questionCount === count ? "none" : "1.5px solid rgba(255,255,255,0.5)",
                          backdropFilter: "blur(20px)",
                          boxShadow: questionCount === count ? "0 4px 16px hsla(270, 60%, 55%, 0.35)" : "0 2px 8px hsla(270,60%,55%,0.1)",
                        }}
                      >
                        {count}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Bloom Level Pills */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <button onClick={() => setSelectedBloomLevel("all")}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all"
                    style={{
                      background: selectedBloomLevel === "all" ? "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))" : "transparent",
                      border: selectedBloomLevel === "all" ? "1.5px solid hsla(270, 60%, 55%, 0.3)" : "1.5px solid rgba(0,0,0,0.08)",
                      color: selectedBloomLevel === "all" ? "hsl(270, 60%, 45%)" : "hsl(0, 0%, 50%)",
                      backdropFilter: selectedBloomLevel === "all" ? "blur(20px)" : "none",
                    }}
                  >
                    {isBangla ? "সব" : "All Levels"}
                  </button>
                  {bloomLevels.map((level) => (
                    <button key={level.id} onClick={() => setSelectedBloomLevel(level.id)}
                      className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all"
                      style={{
                        background: selectedBloomLevel === level.id ? "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))" : "transparent",
                        border: selectedBloomLevel === level.id ? `1.5px solid ${level.color}40` : "1.5px solid rgba(0,0,0,0.08)",
                        color: selectedBloomLevel === level.id ? level.color : "hsl(0, 0%, 50%)",
                        backdropFilter: selectedBloomLevel === level.id ? "blur(20px)" : "none",
                      }}
                    >
                      {isBangla ? level.nameBn : level.name}
                    </button>
                  ))}
                </div>

                {/* Additional Topics */}
                {additionalTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs text-center font-heading">{isBangla ? "অতিরিক্ত টপিক" : "Additional Topics"}</p>
                    {additionalTopics.map((at, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                        background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))",
                        backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)",
                      }}>
                        <div className="flex-1 text-xs font-heading text-foreground">
                          {at.subjectName && <span className="font-bold" style={{ color: "hsl(270, 60%, 45%)" }}>{at.subjectName} • </span>}
                          {at.topic}
                        </div>
                        <button onClick={() => removeAdditionalTopic(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Another Topic */}
                <AnimatePresence>
                  {showAddTopic && profile && user && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                      <button onClick={() => setShowAddSubjectSelector(!showAddSubjectSelector)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)", color: addSubjectName ? "hsl(270, 60%, 45%)" : "hsl(0, 0%, 55%)" }}>
                        <span>{addSubjectName || (isBangla ? "বিষয় (ঐচ্ছিক)" : "Subject (optional)")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      {showAddSubjectSelector && (
                        <div className="rounded-xl p-2 border border-border/30" style={{ background: "linear-gradient(-45deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))", backdropFilter: "blur(20px)" }}>
                          <SubjectSelector userId={user.id} studentClass={profile.class} selectedSubject={addSubjectId}
                            onSubjectChange={(id, name) => { setAddSubjectId(id || ""); setAddSubjectName(name || ""); setShowAddSubjectSelector(false); }} isBangla={isBangla} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input type="text" value={addTopicText} onChange={(e) => setAddTopicText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && addTopicText.trim()) handleAddTopic(); }}
                          placeholder={isBangla ? "টপিক লেখো..." : "Enter topic..."}
                          className="flex-1 px-3 py-2.5 rounded-xl bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none font-heading"
                          style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.9), rgba(254,254,254,0.65))", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)" }} />
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddTopic} disabled={!addTopicText.trim()}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                          style={{ background: GRADIENT }}>{isBangla ? "যোগ করো" : "Add"}</motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showAddTopic && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddTopic(true)}
                    className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold font-heading transition-all"
                    style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.4)", color: "hsl(270, 60%, 45%)" }}>
                    <Plus className="w-4 h-4" />{isBangla ? "আরেকটি বিষয় ও টপিক যোগ করো" : "Add another subject + topic"}
                  </motion.button>
                )}

                {/* Generate Button */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generateQuestions} disabled={!topic.trim()}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading disabled:opacity-40 transition-all shadow-lg"
                  style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
                  <Sparkles className="w-5 h-5" />
                  {isBangla ? `${questionCount}টি প্রশ্ন তৈরি করো` : `Generate ${questionCount} Questions`}
                </motion.button>
              </motion.div>

              {/* Quick Topics */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-6">
                <p className="text-muted-foreground text-xs text-center mb-2.5 font-heading">{isBangla ? "দ্রুত বিষয়" : "Quick topics"}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickTopics.map((t) => (
                    <motion.button key={t.en} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setTopic(isBangla ? t.bn : t.en)}
                      className="px-4 py-2 rounded-full text-xs font-semibold font-heading transition-all"
                      style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270, 60%, 45%)" }}>
                      {isBangla ? t.bn : t.en}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Scoring info */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-5 text-center">
                <p className="text-muted-foreground/70 text-[10px] font-heading">
                  {isBangla ? "✅ সঠিক = +1 XP  •  ❌ ভুল = -0.25 XP" : "✅ Correct = +1 XP  •  ❌ Wrong = -0.25 XP"}
                </p>
              </motion.div>
            </div>
          )}

          {/* ═══ GENERATING STATE ═══ */}
          {generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
              <motion.img src={mascotImg} alt="Thinking" className="w-28 h-28 drop-shadow-2xl"
                animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(270, 60%, 55%)" }} />
                <p className="text-muted-foreground text-sm font-heading font-medium">
                  {isBangla ? `${questionCount}টি প্রশ্ন তৈরি হচ্ছে...` : `Generating ${questionCount} questions...`}
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ QUESTION STATE ═══ */}
          {questions.length > 0 && !showResults && (
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 max-w-2xl mx-auto">

              {/* Question Number Navigator */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {questions.map((_, idx) => {
                  const record = answers.get(idx);
                  const isActive = idx === currentIndex;
                  let bg = "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))";
                  let borderColor = "rgba(255,255,255,0.5)";
                  let textColor = "hsl(270, 60%, 45%)";
                  if (record?.isCorrect) { bg = "hsl(145, 63%, 52%)"; textColor = "white"; borderColor = "hsl(145, 63%, 42%)"; }
                  else if (record && !record.isCorrect) { bg = "hsl(0, 70%, 60%)"; textColor = "white"; borderColor = "hsl(0, 70%, 50%)"; }
                  return (
                    <motion.button key={idx} whileTap={{ scale: 0.9 }} onClick={() => goToQuestion(idx)}
                      className="w-8 h-8 rounded-lg text-[11px] font-bold font-heading flex items-center justify-center transition-all"
                      style={{
                        background: bg, color: textColor, border: isActive ? `2.5px solid hsl(270, 60%, 55%)` : `1.5px solid ${borderColor}`,
                        backdropFilter: "blur(16px)", boxShadow: isActive ? "0 0 12px hsla(270, 60%, 55%, 0.3)" : "none",
                      }}>
                      {idx + 1}
                    </motion.button>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(answers.size / questions.length) * 100}%` }} className="h-full rounded-full" style={{ background: GRADIENT }} />
                </div>
                <span className="text-xs font-bold text-muted-foreground font-heading">{answers.size}/{questions.length}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ background: bloomLevels.find((b) => b.id === currentQuestion?.bloomLevel)?.color || "hsl(270, 60%, 55%)" }}>
                  {currentQuestion?.bloomLevel}
                </span>
              </div>

              {/* Question Card */}
              <div className="rounded-2xl p-5 sm:p-6" style={{
                background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))", backdropFilter: "blur(24px) saturate(1.5)",
                border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px hsla(270, 60%, 55%, 0.08)",
              }}>
                <h3 className="font-heading font-bold text-base sm:text-lg text-foreground mb-5 leading-relaxed">
                  {currentQuestion?.question}
                </h3>
                <div className="space-y-2.5">
                  {currentQuestion?.options.map((option, idx) => {
                    const record = answers.get(currentIndex);
                    const isAnswered = !!record;
                    const isSelected = record?.selectedIndex === idx || selectedAnswer === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;

                    let cardStyle: React.CSSProperties = {
                      background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))",
                      backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    };
                    if (isAnswered && isCorrect) {
                      cardStyle = { background: "linear-gradient(-45deg, hsla(145, 63%, 95%, 0.95), hsla(145, 63%, 90%, 0.8))", border: "2px solid hsl(145, 63%, 52%)", boxShadow: "0 4px 16px hsla(145, 63%, 52%, 0.2)" };
                    } else if (isAnswered && isSelected && !isCorrect) {
                      cardStyle = { background: "linear-gradient(-45deg, hsla(0, 70%, 95%, 0.95), hsla(0, 70%, 92%, 0.8))", border: "2px solid hsl(0, 70%, 60%)", boxShadow: "0 4px 16px hsla(0, 70%, 60%, 0.2)" };
                    }

                    return (
                      <motion.button key={idx} whileHover={!isAnswered ? { scale: 1.01, y: -2 } : {}} whileTap={!isAnswered ? { scale: 0.99 } : {}}
                        onClick={() => handleAnswer(idx)} disabled={isAnswered}
                        className="w-full p-3.5 sm:p-4 rounded-xl text-left flex items-center gap-3 transition-all" style={cardStyle}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white"
                          style={{ background: isAnswered && isCorrect ? "hsl(145, 63%, 52%)" : isAnswered && isSelected && !isCorrect ? "hsl(0, 70%, 60%)" : GRADIENT }}>
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

              {/* Explanation — always visible once answered */}
              <AnimatePresence>
                {(showExplanation || answers.has(currentIndex)) && currentQuestion && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl p-4 overflow-hidden" style={{
                      background: "linear-gradient(-45deg, hsla(270, 60%, 97%, 0.95), hsla(300, 55%, 97%, 0.9))",
                      border: "1.5px solid hsla(270, 60%, 55%, 0.15)", boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.08)",
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: GRADIENT }}>
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1 font-heading" style={{ color: "hsl(270, 60%, 45%)" }}>{isBangla ? "ব্যাখ্যা" : "Explanation"}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={prevQuestion} disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-heading disabled:opacity-30 transition-all"
                  style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270, 60%, 45%)" }}>
                  <ChevronLeft className="w-4 h-4" />{isBangla ? "আগের" : "Previous"}
                </motion.button>

                {/* Finish button when all answered */}
                {allAnswered ? (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={finishPractice}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
                    style={{ background: "linear-gradient(135deg, hsl(145, 63%, 48%), hsl(160, 60%, 45%))", boxShadow: "0 4px 16px hsla(145, 63%, 48%, 0.35)" }}>
                    <Award className="w-4 h-4" />{isBangla ? "ফলাফল দেখো" : "See Results"}
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={nextQuestion}
                    disabled={currentIndex === questions.length - 1 || !answers.has(currentIndex)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all shadow-lg"
                    style={{ background: GRADIENT, boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.3)" }}>
                    {isBangla ? "পরের" : "Next"}<ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ RESULTS STATE — Interactive & Exciting ═══ */}
          {showResults && (
            <ResultsScreen
              correct={correct} wrong={wrong} totalXP={totalXP} totalQuestions={questions.length}
              timeTaken={timeTaken} isBangla={isBangla} profileName={profile?.full_name || ""}
              onNewTopic={() => { setQuestions([]); setTopic(""); setShowResults(false); setAnswers(new Map()); }}
              onRetry={() => { setShowResults(false); generateQuestions(); }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// ── Live Timer Component ──
const LiveTimer = ({ startTime }: { startTime: Date | null }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(24px)", border: "1.5px solid rgba(255,255,255,0.6)" }}>
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-mono text-xs font-bold text-muted-foreground">{m}:{s.toString().padStart(2, "0")}</span>
    </div>
  );
};

// ── Results Screen Component ──
const ResultsScreen = ({
  correct, wrong, totalXP, totalQuestions, timeTaken, isBangla, profileName,
  onNewTopic, onRetry,
}: {
  correct: number; wrong: number; totalXP: number; totalQuestions: number; timeTaken: number;
  isBangla: boolean; profileName: string; onNewTopic: () => void; onRetry: () => void;
}) => {
  const percentage = Math.round((correct / totalQuestions) * 100);
  const isPerfect = correct === totalQuestions;
  const isGreat = percentage >= 70;
  const m = Math.floor(timeTaken / 60);
  const s = timeTaken % 60;
  const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

  const getMessage = () => {
    if (isPerfect) return isBangla ? "অসাধারণ! তুমি সেরা! 🏆" : "Incredible! You're a genius! 🏆";
    if (percentage >= 80) return isBangla ? "চমৎকার পারফরম্যান্স! 🌟" : "Outstanding performance! 🌟";
    if (isGreat) return isBangla ? "দারুণ কাজ করেছো! ✨" : "Great work! Keep it up! ✨";
    if (percentage >= 50) return isBangla ? "ভালো চেষ্টা! আরও একটু! 💪" : "Good try! Almost there! 💪";
    return isBangla ? "হাল ছেড়ো না! আবার চেষ্টা করো! 🔥" : "Don't give up! Try again! 🔥";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[70vh] gap-5 relative">
      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1.2, 0.6], y: [-20, -120 - i * 15], x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8)] }}
          transition={{ duration: 2.5, delay: 0.3 + i * 0.15, ease: "easeOut" }}
          className="absolute top-1/3 z-0"
          style={{ left: `${35 + (i % 5) * 8}%` }}
        >
          {i % 3 === 0 ? <Star className="w-4 h-4 text-warning fill-warning" /> : i % 3 === 1 ? <Sparkles className="w-4 h-4" style={{ color: "hsl(270, 60%, 55%)" }} /> : <Zap className="w-3 h-3" style={{ color: "hsl(30, 78%, 60%)" }} />}
        </motion.div>
      ))}

      {/* Mascot + Tugi duo */}
      <div className="relative flex items-end gap-4 z-10">
        {/* Mascot (main) */}
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }} className="relative">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: `radial-gradient(circle, ${isPerfect ? "hsla(145, 63%, 52%, 0.25)" : "hsla(270, 60%, 55%, 0.2)"}, transparent 70%)` }} />
          <motion.img src={mascotImg} alt="AI Mascot" className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl relative z-10"
            animate={{ y: [0, -12, 0], rotate: isPerfect ? [0, 5, -5, 0] : [0, -3, 3, 0] }}
            transition={{ duration: isPerfect ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }} />
          {isPerfect && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
              className="absolute -top-3 -right-1 z-20">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(45, 95%, 55%), hsl(30, 90%, 50%))", boxShadow: "0 4px 16px hsla(45, 95%, 55%, 0.4)" }}>
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>

      {/* Message */}
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-center z-10">
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground mb-1">{getMessage()}</h2>
        <p className="text-muted-foreground text-sm font-heading">
          {isBangla ? `${profileName}, তুমি ${totalQuestions}টি প্রশ্নের মধ্যে ${correct}টি সঠিক করেছো!` : `${profileName}, you got ${correct} out of ${totalQuestions} correct!`}
        </p>
      </motion.div>

      {/* Score Ring */}
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, type: "spring" }}
        className="relative w-32 h-32 z-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsla(270, 60%, 55%, 0.1)" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
            initial={{ strokeDasharray: "0 264" }} animate={{ strokeDasharray: `${(percentage / 100) * 264} 264` }}
            transition={{ delay: 0.9, duration: 1.5, ease: "easeOut" }} />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(300, 65%, 52%)" />
              <stop offset="50%" stopColor="hsl(270, 60%, 55%)" />
              <stop offset="100%" stopColor="hsl(30, 78%, 76%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="text-3xl font-extrabold font-heading" style={{ color: "hsl(270, 60%, 45%)" }}>
            {percentage}%
          </motion.span>
          <span className="text-[10px] font-semibold text-muted-foreground">{isBangla ? "সঠিকতা" : "Accuracy"}</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
        className="grid grid-cols-4 gap-2.5 w-full max-w-sm z-10">
        {[
          { value: correct, label: isBangla ? "সঠিক" : "Correct", color: "hsl(145, 63%, 52%)", icon: <CheckCircle2 className="w-4 h-4" /> },
          { value: wrong, label: isBangla ? "ভুল" : "Wrong", color: "hsl(0, 70%, 60%)", icon: <XCircle className="w-4 h-4" /> },
          { value: totalXP.toFixed(2), label: "XP", color: "hsl(270, 60%, 55%)", icon: <Zap className="w-4 h-4" /> },
          { value: timeStr, label: isBangla ? "সময়" : "Time", color: "hsl(30, 78%, 55%)", icon: <Clock className="w-4 h-4" /> },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.0 + i * 0.1 }}
            className="rounded-2xl p-3 text-center" style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.75))", backdropFilter: "blur(24px)",
              border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: `0 4px 16px ${item.color}20`,
            }}>
            <div className="flex justify-center mb-1.5" style={{ color: item.color }}>{item.icon}</div>
            <p className="text-lg font-extrabold font-heading" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Negative marking note */}
      {wrong > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="text-muted-foreground/60 text-[10px] font-heading z-10">
          {isBangla ? `⚠️ ভুল উত্তরে -0.25 XP কাটা হয়েছে` : `⚠️ -0.25 XP deducted for each wrong answer`}
        </motion.p>
      )}

      {/* Study time info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="rounded-2xl px-5 py-3 flex items-center gap-3 z-10" style={{
          background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.75))", backdropFilter: "blur(24px)",
          border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.08)",
        }}>
        <Brain className="w-5 h-5" style={{ color: "hsl(270, 60%, 55%)" }} />
        <p className="text-xs font-heading text-muted-foreground">
          {isBangla
            ? `📚 ${Math.max(1, Math.round(timeTaken / 60))} মিনিট পড়াশোনার সময় রেকর্ড করা হয়েছে`
            : `📚 ${Math.max(1, Math.round(timeTaken / 60))} min study time has been recorded`}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.6 }}
        className="flex gap-3 pt-1 z-10">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNewTopic}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold font-heading transition-all"
          style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270, 60%, 45%)" }}>
          <Target className="w-4 h-4" />{isBangla ? "নতুন টপিক" : "New Topic"}
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onRetry}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
          style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
          <RefreshCw className="w-4 h-4" />{isBangla ? "আবার চেষ্টা করো" : "Practice Again"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Practice;
