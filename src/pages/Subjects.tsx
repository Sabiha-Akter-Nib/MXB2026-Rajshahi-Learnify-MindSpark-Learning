import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Globe,
  Languages,
  FlaskConical,
  Loader2,
  Atom,
  Leaf,
  BookText,
  Laptop,
  LucideIcon,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import subjectBooks3dNew from "@/assets/subject-books-3d-new.png";
import subjectIcon3d from "@/assets/subject-icon-3d.png";

interface SubjectWithStats {
  id: string;
  name: string;
  name_bn: string | null;
  icon: string;
  color: string;
  total_chapters: number;
  progress: number;
  correct: number;
  wrong: number;
  skipped: number;
  total_xp: number;
}

const iconMap: Record<string, LucideIcon> = {
  "book-text": BookText,
  languages: Languages,
  calculator: Calculator,
  atom: Atom,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  globe: Globe,
  laptop: Laptop,
  book: BookOpen,
  "book-open": BookOpen,
};

// Liquid glass card wrapper
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-white/[0.15] backdrop-blur-2xl",
      className
    )}
    style={{
      background:
        "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
      boxShadow:
        "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 0.5px rgba(255,255,255,0.08)",
    }}
    {...props}
  >
    {children}
  </div>
);

const Subjects = () => {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState<string>("bangla");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("class, version, division")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profileData) return;

        setProfileVersion(profileData.version);
        const studentClass = profileData.class;

        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .lte("min_class", studentClass)
          .gte("max_class", studentClass);

        if (!subjectsData) return;

        // For class 9-10, filter by division
        let filtered = subjectsData;
        if (studentClass >= 9 && studentClass <= 10) {
          filtered = subjectsData.filter((s) => {
            const div = (s as any).division as string | null;
            const cat = (s as any).category as string;
            if (cat === "compulsory" && !div) return true;
            if (cat === "optional" && !div) return true;
            if (cat === "division" && div === profileData.division) return true;
            return false;
          });
        }

        // Fetch progress
        const { data: progressData } = await supabase
          .from("student_progress")
          .select("subject_id, chapters_completed, xp_earned")
          .eq("user_id", user.id);

        const progressMap = new Map(
          (progressData || []).map((p) => [p.subject_id, p])
        );

        // Fetch assessment stats per subject
        const { data: assessmentsData } = await supabase
          .from("assessments")
          .select("subject_id, correct_answers, total_questions")
          .eq("user_id", user.id);

        // Aggregate correct/wrong/skipped per subject
        const assessmentMap = new Map<string, { correct: number; wrong: number; skipped: number }>();
        (assessmentsData || []).forEach((a) => {
          if (!a.subject_id) return;
          const existing = assessmentMap.get(a.subject_id) || { correct: 0, wrong: 0, skipped: 0 };
          const answered = a.correct_answers || 0;
          const total = a.total_questions || 0;
          const wrong = total - answered; // simplified: unanswered = wrong+skipped
          existing.correct += answered;
          existing.wrong += wrong;
          assessmentMap.set(a.subject_id, existing);
        });

        const result: SubjectWithStats[] = filtered.map((subject) => {
          const progress = progressMap.get(subject.id);
          const completed = progress?.chapters_completed || 0;
          const stats = assessmentMap.get(subject.id) || { correct: 0, wrong: 0, skipped: 0 };

          return {
            id: subject.id,
            name: subject.name,
            name_bn: subject.name_bn,
            icon: subject.icon,
            color: subject.color,
            total_chapters: subject.total_chapters,
            progress: Math.round((completed / subject.total_chapters) * 100),
            correct: stats.correct,
            wrong: stats.wrong,
            skipped: stats.skipped,
            total_xp: progress?.xp_earned || 0,
          };
        });

        setSubjects(result);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DashboardBackground />
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const isBangla = profileVersion === "bangla";

  return (
    <div className="min-h-screen relative">
      <DashboardBackground />

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3">
        <GlassCard className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-white font-semibold text-base sm:text-lg">
                {isBangla ? "বিষয়সমূহ" : "My Subjects"}
              </h1>
              <p className="text-white/50 text-[10px] sm:text-xs">
                {isBangla ? "ট্যাপ করে বিস্তারিত দেখুন" : "Tap to see details"}
              </p>
            </div>
          </div>
        </GlassCard>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-4 pb-24">
        {/* Subject Section Header */}
        <GlassCard className="p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-3">
            <img
              src={subjectBooks3dNew}
              alt="Subjects"
              className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 object-contain"
            />
            <div
              className="flex-1 rounded-xl p-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(253,145,217,0.35) 0%, rgba(175,45,80,0.35) 100%)",
              }}
            >
              <h3 className="text-white font-semibold text-sm sm:text-base">
                {isBangla ? "তোমার বিষয়ভিত্তিক অগ্রগতি" : "Your subject-wise progress"}
              </h3>
              <p className="text-white/50 text-[10px] sm:text-xs">
                {isBangla
                  ? "ট্যাপ করে সঠিক, ভুল ও স্কিপ দেখো"
                  : "Tap to see correct, wrong & skipped"}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Subject Grid */}
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            {isBangla ? "কোনো বিষয় পাওয়া যায়নি" : "No subjects found for your class."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {subjects.map((subject, index) => {
              const isExpanded = expandedId === subject.id;
              const hasStats = subject.correct > 0 || subject.wrong > 0 || subject.skipped > 0;

              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer transition-all duration-300",
                    isExpanded && "col-span-2"
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : subject.id)}
                >
                  {/* Main row — matches Dashboard exactly */}
                  <div className="px-2 py-1.5 sm:px-3 sm:py-3 flex flex-row items-center gap-2 sm:gap-2.5">
                    <img
                      src={subjectIcon3d}
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-white text-[11px] sm:text-sm font-medium truncate">
                          {isBangla && subject.name_bn ? subject.name_bn : subject.name}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: "linear-gradient(90deg, #E040A0, #A040E0)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.progress}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                        <span className="text-[10px] text-white/40 font-medium">
                          {subject.progress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stats */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-white/10">
                          {hasStats ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {/* Correct */}
                              <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/20 p-2 text-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-emerald-400">
                                  {subject.correct}
                                </p>
                                <p className="text-[9px] text-white/50">
                                  {isBangla ? "সঠিক" : "Correct"}
                                </p>
                              </div>
                              {/* Wrong */}
                              <div className="rounded-lg bg-red-500/15 border border-red-500/20 p-2 text-center">
                                <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-red-400">
                                  {subject.wrong}
                                </p>
                                <p className="text-[9px] text-white/50">
                                  {isBangla ? "ভুল" : "Wrong"}
                                </p>
                              </div>
                              {/* Skipped */}
                              <div className="rounded-lg bg-amber-500/15 border border-amber-500/20 p-2 text-center">
                                <MinusCircle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-amber-400">
                                  {subject.skipped}
                                </p>
                                <p className="text-[9px] text-white/50">
                                  {isBangla ? "স্কিপ" : "Skipped"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-white/30 text-xs text-center py-2">
                              {isBangla
                                ? "এখনো কোনো পরীক্ষা দেওয়া হয়নি"
                                : "No assessments taken yet"}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Subjects;
