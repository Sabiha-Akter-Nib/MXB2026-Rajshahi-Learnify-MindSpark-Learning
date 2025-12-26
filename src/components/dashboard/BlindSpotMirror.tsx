import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Network, ShieldAlert, FlaskConical, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type RiskLabel = "high" | "medium" | "low";

type BlindSpot = {
  topicName: string;
  risk: RiskLabel;
  reason: string;
  masteryScore: number;
  attempts: number;
  lastPracticedAt?: string | null;
};

const riskOrder: Record<RiskLabel, number> = { high: 0, medium: 1, low: 2 };

function getRiskColor(risk: RiskLabel) {
  switch (risk) {
    case "high":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  }
}

function inferRisk(masteryScore: number, attempts: number, hasHigherBloomEvidence: boolean) {
  // Heuristic: “looks strong but unproven”
  const highMastery = masteryScore >= 70;
  const veryLowAttempts = attempts <= 1;
  const shallowBloom = !hasHigherBloomEvidence;

  if (highMastery && (veryLowAttempts || shallowBloom)) {
    return {
      risk: "high" as const,
      reason: veryLowAttempts
        ? "Looks strong but has almost no stress-testing."
        : "Looks strong, but only shallow Bloom evidence."
    };
  }

  if ((masteryScore >= 55 && attempts <= 2) || (highMastery && shallowBloom)) {
    return {
      risk: "medium" as const,
      reason: "Partially proven, but still fragile under new exam forms."
    };
  }

  return {
    risk: "low" as const,
    reason: "Has enough evidence to survive variation." 
  };
}

const bloomRank: Record<string, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyze: 4,
  evaluate: 5,
  create: 6,
};

const BlindSpotMirror = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isBangla, setIsBangla] = useState(false);
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setIsLoading(true);
      try {
        const [{ data: profile }, { data: mastery }, { data: sessions }] = await Promise.all([
          supabase
            .from("profiles")
            .select("version")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("topic_mastery")
            .select("topic_name, mastery_score, attempts, last_practiced_at")
            .eq("user_id", user.id)
            .order("mastery_score", { ascending: false })
            .limit(40),
          supabase
            .from("study_sessions")
            .select("topic, bloom_level")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(200),
        ]);

        setIsBangla(profile?.version === "bangla");

        const maxBloomByTopic = new Map<string, number>();
        (sessions || []).forEach((s) => {
          const t = (s.topic || "").trim();
          if (!t) return;
          const r = bloomRank[(s.bloom_level || "").toLowerCase()] || 1;
          const prev = maxBloomByTopic.get(t) || 0;
          if (r > prev) maxBloomByTopic.set(t, r);
        });

        const computed: BlindSpot[] = (mastery || []).map((m) => {
          const topicName = String(m.topic_name || "");
          const masteryScore = Number(m.mastery_score || 0);
          const attempts = Number(m.attempts || 0);
          const maxBloom = maxBloomByTopic.get(topicName) || 1;
          const hasHigherBloomEvidence = maxBloom >= bloomRank.apply;
          const { risk, reason } = inferRisk(masteryScore, attempts, hasHigherBloomEvidence);

          return {
            topicName,
            masteryScore,
            attempts,
            lastPracticedAt: m.last_practiced_at,
            risk,
            reason,
          };
        });

        setBlindSpots(
          computed
            .filter((x) => x.topicName)
            .sort((a, b) => {
              const r = riskOrder[a.risk] - riskOrder[b.risk];
              if (r !== 0) return r;
              return b.masteryScore - a.masteryScore;
            })
            .slice(0, 6)
        );
      } catch (e) {
        console.error("BlindSpotMirror error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [user]);

  const insight = useMemo(() => {
    if (blindSpots.length === 0) return null;
    const high = blindSpots.filter((b) => b.risk === "high").length;
    if (high >= 2) return isBangla ? "এখানে আত্মবিশ্বাস আছে—কিন্তু প্রমাণ কম।" : "Confidence is high here—but evidence is thin.";
    if (high === 1) return isBangla ? "একটি নীরব ঝুঁকি ধরা পড়েছে।" : "One quiet risk surfaced.";
    return isBangla ? "এই মুহূর্তে বড় অন্ধ-স্পট নেই।" : "No major blind spots detected right now.";
  }, [blindSpots, isBangla]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-6 shadow-xl"
      aria-label={isBangla ? "অন্ধ-স্পট মিরর" : "Blind Spot Mirror"}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-primary/10">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {isBangla ? "তোমার লুকানো অন্ধ-স্পট" : "Your Hidden Blind Spots"}
              <span className="text-xs text-muted-foreground ml-2">Mirror™</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla
                ? "যেখানে ভুল এখনও ধরা পড়েনি—কিন্তু ঝুঁকি জমছে"
                : "Where you haven’t failed yet—but risk is quietly forming"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="w-4 h-4" />
          <span>{isBangla ? "স্ট্রেস-টেস্ট সূচক" : "Stress-test indicator"}</span>
        </div>
      </header>

      {/* Concept web (minimal, symbolic) */}
      <div className="relative z-10 mb-5">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full",
                i % 7 === 0 ? "bg-rose-500/25" : i % 5 === 0 ? "bg-amber-500/25" : "bg-muted/50"
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
          </div>
        ) : blindSpots.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
            {isBangla
              ? "Blind Spot Mirror তৈরি করতে আরও কিছু শেখার ডেটা দরকার।"
              : "Blind Spot Mirror needs a bit more learning data to become precise."}
          </div>
        ) : (
          blindSpots.map((b) => (
            <div
              key={b.topicName}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-background/40 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-primary" />
                  <p className="font-medium truncate">{b.topicName}</p>
                </div>
                <p className="text-xs text-muted-foreground">{isBangla ? "কারণ" : "Reason"}: {b.reason}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={cn("px-2 py-1 rounded-full text-xs font-medium border", getRiskColor(b.risk))}>
                  {b.risk === "high"
                    ? (isBangla ? "উচ্চ ঝুঁকি" : "High risk")
                    : b.risk === "medium"
                      ? (isBangla ? "মাঝারি" : "Medium")
                      : (isBangla ? "কম" : "Low")}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{isBangla ? "চেষ্টা" : "Attempts"}: {b.attempts}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {insight && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 p-4">
            <ShieldAlert className="w-4 h-4 text-accent mt-0.5" />
            <p className="text-sm">{insight}</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default BlindSpotMirror;
