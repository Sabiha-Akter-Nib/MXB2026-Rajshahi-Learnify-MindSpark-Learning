import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Brain, CheckCircle2, XCircle, Trophy, Sparkles, Loader2,
  Target, Lightbulb, Zap, Star, Clock, Award, BookOpen, Calculator,
  BookText, Atom, FlaskConical, Leaf, Globe, Laptop, Languages,
  LayoutDashboard, RefreshCw, Plus, X, Timer, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TutorBackground from "@/components/tutor/TutorBackground";
import mascotImg from "@/assets/ai-mascot-3d.png";
import subjectIcon3d from "@/assets/assessment-subject-icon.png";
import statXp3d from "@/assets/stat-xp-3d.png";

// ── Types ──
interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpValue: number;
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
const QUESTION_COUNTS = [10, 15, 20, 25, 30, 40, 50];
const TIME_LIMITS = [
  { value: 0, label: "No Limit", labelBn: "সীমাহীন" },
  { value: 10, label: "10 min", labelBn: "১০ মি" },
  { value: 15, label: "15 min", labelBn: "১৫ মি" },
  { value: 20, label: "20 min", labelBn: "২০ মি" },
  { value: 30, label: "30 min", labelBn: "৩০ মি" },
  { value: 45, label: "45 min", labelBn: "৪৫ মি" },
  { value: 60, label: "60 min", labelBn: "৬০ মি" },
  { value: 90, label: "90 min", labelBn: "৯০ মি" },
];

interface AdditionalSubjectEntry {
  subject: Subject | null;
  chapter: string;
}

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

// ── Live Timer with time limit support ──
const LiveTimer = ({ startTime, timeLimitMin, onTimeExpired }: { startTime: Date; timeLimitMin: number; onTimeExpired?: () => void }) => {
  const [elapsed, setElapsed] = useState(0);
  const expiredRef = useRef(false);
  useEffect(() => {
    const interval = setInterval(() => {
      const e = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(e);
      if (timeLimitMin > 0 && e >= timeLimitMin * 60 && !expiredRef.current) {
        expiredRef.current = true;
        onTimeExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, timeLimitMin]);

  if (timeLimitMin > 0) {
    const remaining = Math.max(0, timeLimitMin * 60 - elapsed);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const isLow = remaining <= 60;
    return <span className="font-bold text-xs font-heading" style={{ color: isLow ? "hsl(0,70%,55%)" : "hsl(270,60%,55%)" }}>{m}:{s.toString().padStart(2, "0")}</span>;
  }
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span className="font-bold text-xs font-heading" style={{ color: "hsl(270,60%,55%)" }}>{m}:{s.toString().padStart(2, "0")}</span>;
};

const Assessment = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [profile, setProfile] = useState<{ class: number; version: string; full_name: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lockedAnswers, setLockedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [chapterInput, setChapterInput] = useState("");
  const [questionCount, setQuestionCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(0); // in minutes, 0 = no limit
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalEntries, setAdditionalEntries] = useState<AdditionalSubjectEntry[]>([]);
  const [timeExpired, setTimeExpired] = useState(false);

  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      setIsLoading(false);
    };
    fetch();
  }, [user, loading]);

  const startModelTest = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    setQuestions([]);
    setLockedAnswers({});
    setShowResult(false);
    setResultData(null);
    setTimeExpired(false);
    setSessionStartTime(new Date());

    // Combine all subjects + chapters
    const allChapters = [chapterInput, ...additionalEntries.map(e => e.chapter)].filter(Boolean).join(", ");
    const allSubjectNames = [selectedSubject.name, ...additionalEntries.map(e => e.subject?.name).filter(Boolean)].join(", ");
    const combinedTopic = [allChapters ? `Chapters: ${allChapters}` : ""].filter(Boolean).join(" | ") || (isBangla ? selectedSubject.name_bn : selectedSubject.name);

    try {
      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: {
          action: "generate",
          subjectId: selectedSubject.id,
          topic: combinedTopic,
          bloomLevel: "mixed",
          count: questionCount,
          subjectName: allSubjectNames,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const qs = ((data as any)?.questions as Question[]) || [];
      setQuestions(qs);
    } catch (err) {
      console.error("Error generating model test:", err);
      toast({ title: "Error", description: "Failed to generate model test.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTimeExpired = () => {
    setTimeExpired(true);
    toast({ title: isBangla ? "⏰ সময় শেষ!" : "⏰ Time's up!", description: isBangla ? "স্বয়ংক্রিয়ভাবে জমা দেওয়া হচ্ছে..." : "Auto-submitting your test..." });
    // Auto-submit with whatever answers exist
    setTimeout(() => autoSubmitOnExpiry(), 500);
  };

  const autoSubmitOnExpiry = async () => {
    setIsSubmitting(true);
    const finalAnswers = questions.map((_, i) => lockedAnswers[i] ?? -1);
    try {
      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: {
          action: "submit",
          subjectId: selectedSubject?.id,
          topic: chapterInput || (selectedSubject ? (isBangla ? selectedSubject.name_bn : selectedSubject.name) : ""),
          bloomLevel: "mixed",
          answers: finalAnswers,
          questions,
        },
      });
      if (error) throw error;
      const timeTaken = sessionStartTime ? Math.round((Date.now() - sessionStartTime.getTime()) / 1000) : 0;
      try {
        await supabase.functions.invoke("track-session", {
          body: { userId: user?.id, subjectId: selectedSubject?.id, topic: chapterInput || selectedSubject?.name, duration: Math.max(1, Math.round(timeTaken / 60)), xpEarned: Math.round((data as any)?.xpEarned || 0), bloomLevel: "mixed" },
        });
      } catch (e) {}
      setResultData({ ...(data as any), timeTaken });
      setShowResult(true);
    } catch (err) {
      console.error("Auto-submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lockAnswer = (qIdx: number, optIdx: number) => {
    if (lockedAnswers[qIdx] !== undefined) return; // already locked
    setLockedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const answeredCount = Object.keys(lockedAnswers).length;
  const allAnswered = answeredCount === questions.length;

  const submitModelTest = async () => {
    if (!allAnswered) {
      toast({ title: isBangla ? "সব প্রশ্নের উত্তর দাও" : "Answer all questions", description: isBangla ? `${questions.length - answeredCount}টি প্রশ্ন বাকি আছে` : `${questions.length - answeredCount} questions remaining`, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const finalAnswers = questions.map((_, i) => lockedAnswers[i] ?? -1);
    try {
      const { data, error } = await supabase.functions.invoke("run-assessment", {
        body: {
          action: "submit",
          subjectId: selectedSubject?.id,
          topic: chapterInput || (selectedSubject ? (isBangla ? selectedSubject.name_bn : selectedSubject.name) : ""),
          bloomLevel: "mixed",
          answers: finalAnswers,
          questions,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // Track session
      const timeTaken = sessionStartTime ? Math.round((Date.now() - sessionStartTime.getTime()) / 1000) : 0;
      try {
        await supabase.functions.invoke("track-session", {
          body: {
            userId: user?.id,
            subjectId: selectedSubject?.id,
            topic: chapterInput || selectedSubject?.name,
            duration: Math.max(1, Math.round(timeTaken / 60)),
            xpEarned: Math.round((data as any)?.xpEarned || 0),
            bloomLevel: "mixed",
          },
        });
      } catch (e) { console.error("Track session error:", e); }

      // Check achievements
      try {
        await supabase.functions.invoke("check-achievements", { body: { userId: user?.id, trigger: "assessment" } });
      } catch (e) { console.error(e); }

      setResultData({ ...(data as any), timeTaken });
      setShowResult(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast({ title: "Error", description: "Failed to submit.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══ LOADING ═══
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TutorBackground />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ═══ RESULTS SCREEN ═══
  if (showResult && resultData) {
    const { correctCount, totalQuestions, xpEarned, results, score, timeTaken } = resultData;
    const wrong = totalQuestions - correctCount;
    const m = Math.floor((timeTaken || 0) / 60);
    const s = (timeTaken || 0) % 60;
    const timeStr = `${m}:${s.toString().padStart(2, "0")}`;
    const percentage = score || 0;

    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="font-heading font-bold text-base text-foreground">{isBangla ? "মডেল টেস্ট সম্পন্ন" : "Model Test Complete"}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-5">
            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0.5], y: [-20, -100 - i * 12], x: [(i % 2 === 0 ? 1 : -1) * (15 + i * 6)] }}
                transition={{ duration: 2.5, delay: 0.3 + i * 0.15 }} className="absolute top-1/4 z-0" style={{ left: `${35 + (i % 4) * 8}%` }}>
                {i % 2 === 0 ? <Star className="w-4 h-4 text-warning fill-warning" /> : <Sparkles className="w-4 h-4" style={{ color: "hsl(270, 60%, 55%)" }} />}
              </motion.div>
            ))}

            {/* Mascot */}
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="relative z-10">
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

            {/* Message */}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-center z-10">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground">
                {percentage >= 90 ? (isBangla ? "অসাধারণ! তুমি সেরা! 🏆" : "Incredible! 🏆") :
                 percentage >= 70 ? (isBangla ? "দারুণ কাজ করেছো! ✨" : "Great work! ✨") :
                 percentage >= 50 ? (isBangla ? "ভালো চেষ্টা! 💪" : "Good try! 💪") :
                 (isBangla ? "হাল ছেড়ো না! 🔥" : "Don't give up! 🔥")}
              </h2>
            </motion.div>

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

            {/* Stats Cards */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
              className="grid grid-cols-2 gap-3 w-full max-w-sm z-10">
              {[
                { value: correctCount, label: isBangla ? "সঠিক" : "Correct", color: "hsl(145, 63%, 52%)", icon: <CheckCircle2 className="w-5 h-5" />, bg: "rgba(34,197,94,0.08)" },
                { value: wrong, label: isBangla ? "ভুল" : "Wrong", color: "hsl(0, 70%, 60%)", icon: <XCircle className="w-5 h-5" />, bg: "rgba(239,68,68,0.08)" },
                { value: xpEarned?.toFixed?.(2) ?? xpEarned, label: "XP", color: "hsl(270, 60%, 55%)", icon: <Zap className="w-5 h-5" />, bg: "rgba(139,92,246,0.08)" },
                { value: timeStr, label: isBangla ? "সময়" : "Time", color: "hsl(30, 78%, 55%)", icon: <Clock className="w-5 h-5" />, bg: "rgba(249,115,22,0.08)" },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 1.0 + i * 0.12, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.04, y: -3 }}
                  className="rounded-2xl p-4 flex items-center gap-3 cursor-default" style={{
                    background: `linear-gradient(135deg, ${item.bg}, rgba(254,254,254,0.92))`, backdropFilter: "blur(24px) saturate(1.4)",
                    border: `1.5px solid ${item.color}25`, boxShadow: `0 8px 24px ${item.color}15, 0 2px 8px rgba(0,0,0,0.04)`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}18`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold font-heading leading-none" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1">{item.label}</p>
                  </div>
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
                border: "1.5px solid rgba(255,255,255,0.6)",
              }}>
              <Brain className="w-5 h-5" style={{ color: "hsl(270, 60%, 55%)" }} />
              <p className="text-xs font-heading text-muted-foreground">
                {isBangla
                  ? `📚 ${Math.max(1, Math.round((timeTaken || 0) / 60))} মিনিট পড়াশোনার সময় রেকর্ড করা হয়েছে`
                  : `📚 ${Math.max(1, Math.round((timeTaken || 0) / 60))} min study time recorded`}
              </p>
            </motion.div>

            {/* Question Review */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="w-full max-w-md space-y-2 z-10">
              <p className="text-xs font-heading font-bold text-muted-foreground mb-2">{isBangla ? "প্রশ্ন পর্যালোচনা" : "Question Review"}</p>
              {(results || []).map((result: any, i: number) => (
                <div key={i} className="rounded-xl p-3 flex items-start gap-3" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)",
                  border: result.isCorrect ? "1.5px solid hsla(145, 63%, 52%, 0.3)" : "1.5px solid hsla(0, 70%, 60%, 0.2)",
                }}>
                  {result.isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(145,63%,52%)" }} /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(0,70%,60%)" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{i + 1}. {result.question}</p>
                    {!result.isCorrect && <p className="text-[11px] text-muted-foreground mt-1">💡 {result.explanation}</p>}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.7 }}
              className="flex flex-col gap-3 pt-1 z-10 w-full max-w-sm">
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedSubject(null); setQuestions([]); setShowResult(false); setLockedAnswers({}); }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold font-heading transition-all"
                  style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270, 60%, 45%)" }}>
                  <Target className="w-4 h-4" />{isBangla ? "নতুন টেস্ট" : "New Test"}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setLockedAnswers({}); setShowResult(false); setResultData(null); startModelTest(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
                  style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
                  <RefreshCw className="w-4 h-4" />{isBangla ? "আবার দাও" : "Retake"}
                </motion.button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => window.location.href = '/dashboard'}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold font-heading transition-all"
                style={{ background: "linear-gradient(135deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.5)", color: "hsl(270, 60%, 45%)" }}>
                <LayoutDashboard className="w-4 h-4" />{isBangla ? "ড্যাশবোর্ডে যাও" : "Go to Dashboard"}
              </motion.button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ═══ SUBJECT SELECTION SCREEN ═══
  if (!selectedSubject && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
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
                </div>
                <div>
                  <h1 className="font-heading font-bold text-base text-foreground">{isBangla ? "মডেল টেস্ট 📝" : "Model Test 📝"}</h1>
                  <p className="text-[11px] text-muted-foreground font-heading">{isBangla ? "বিষয় নির্বাচন করো" : "Choose a subject"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
            {/* Mascot */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="relative">
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full scale-[2.5]" style={{ background: "radial-gradient(circle, hsla(300, 55%, 65%, 0.2), transparent 70%)" }} />
              <motion.img src={mascotImg} alt="AI" className="w-32 h-32 sm:w-40 sm:h-40 relative z-10 drop-shadow-2xl"
                animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mb-1">
                {isBangla ? "বিষয় নির্বাচন করো 📝" : "Choose a Subject 📝"}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
                {isBangla ? "মডেল টেস্ট দিতে বিষয় নির্বাচন করো" : "Select a subject for your model test"}
              </p>
            </motion.div>

            {/* Subject Cards Grid */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
              className="grid grid-cols-2 gap-3 w-full max-w-md">
              {subjects.map((subject, idx) => {
                const colors = subjectCardColors[idx % subjectCardColors.length];
                return (
                  <motion.button key={subject.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedSubject(subject)}
                    className="rounded-[20px] relative overflow-hidden p-4 flex flex-col justify-end min-h-[110px] text-left transition-all"
                    style={{
                      background: colors.bg,
                      backdropFilter: "blur(24px) saturate(1.5)",
                      border: `1.5px solid ${colors.border}`,
                      boxShadow: `0 8px 28px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                    }}
                  >
                    <img src={mascotImg} alt="" className="absolute -top-3 -right-3 w-16 h-16 object-contain pointer-events-none" style={{ opacity: 0.12 }} />
                    <img src={statXp3d} alt="" className="absolute bottom-1 right-2 w-10 h-10 object-contain pointer-events-none" style={{ opacity: 0.1 }} />
                    <img src={subjectIcon3d} alt="" className="absolute top-1 left-[40%] w-14 h-14 object-contain pointer-events-none" style={{ opacity: 0.08 }} />
                    <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`, opacity: 0.35 }} />
                    <p className="relative z-10 font-heading font-extrabold text-base sm:text-lg leading-tight" style={{ color: colors.icon }}>
                      {isBangla ? subject.name_bn || subject.name : subject.name}
                    </p>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ═══ SETUP SCREEN (Topic + Question Count) ═══
  if (selectedSubject && questions.length === 0 && !isGenerating) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <TutorBackground />
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-card/80 border-b border-border/15">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedSubject(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading font-bold text-base text-foreground">
                {isBangla ? selectedSubject.name_bn || selectedSubject.name : selectedSubject.name}
              </h1>
              <p className="text-[11px] text-muted-foreground font-heading">{isBangla ? "মডেল টেস্ট সেটআপ" : "Model Test Setup"}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-4">
            {/* Chapter Input */}
            <div className="w-full rounded-2xl overflow-hidden" style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
              backdropFilter: "blur(24px) saturate(1.5)", border: "1.5px solid rgba(255,255,255,0.6)",
            }}>
              <input type="text" value={chapterInput} onChange={(e) => setChapterInput(e.target.value)}
                placeholder={isBangla ? "অধ্যায়ের নাম বা নম্বর..." : "Chapter name or number..."}
                className="w-full px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-heading" />
            </div>

            {/* Additional Subject Entries */}
            {additionalEntries.map((entry, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl p-3 space-y-2 relative" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                  backdropFilter: "blur(24px) saturate(1.5)", border: "1.5px solid rgba(255,255,255,0.6)",
                }}>
                <button onClick={() => setAdditionalEntries(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <p className="text-[10px] font-bold text-muted-foreground font-heading">{isBangla ? `অতিরিক্ত বিষয় ${idx + 1}` : `Additional Subject ${idx + 1}`}</p>
                <select
                  value={entry.subject?.id || ""}
                  onChange={(e) => {
                    const s = subjects.find(s => s.id === e.target.value) || null;
                    setAdditionalEntries(prev => prev.map((en, i) => i === idx ? { ...en, subject: s } : en));
                  }}
                  className="w-full px-3 py-2 bg-transparent text-sm text-foreground outline-none font-heading rounded-xl border border-border/20"
                >
                  <option value="">{isBangla ? "বিষয় নির্বাচন করো" : "Select subject"}</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{isBangla ? s.name_bn || s.name : s.name}</option>)}
                </select>
                <input type="text" value={entry.chapter}
                  onChange={(e) => setAdditionalEntries(prev => prev.map((en, i) => i === idx ? { ...en, chapter: e.target.value } : en))}
                  placeholder={isBangla ? "অধ্যায়..." : "Chapter..."}
                  className="w-full px-3 py-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none font-heading rounded-xl border border-border/20" />
              </motion.div>
            ))}

            {/* Add Another Subject Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAdditionalEntries(prev => [...prev, { subject: null, topic: "", chapter: "" }])}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-heading transition-all"
              style={{ background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))", backdropFilter: "blur(20px)", border: "1.5px dashed hsla(270,60%,55%,0.3)", color: "hsl(270,60%,55%)" }}>
              <Plus className="w-4 h-4" />{isBangla ? "আরেকটি বিষয় + টপিক যোগ করো" : "Add another subject + topic"}
            </motion.button>

            {/* Question Count Selector */}
            <div className="w-full">
              <p className="text-muted-foreground text-xs text-center mb-2 font-heading">{isBangla ? "প্রশ্ন সংখ্যা" : "Number of Questions"}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUESTION_COUNTS.map((c) => (
                  <motion.button key={c} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setQuestionCount(c)}
                    className="px-4 py-2 rounded-full text-xs font-bold font-heading transition-all"
                    style={questionCount === c ? {
                      background: GRADIENT, color: "white",
                      boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.3)",
                    } : {
                      background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                      backdropFilter: "blur(20px)", border: "1.5px solid rgba(0,0,0,0.08)",
                      color: "hsl(0, 0%, 50%)",
                    }}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Time Limit Selector */}
            <div className="w-full">
              <p className="text-muted-foreground text-xs text-center mb-2 font-heading">{isBangla ? "⏱️ সময়সীমা" : "⏱️ Time Limit"}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TIME_LIMITS.map((t) => (
                  <motion.button key={t.value} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setTimeLimit(t.value)}
                    className="px-3.5 py-2 rounded-full text-xs font-bold font-heading transition-all"
                    style={timeLimit === t.value ? {
                      background: "linear-gradient(135deg, hsl(30,78%,55%), hsl(345,65%,55%))", color: "white",
                      boxShadow: "0 4px 16px hsla(30, 78%, 55%, 0.3)",
                    } : {
                      background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
                      backdropFilter: "blur(20px)", border: "1.5px solid rgba(0,0,0,0.08)",
                      color: "hsl(0, 0%, 50%)",
                    }}
                  >
                    {isBangla ? t.labelBn : t.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="rounded-2xl p-4 w-full" style={{
              background: "linear-gradient(-45deg, rgba(254,254,254,0.92), rgba(254,254,254,0.7))",
              backdropFilter: "blur(24px)", border: "1.5px solid rgba(255,255,255,0.6)",
            }}>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(30,78%,55%)" }} />
                <div className="text-xs text-muted-foreground font-heading space-y-1">
                  <p>{isBangla ? "• সব প্রশ্ন একসাথে দেখা যাবে" : "• All questions visible at once"}</p>
                  <p>{isBangla ? "• উত্তর একবার দিলে পরিবর্তন করা যাবে না" : "• Answers lock once selected"}</p>
                  <p>{isBangla ? "• প্রতিটি সঠিক উত্তরে +1 XP" : "• +1 XP per correct answer"}</p>
                  <p>{isBangla ? "• প্রতিটি ভুল উত্তরে -0.25 XP" : "• -0.25 XP per wrong answer"}</p>
                  {timeLimit > 0 && <p className="font-bold" style={{ color: "hsl(30,78%,55%)" }}>⏱️ {isBangla ? `সময়সীমা: ${timeLimit} মিনিট — সময় শেষে স্বয়ংক্রিয় জমা` : `Time limit: ${timeLimit} min — auto-submit on expiry`}</p>}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startModelTest}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading shadow-lg"
              style={{ background: GRADIENT, boxShadow: "0 6px 24px hsla(270, 60%, 55%, 0.35)" }}>
              <Sparkles className="w-5 h-5" />
              {isBangla ? `${questionCount}টি প্রশ্নে মডেল টেস্ট শুরু করো` : `Start Model Test (${questionCount} Questions)`}
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
            <p className="text-muted-foreground text-sm font-heading">{isBangla ? "মডেল টেস্ট তৈরি হচ্ছে..." : "Generating model test..."}</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ALL QUESTIONS SCREEN (Model Test) ═══
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
                  {isBangla ? "মডেল টেস্ট" : "Model Test"} — {selectedSubject ? (isBangla ? selectedSubject.name_bn : selectedSubject.name) : ""}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-heading">
                    {answeredCount}/{questions.length} {isBangla ? "উত্তর দেওয়া হয়েছে" : "answered"}
                  </span>
                  {sessionStartTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" style={{ color: "hsl(270,60%,55%)" }} />
                      <LiveTimer startTime={sessionStartTime} timeLimitMin={timeLimit} onTimeExpired={handleTimeExpired} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 rounded-full bg-muted/50 overflow-hidden">
            <motion.div animate={{ width: `${(answeredCount / questions.length) * 100}%` }} className="h-full rounded-full" style={{ background: GRADIENT }} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {questions.map((q, qIdx) => {
            const isLocked = lockedAnswers[qIdx] !== undefined;
            const lockedVal = lockedAnswers[qIdx];
            return (
              <motion.div key={qIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(qIdx * 0.03, 0.5) }}
                className="rounded-2xl p-4 sm:p-5" style={{
                  background: "linear-gradient(-45deg, rgba(254,254,254,0.95), rgba(254,254,254,0.8))", backdropFilter: "blur(24px) saturate(1.5)",
                  border: isLocked ? "1.5px solid hsla(270,60%,55%,0.2)" : "1.5px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 4px 20px hsla(270,60%,55%,0.06)",
                }}>
                {/* Question */}
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                    style={{ background: isLocked ? "hsl(270,60%,55%)" : GRADIENT }}>
                    {qIdx + 1}
                  </span>
                  <p className="text-sm sm:text-base font-medium leading-relaxed text-foreground whitespace-pre-line">{q.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2 ml-11">
                  {q.options.map((option, oIdx) => {
                    const isSelected = lockedVal === oIdx;
                    return (
                      <motion.button key={oIdx}
                        whileHover={!isLocked ? { scale: 1.01, y: -1 } : {}}
                        whileTap={!isLocked ? { scale: 0.99 } : {}}
                        onClick={() => lockAnswer(qIdx, oIdx)}
                        disabled={isLocked}
                        className={cn("w-full p-3 rounded-xl text-left flex items-center gap-2.5 transition-all text-sm", isLocked && !isSelected && "opacity-50")}
                        style={isSelected ? {
                          background: "linear-gradient(-45deg, hsla(270, 60%, 97%, 0.95), hsla(300, 55%, 97%, 0.9))",
                          border: "2px solid hsl(270, 60%, 55%)", boxShadow: "0 4px 16px hsla(270, 60%, 55%, 0.2)",
                        } : {
                          background: "linear-gradient(-45deg, rgba(254,254,254,0.85), rgba(254,254,254,0.6))",
                          backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)",
                        }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white"
                          style={{ background: isSelected ? "hsl(270, 60%, 55%)" : "hsla(270,60%,55%,0.3)" }}>
                          {String.fromCharCode(2453 + oIdx) /* ক, খ, গ, ঘ */}
                        </span>
                        <span className="flex-1 font-medium text-foreground">{option}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "hsl(270,60%,55%)" }} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Locked indicator */}
                {isLocked && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground/50 mt-2 ml-11 font-heading">
                    🔒 {isBangla ? "উত্তর লক করা হয়েছে" : "Answer locked"}
                  </motion.p>
                )}
              </motion.div>
            );
          })}

          {/* Submit Button (sticky bottom) */}
          <div className="sticky bottom-4 z-20 pt-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={submitModelTest} disabled={isSubmitting}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-sm font-heading disabled:opacity-60 shadow-xl"
              style={{ background: allAnswered ? GRADIENT : "hsla(270,60%,55%,0.5)", boxShadow: allAnswered ? "0 8px 32px hsla(270, 60%, 55%, 0.4)" : "none" }}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Award className="w-5 h-5" />
                  {allAnswered
                    ? (isBangla ? "জমা দাও" : "Submit Model Test")
                    : (isBangla ? `${questions.length - answeredCount}টি প্রশ্ন বাকি` : `${questions.length - answeredCount} questions remaining`)}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assessment;
