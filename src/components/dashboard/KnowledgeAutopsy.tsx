import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Skull, Clock, Brain, AlertTriangle, TrendingDown, Calendar, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

type FracturePoint = {
  label: string;
  description: string;
  type: "rushed" | "skipped" | "shallow" | "collapsed";
  daysAgo?: number;
};

type AutopsyResult = {
  topicName: string;
  masteryScore: number;
  bloomLevel: string;
  fracturePoints: FracturePoint[];
  lastPracticedAt?: string | null;
  isWeakTopic: boolean;
};

const bloomRank: Record<string, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyze: 4,
  evaluate: 5,
  create: 6,
};

const fractureIcons: Record<string, React.ElementType> = {
  rushed: Zap,
  skipped: Calendar,
  shallow: Brain,
  collapsed: TrendingDown,
};

const fractureColors: Record<string, string> = {
  rushed: "text-accent",
  skipped: "text-warning",
  shallow: "text-primary",
  collapsed: "text-destructive",
};

function analyzeFractures(
  masteryScore: number,
  attempts: number,
  bloomLevel: string,
  lastPracticedAt: string | null,
  isWeakTopic: boolean
): FracturePoint[] {
  const fractures: FracturePoint[] = [];
  const now = new Date();
  const lastPracticed = lastPracticedAt ? new Date(lastPracticedAt) : null;
  const daysSincePractice = lastPracticed ? differenceInDays(now, lastPracticed) : null;

  // Check for rushed understanding (high mastery but very few attempts)
  if (masteryScore >= 60 && attempts <= 2) {
    fractures.push({
      label: "Rushed understanding",
      description: "High confidence reached too quickly without deep practice.",
      type: "rushed",
    });
  }

  // Check for skipped revision
  if (daysSincePractice && daysSincePractice > 14 && masteryScore < 80) {
    fractures.push({
      label: "Revision skipped",
      description: `${daysSincePractice} days without revisiting. Memory decay likely.`,
      type: "skipped",
      daysAgo: daysSincePractice,
    });
  }

  // Check for shallow Bloom depth
  const bloomRankValue = bloomRank[bloomLevel.toLowerCase()] || 1;
  if (bloomRankValue <= 2 && masteryScore >= 50) {
    fractures.push({
      label: "Memorized without grounding",
      description: "Only surface-level understanding. Never tested at Apply or Analyze.",
      type: "shallow",
    });
  }

  // Check for concept collapse (weak topic with decent attempts)
  if (isWeakTopic && attempts >= 3) {
    fractures.push({
      label: "Concept quietly collapsed",
      description: "Multiple attempts but understanding never solidified.",
      type: "collapsed",
    });
  }

  // If high mastery but weak topic flagged - overconfidence
  if (masteryScore >= 70 && isWeakTopic) {
    fractures.push({
      label: "Confidence replaced understanding",
      description: "Score looks strong, but system detected fragility.",
      type: "collapsed",
    });
  }

  return fractures;
}

const KnowledgeAutopsy = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isBangla, setIsBangla] = useState(false);
  const [autopsyResults, setAutopsyResults] = useState<AutopsyResult[]>([]);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setIsLoading(true);
      try {
        const [{ data: profile }, { data: mastery }] = await Promise.all([
          supabase
            .from("profiles")
            .select("version")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("topic_mastery")
            .select("topic_name, mastery_score, attempts, last_practiced_at, bloom_level, is_weak_topic")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(50),
        ]);

        setIsBangla(profile?.version === "bangla");

        const results: AutopsyResult[] = (mastery || [])
          .map((m): AutopsyResult | null => {
            const fractures = analyzeFractures(
              Number(m.mastery_score || 0),
              Number(m.attempts || 0),
              String(m.bloom_level || "remember"),
              m.last_practiced_at ?? null,
              Boolean(m.is_weak_topic)
            );

            if (fractures.length === 0) return null;

            return {
              topicName: String(m.topic_name || ""),
              masteryScore: Number(m.mastery_score || 0),
              bloomLevel: String(m.bloom_level || "remember"),
              fracturePoints: fractures,
              lastPracticedAt: m.last_practiced_at ?? null,
              isWeakTopic: Boolean(m.is_weak_topic),
            };
          })
          .filter((r): r is AutopsyResult => r !== null && r.topicName !== "")
          .slice(0, 4);

        setAutopsyResults(results);
      } catch (e) {
        console.error("KnowledgeAutopsy error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [user]);

  const summaryInsight = useMemo(() => {
    if (autopsyResults.length === 0) return null;
    const collapsedCount = autopsyResults.filter((r) =>
      r.fracturePoints.some((f) => f.type === "collapsed")
    ).length;
    
    if (collapsedCount >= 2) {
      return isBangla
        ? "একাধিক ধারণা নীরবে ভেঙে পড়েছে।"
        : "Multiple concepts have quietly collapsed.";
    }
    if (collapsedCount === 1) {
      return isBangla
        ? "একটি ধারণা যেখানে বোঝাপড়া নষ্ট হয়েছে।"
        : "One concept where understanding faded.";
    }
    return isBangla
      ? "কিছু শেখার পথে ছোট ফাটল রয়েছে।"
      : "Some small fractures in the learning path.";
  }, [autopsyResults, isBangla]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-6 shadow-xl"
      aria-label={isBangla ? "জ্ঞান ময়নাতদন্ত" : "Knowledge Autopsy"}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/80 to-accent flex items-center justify-center shadow-lg shadow-destructive/10">
            <Skull className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {isBangla ? "কীভাবে এই ধারণা ভেঙেছে" : "How This Concept Broke"}
              <span className="text-xs text-muted-foreground ml-2">Autopsy™</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla
                ? "ব্যর্থতা এখানে ঘটেনি—বোঝাপড়া এখানে বিবর্ণ হয়েছে"
                : "Failure did not happen here. Understanding faded here."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{isBangla ? "শেখার টাইমলাইন" : "Learning timeline"}</span>
        </div>
      </header>

      <div className="relative z-10 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          </div>
        ) : autopsyResults.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
            {isBangla
              ? "Knowledge Autopsy তৈরি করতে আরও শেখার ইতিহাস দরকার।"
              : "Knowledge Autopsy needs more learning history to reconstruct breakdowns."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autopsyResults.map((result) => (
              <div
                key={result.topicName}
                className="rounded-xl border border-border/40 bg-background/40 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  <p className="font-medium truncate flex-1">{result.topicName}</p>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-full">
                    {result.masteryScore}%
                  </span>
                </div>

                {/* Timeline visualization */}
                <div className="relative pl-4 border-l-2 border-border/50 space-y-3">
                  {result.fracturePoints.map((fracture, idx) => {
                    const IconComponent = fractureIcons[fracture.type] || AlertTriangle;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute -left-[21px] w-3 h-3 rounded-full border-2 border-background",
                          fracture.type === "collapsed" ? "bg-destructive" :
                          fracture.type === "skipped" ? "bg-warning" :
                          fracture.type === "shallow" ? "bg-primary" : "bg-accent"
                        )} />
                        
                        <div className="flex items-start gap-2">
                          <IconComponent className={cn("w-4 h-4 mt-0.5", fractureColors[fracture.type])} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{fracture.label}</p>
                            <p className="text-xs text-muted-foreground">{fracture.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {result.lastPracticedAt && (
                  <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {isBangla ? "শেষ অনুশীলন" : "Last practiced"}: {format(new Date(result.lastPracticedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {summaryInsight && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 p-4">
            <AlertTriangle className="w-4 h-4 text-accent mt-0.5" />
            <p className="text-sm">{summaryInsight}</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default KnowledgeAutopsy;
