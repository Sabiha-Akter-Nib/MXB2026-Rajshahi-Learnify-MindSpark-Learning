import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Brain, CheckCircle2, XCircle, Trophy, Sparkles, Loader2, ArrowRight,
  RotateCcw, Target, Lightbulb, Zap, Star, Clock, Award, BookOpen, Calculator,
  BookText, Atom, FlaskConical, Leaf, Globe, Laptop, Languages, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TutorBackground from "@/components/tutor/TutorBackground";
import mascotImg from "@/assets/ai-mascot-3d.png";
import tugiImg from "@/assets/tugi-wave.png";
import subjectIcon3d from "@/assets/subject-icon-3d.png";

// ── Types ──
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
interface Subject {
  id: string;
  name: string;
  name_bn: string | null;
  icon: string;
  color: string;
  total_chapters: number;
}

// ── Constants ──
const GRADIENT = "linear-gradient(135deg, hsl(300, 65%, 52%) 0%, hsl(270, 60%, 55%) 40%, hsl(30, 78%, 76%) 100%)";

const BLOOM_LEVELS = [
  { id: "remember", label: "Remember", labelBn: "মনে রাখা", color: "hsl(270, 60%, 55%)" },
  { id: "understand", label: "Understand", labelBn: "বোঝা", color: "hsl(300, 65%, 52%)" },
  { id: "apply", label: "Apply", labelBn: "প্রয়োগ", color: "hsl(330, 70%, 55%)" },
  { id: "analyze", label: "Analyze", labelBn: "বিশ্লেষণ", color: "hsl(265, 58%, 52%)" },
  { id: "evaluate", label: "Evaluate", labelBn: "মূল্যায়ন", color: "hsl(345, 65%, 55%)" },
  { id: "create", label: "Create", labelBn: "সৃষ্টি", color: "hsl(30, 78%, 60%)" },
];

const iconMap: Record<string, React.ElementType> = {
  "book-text": BookText, languages: Languages, calculator: Calculator,
  atom: Atom, "flask-conical": FlaskConical, leaf: Leaf, globe: Globe,
  laptop: Laptop, book: BookOpen,
};

const subjectCardColors = [
  { bg: "linear-gradient(135deg, hsla(300, 65%, 52%, 0.25), hsla(300, 65%, 52%, 0.08))", border: "hsla(300, 65%, 52%, 0.3)", icon: "hsl(300, 65%, 52%)", shadow: "hsla(300, 65%, 52%, 0.2)", glow: "hsla(300, 65%, 52%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(270, 60%, 55%, 0.25), hsla(270, 60%, 55%, 0.08))", border: "hsla(270, 60%, 55%, 0.3)", icon: "hsl(270, 60%, 55%)", shadow: "hsla(270, 60%, 55%, 0.2)", glow: "hsla(270, 60%, 55%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(330, 70%, 55%, 0.25), hsla(330, 70%, 55%, 0.08))", border: "hsla(330, 70%, 55%, 0.3)", icon: "hsl(330, 70%, 55%)", shadow: "hsla(330, 70%, 55%, 0.2)", glow: "hsla(330, 70%, 55%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(30, 78%, 60%, 0.25), hsla(30, 78%, 60%, 0.08))", border: "hsla(30, 78%, 60%, 0.3)", icon: "hsl(30, 78%, 55%)", shadow: "hsla(30, 78%, 60%, 0.2)", glow: "hsla(30, 78%, 60%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(200, 65%, 52%, 0.25), hsla(200, 65%, 52%, 0.08))", border: "hsla(200, 65%, 52%, 0.3)", icon: "hsl(200, 65%, 52%)", shadow: "hsla(200, 65%, 52%, 0.2)", glow: "hsla(200, 65%, 52%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(145, 60%, 45%, 0.25), hsla(145, 60%, 45%, 0.08))", border: "hsla(145, 60%, 45%, 0.3)", icon: "hsl(145, 60%, 45%)", shadow: "hsla(145, 60%, 45%, 0.2)", glow: "hsla(145, 60%, 45%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(350, 65%, 55%, 0.25), hsla(350, 65%, 55%, 0.08))", border: "hsla(350, 65%, 55%, 0.3)", icon: "hsl(350, 65%, 55%)", shadow: "hsla(350, 65%, 55%, 0.2)", glow: "hsla(350, 65%, 55%, 0.15)" },
  { bg: "linear-gradient(135deg, hsla(45, 80%, 50%, 0.25), hsla(45, 80%, 50%, 0.08))", border: "hsla(45, 80%, 50%, 0.3)", icon: "hsl(45, 80%, 45%)", shadow: "hsla(45, 80%, 50%, 0.2)", glow: "hsla(45, 80%, 50%, 0.15)" },
];

const Assessment = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [profile, setProfile] = useState<{ class: number; version: string; full_name: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [topicInput, setTopicInput] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fromPlan = searchParams.get("fromPlan") === "true";
  const chapterNameParam = searchParams.get("chapterName");
  const subjectNameParam = searchParams.get("subjectName");
  const subjectIdParam = searchParams.get("subject");
  const topicParam = searchParams.get("topic") || "General Knowledge";
  const bloomLevelParam = searchParams.get("bloomLevel");

  const isBangla = profile?.version === "bangla";

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (!user) return;
    const fetch = async () => {
      const [profileRes, subjectsRes] = await Promise.all([
        supabase.from("profiles").select("class, version, full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("subjects").select("*"),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (subjectsRes.data && profileRes.data) {
        const cls = profileRes.data.class;
        setSubjects(subjectsRes.data.filter(s => s.min_class <= cls && s.max_class >= cls));
      }
      // If coming from learning plan or direct link, auto-start
      if (fromPlan && chapterNameParam) {
        setIsLoading(false);
        await generateFromPlan(profileRes.data);
      } else if (subjectIdParam) {
        // Auto-select subject from URL
        const s = subjectsRes.data?.find(s => s.id === subjectIdParam);
        if (s) {
          setSelectedSubject(s);
          setTopicInput(topicParam);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user, loading]);

  const generateFromPlan = async (prof: any) => {
    setIsGenerating(true);
    if (bloomLevelParam) {
      setBloomLevel(bloomLevelParam);
      const idx = BLOOM_LEVELS.findIndex(b => b.id === bloomLevelParam);
      if (idx !== -1) setBloomLevelIndex(idx);
    }
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { userId: user?.id, chapterName: chapterNameParam, subjectName: subjectNameParam || "", subjectId: subjectIdParam, bloomLevel: bloomLevelParam || "remember" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setQuestions(((data as any)?.questions as Question[]) || []);
      setSessionStartTime(new Date());
    } catch (err) {
      console.error("Error generating from plan:", err);
      toast({ title: "Error", description: "Failed to generate questions.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const startAssessment = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults(null);
    setSessionStartTime(new Date());
    try {
      // Get latest tutor context for this subject
      let tutorContext = "";
      const { data: conversations } = await supabase
        .from("chat_conversations").select("id").eq("user_id", user?.id)
        .order("updated_at", { ascending: false }).limit(1);
      if (conversations?.length) {
        const { data: messages } = await supabase
          .from("chat_messages").select("content").eq("conversation_id", conversations[0].id)
          .eq("role", "assistant").order("created_at", { ascending: false }).limit(1);
        if (messages?.length) tutorContext = messages[0].content;
      }

      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: {
          action: "generate",
          subjectId: selectedSubject.id,
          topic: topicInput || (isBangla ? selectedSubject.name_bn : selectedSubject.name),
          bloomLevel,
          tutorContext: tutorContext || `Assessment for ${selectedSubject.name}`,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setQuestions(((data as any)?.questions as Question[]) || []);
    } catch (err) {
      console.error("Error generating assessment:", err);
      toast({ title: "Error", description: "Failed to generate assessment.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (index: number) => setSelectedAnswer(index);

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
      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: { action: "submit", subjectId: selectedSubject?.id || subjectIdParam, topic: topicInput || topicParam, bloomLevel, answers: finalAnswers, questions },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResults(data as any);
      setShowResult(true);
    } catch (err) {
      console.error("Error submitting:", err);
      toast({ title: "Error", description: "Failed to submit assessment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextLevel = async () => {
    if (!results?.shouldLevelUp || !results.nextLevel) return;
    const nextIdx = BLOOM_LEVELS.findIndex(b => b.id === results.nextLevel);
    if (nextIdx === -1) return;
    setBloomLevelIndex(nextIdx);
    setBloomLevel(results.nextLevel);
    setShowResult(false);
    setResults(null);
    setIsGenerating(true);
    try {
      let tutorContext = "";
      const { data: convs } = await supabase.from("chat_conversations").select("id").eq("user_id", user?.id).order("updated_at", { ascending: false }).limit(1);
      if (convs?.length) {
        const { data: msgs } = await supabase.from("chat_messages").select("content").eq("conversation_id", convs[0].id).eq("role", "assistant").order("created_at", { ascending: false }).limit(1);
        if (msgs?.length) tutorContext = msgs[0].content;
      }
      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: { action: "generate", subjectId: selectedSubject?.id || subjectIdParam, topic: topicInput || topicParam, bloomLevel: results.nextLevel, tutorContext: tutorContext || "Assessment" },
      });
      if (error) throw error;
      setQuestions(((data as any)?.questions as Question[]) || []);
      setCurrentIndex(0); setAnswers([]); setSelectedAnswer(null); setSessionStartTime(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setResults(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    startAssessment();
  };

  const getTimeTaken = () => {
    if (!sessionStartTime) return 0;
    return Math.round((Date.now() - sessionStartTime.getTime()) / 1000);
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentBloom = BLOOM_LEVELS.find(b => b.id === bloomLevel);
  const isLastLevel = bloomLevelIndex >= BLOOM_LEVELS.length - 1;
  const hasWrongAnswers = results?.results.some(r => !r.isCorrect);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TutorBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ═══ SUBJECT SELECTION SCREEN ═══
  if (!selectedSubject && !fromPlan && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/50" asChild>
                <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 hsla(270,50%,75%,0)", "0 0 12px 4px hsla(270,50%,75%,0.15)", "0 0 0 0 hsla(270,50%,75%,0)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
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
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider font-heading text-white" style={{ background: GRADIENT }}>Assessment</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-heading">
                    <span className="w-1.5 h-1.5 bg-[hsl(145,63%,52%)] rounded-full animate-pulse" />
                    {profile ? `Class ${profile.class} • ${isBangla ? "বাংলা" : "English"}` : "Online"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col items-center px-4">
              {/* Mascot */}
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="relative mb-4">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: "radial-gradient(circle, hsla(300, 55%, 65%, 0.2), transparent 70%)" }} />
                <motion.img src={mascotImg} alt="AI" className="w-32 h-32 sm:w-40 sm:h-40 relative z-10 drop-shadow-2xl"
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1">
                  {isBangla ? "বিষয় নির্বাচন করো 📝" : "Choose a Subject 📝"}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
                  {isBangla ? "মূল্যায়নের জন্য একটি বিষয় বেছে নাও" : "Select a subject for your assessment"}
                </p>
              </motion.div>

              {/* Subject Cards Grid */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                className="grid grid-cols-2 gap-3 w-full max-w-md">
                {subjects.map((subject, idx) => {
                  const Icon = iconMap[subject.icon] || BookOpen;
                  const colors = subjectCardColors[idx % subjectCardColors.length];
                  return (
                    <motion.button key={subject.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedSubject(subject)}
                      className="rounded-2xl p-4 text-left transition-all relative overflow-hidden"
                      style={{
                        background: colors.bg,
                        backdropFilter: "blur(24px) saturate(1.5)",
                        border: `1.5px solid ${colors.border}`,
                        boxShadow: `0 8px 24px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                      }}
                    >
                      {/* Glow orb */}
                      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-40" style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }} />
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${colors.icon}15`, boxShadow: `0 2px 8px ${colors.shadow}` }}>
                          <img src={subjectIcon3d} alt="" className="w-7 h-7 object-contain" />
                        </div>
                        <p className="font-heading font-bold text-sm text-foreground leading-tight">
                          {isBangla ? subject.name_bn || subject.name : subject.name}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ═══ SUBJECT SELECTED — Topic + Bloom Setup ═══
  if (selectedSubject && questions.length === 0 && !isGenerating && !fromPlan) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedSubject(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: subjectCardColors[subjects.indexOf(selectedSubject) % subjectCardColors.length]?.bg }}>
                {(() => { const Icon = iconMap[selectedSubject.icon] || BookOpen; return <Icon className="w-5 h-5" style={{ color: subjectCardColors[subjects.indexOf(selectedSubject) % subjectCardColors.length]?.icon }} />; })()}
              </div>
              <div>
                <h1 className="font-heading font-bold text-base text-foreground">
                  {isBangla ? selectedSubject.name_bn || selectedSubject.name : selectedSubject.name}
                </h1>
                <p className="text-[11px] text-muted-foreground font-heading">{isBangla ? "মূল্যায়ন সেটআপ" : "Assessment Setup"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-4">
            {/* Topic Input (optional) */}
            <div className="w-full rounded-2xl overflow-hidden" style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
              backdropFilter: "blur(24px) saturate(1.5)", border: "1.5px solid rgba(255,255,255,0.6)",
            }}>
              <input type="text" value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                placeholder={isBangla ? "নির্দিষ্ট টপিক লেখো (ঐচ্ছিক)..." : "Enter specific topic (optional)..."}
                className="w-full px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-heading" />
            </div>

            {/* Bloom Level */}
            <div className="w-full">
              <p className="text-muted-foreground text-xs text-center mb-2 font-heading">{isBangla ? "ব্লুম লেভেল" : "Bloom's Level"}</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {BLOOM_LEVELS.map((level) => (
                  <button key={level.id} onClick={() => { setBloomLevel(level.id); setBloomLevelIndex(BLOOM_LEVELS.indexOf(level)); }}
                    className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all"
                    style={{
                      background: bloomLevel === level.id ? "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))" : "transparent",
                      border: bloomLevel === level.id ? `1.5px solid ${level.color}40` : "1.5px solid rgba(0,0,0,0.08)",
                      color: bloomLevel === level.id ? level.color : "hsl(0, 0%, 50%)",
                      backdropFilter: bloomLevel === level.id ? "blur(20px)" : "none",
                    }}
                  >
                    {isBangla ? level.labelBn : level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startAssessment}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading shadow-lg"
              style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
              <Sparkles className="w-5 h-5" />
              {isBangla ? "মূল্যায়ন শুরু করো" : "Start Assessment"}
            </motion.button>
          </div>
        </main>
      </div>
    );
  }

  // ═══ GENERATING ═══
  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <motion.img src={mascotImg} alt="Thinking" className="w-28 h-28 drop-shadow-2xl"
            animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(270, 60%, 55%)" }} />
            <p className="text-muted-foreground text-sm font-heading">{isBangla ? "মূল্যায়ন তৈরি হচ্ছে..." : "Generating assessment..."}</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══ RESULTS ═══
  if (showResult && results) {
    const timeTaken = getTimeTaken();
    const m = Math.floor(timeTaken / 60);
    const s = timeTaken % 60;
    const timeStr = `${m}:${s.toString().padStart(2, "0")}`;
    const correctCount = results.results.filter(r => r.isCorrect).length;
    const percentage = results.score;

    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="font-heading font-bold text-base text-foreground">{isBangla ? "মূল্যায়ন সম্পন্ন" : "Assessment Complete"}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-5">
            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0.5], y: [-20, -100 - i * 12], x: [(i % 2 === 0 ? 1 : -1) * (15 + i * 6)] }}
                transition={{ duration: 2.5, delay: 0.3 + i * 0.15 }} className="absolute top-1/4 z-0" style={{ left: `${35 + (i % 4) * 8}%` }}>
                {i % 2 === 0 ? <Star className="w-4 h-4 text-warning fill-warning" /> : <Sparkles className="w-4 h-4" style={{ color: "hsl(270, 60%, 55%)" }} />}
              </motion.div>
            ))}

            {/* Mascot + Tugi */}
            <div className="relative flex items-end gap-4 z-10">
              <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="relative">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: `radial-gradient(circle, ${percentage >= 80 ? "hsla(145,63%,52%,0.25)" : "hsla(270,60%,55%,0.2)"}, transparent 70%)` }} />
                <motion.img src={mascotImg} alt="AI" className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl relative z-10"
                  animate={{ y: [0, -12, 0], rotate: percentage >= 80 ? [0, 5, -5, 0] : [0, -3, 3, 0] }}
                  transition={{ duration: percentage >= 80 ? 1.5 : 3, repeat: Infinity }} />
                {percentage >= 80 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="absolute -top-3 -right-1 z-20">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(45,95%,55%), hsl(30,90%,50%))", boxShadow: "0 4px 16px hsla(45,95%,55%,0.4)" }}>
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
              <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}>
                <motion.img src={tugiImg} alt="Tugi" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
              </motion.div>
            </div>

            {/* Score Ring */}
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, type: "spring" }} className="relative w-32 h-32 z-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsla(270,60%,55%,0.1)" strokeWidth="8" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#aScoreGrad)" strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: "0 264" }} animate={{ strokeDasharray: `${(percentage / 100) * 264} 264` }}
                  transition={{ delay: 0.9, duration: 1.5, ease: "easeOut" }} />
                <defs><linearGradient id="aScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(300,65%,52%)" /><stop offset="50%" stopColor="hsl(270,60%,55%)" /><stop offset="100%" stopColor="hsl(30,78%,76%)" />
                </linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                  className="text-3xl font-extrabold font-heading" style={{ color: "hsl(270,60%,45%)" }}>{percentage}%</motion.span>
                <span className="text-[10px] font-semibold text-muted-foreground">{isBangla ? "স্কোর" : "Score"}</span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="grid grid-cols-4 gap-2.5 w-full max-w-sm z-10">
              {[
                { value: correctCount, label: isBangla ? "সঠিক" : "Correct", color: "hsl(145,63%,52%)", icon: <CheckCircle2 className="w-4 h-4" /> },
                { value: results.results.length - correctCount, label: isBangla ? "ভুল" : "Wrong", color: "hsl(0,70%,60%)", icon: <XCircle className="w-4 h-4" /> },
                { value: `+${results.xpEarned}`, label: "XP", color: "hsl(270,60%,55%)", icon: <Zap className="w-4 h-4" /> },
                { value: timeStr, label: isBangla ? "সময়" : "Time", color: "hsl(30,78%,55%)", icon: <Clock className="w-4 h-4" /> },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 + i * 0.1 }}
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

            {/* Bloom badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
              className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: currentBloom?.color }}>
              {currentBloom?.label} Level
            </motion.div>

            {/* Level up message */}
            {results.shouldLevelUp && !isLastLevel && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
                className="rounded-2xl p-4 text-center z-10" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.75))", backdropFilter: "blur(24px)",
                  border: "1.5px solid hsla(145, 63%, 52%, 0.2)", boxShadow: "0 4px 16px hsla(145, 63%, 52%, 0.1)",
                }}>
                <p className="font-bold text-sm font-heading" style={{ color: "hsl(145, 63%, 45%)" }}>
                  🎉 {isBangla ? "অভিনন্দন! তুমি লেভেল আপ করেছো!" : "Congratulations! You've leveled up!"}
                </p>
              </motion.div>
            )}

            {/* Question Review */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="w-full max-w-md space-y-2 z-10">
              {results.results.map((result, i) => (
                <div key={i} className="rounded-xl p-3 flex items-start gap-3" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)",
                  border: result.isCorrect ? "1.5px solid hsla(145, 63%, 52%, 0.3)" : "1.5px solid rgba(255,255,255,0.5)",
                }}>
                  {result.isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(145,63%,52%)" }} /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                  <div>
                    <p className="text-xs font-medium text-foreground">{result.question}</p>
                    {!result.isCorrect && <p className="text-[11px] text-muted-foreground mt-1">{result.explanation}</p>}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.6 }} className="flex gap-3 pt-1 z-10">
              {fromPlan ? (
                <Link to="/dashboard">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: GRADIENT }}>
                    <ArrowLeft className="w-4 h-4" />{isBangla ? "ড্যাশবোর্ড" : "Dashboard"}
                  </motion.button>
                </Link>
              ) : hasWrongAnswers ? (
                <>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedSubject(null); setQuestions([]); setShowResult(false); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold font-heading"
                    style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270,60%,45%)" }}>
                    <Target className="w-4 h-4" />{isBangla ? "অন্য বিষয়" : "Other Subject"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleTryAgain}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: GRADIENT }}>
                    <RotateCcw className="w-4 h-4" />{isBangla ? "আবার চেষ্টা" : "Try Again"}
                  </motion.button>
                </>
              ) : isLastLevel ? (
                <Link to="/dashboard">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: GRADIENT }}>
                    <ArrowLeft className="w-4 h-4" />{isBangla ? "ড্যাশবোর্ড" : "Dashboard"}
                  </motion.button>
                </Link>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedSubject(null); setQuestions([]); setShowResult(false); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold font-heading"
                    style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270,60%,45%)" }}>
                    <Target className="w-4 h-4" />{isBangla ? "অন্য বিষয়" : "Other Subject"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleNextLevel}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, hsl(145,63%,48%), hsl(160,60%,45%))", boxShadow: "0 4px 16px hsla(145,63%,48%,0.35)" }}>
                    {isBangla ? "পরবর্তী লেভেল" : "Next Level"}<ArrowRight className="w-4 h-4" />
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ═══ QUESTION SCREEN ═══
  return (
    <div className="min-h-screen flex flex-col relative">
      <TutorBackground />
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div>
                <h1 className="font-heading font-bold text-sm text-foreground">
                  {topicInput || (selectedSubject ? (isBangla ? selectedSubject.name_bn : selectedSubject.name) : topicParam)}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: currentBloom?.color }}>{currentBloom?.label}</span>
                  <span className="text-[11px] text-muted-foreground font-heading">{currentIndex + 1}/{questions.length}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 rounded-full bg-muted/50 overflow-hidden">
            <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ background: GRADIENT }} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Question Card */}
                <div className="rounded-2xl p-5 sm:p-6" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))", backdropFilter: "blur(24px) saturate(1.5)",
                  border: "1.5px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px hsla(270,60%,55%,0.08)",
                }}>
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT }}>
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">{currentQuestion.question}</p>
                  </div>

                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectAnswer(i)}
                        className="w-full p-3.5 sm:p-4 rounded-xl text-left flex items-center gap-3 transition-all"
                        style={selectedAnswer === i ? {
                          background: "linear-gradient(-45deg, hsla(270, 60%, 97%, 0.95), hsla(300, 55%, 97%, 0.9))",
                          border: "2px solid hsl(270, 60%, 55%)", boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.2)",
                        } : {
                          background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))",
                          backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)",
                        }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white"
                          style={{ background: selectedAnswer === i ? "hsl(270, 60%, 55%)" : GRADIENT }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground">{option}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Next/Submit Button */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleNext} disabled={selectedAnswer === null || isSubmitting}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading disabled:opacity-40 shadow-lg"
                  style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : currentIndex === questions.length - 1 ? (
                    <>{isBangla ? "জমা দাও" : "Submit"}<Award className="w-5 h-5" /></>
                  ) : (
                    <>{isBangla ? "পরবর্তী" : "Next"}<ChevronRight className="w-5 h-5" /></>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Assessment;
