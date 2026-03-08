import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, ShieldAlert, FlaskConical, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import blindspotTarget3d from "@/assets/blindspot-target-3d.png";
import blindspotSearch3d from "@/assets/blindspot-search-3d.png";

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

function getRiskGradient(risk: RiskLabel) {
  switch (risk) {
    case "high":
      return { bg: "linear-gradient(135deg, rgba(253,145,217,0.2) 0%, rgba(175,45,80,0.15) 100%)", border: "rgba(253,145,217,0.4)", text: "#FDA4AF" };
    case "medium":
      return { bg: "linear-gradient(135deg, rgba(209,202,233,0.15) 0%, rgba(188,150,240,0.1) 100%)", border: "rgba(188,150,240,0.35)", text: "#D1CAE9" };
    default:
      return { bg: "linear-gradient(135deg, rgba(174,208,255,0.15) 0%, rgba(47,107,129,0.1) 100%)", border: "rgba(174,208,255,0.3)", text: "#AED0FF" };
  }
}

function inferRisk(masteryScore: number, attempts: number, hasHigherBloomEvidence: boolean) {
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
  remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 5, create: 6,
};

const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-white/[0.15] backdrop-blur-2xl", className)}
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
          supabase.from("profiles").select("version").eq("user_id", user.id).maybeSingle(),
          supabase.from("topic_mastery").select("topic_name, mastery_score, attempts, last_practiced_at").eq("user_id", user.id).order("mastery_score", { ascending: false }).limit(40),
          supabase.from("study_sessions").select("topic, bloom_level").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
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
          return { topicName, masteryScore, attempts, lastPracticedAt: m.last_practiced_at, risk, reason };
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl h-[100px] animate-pulse" style={{ background: 'linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)' }} />
        <GlassCard className="h-[90px] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-3"
    >
      {/* ── Header Card (pink gradient) ── */}
      <div
        className="relative rounded-2xl overflow-hidden px-4 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)' }}
      >
        <img
          src={blindspotTarget3d}
          alt=""
          className="w-[90px] h-[90px] object-contain shrink-0 -ml-2 -my-2"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {isBangla ? "তোমার লুকানো অন্ধ-স্পট" : "Blind Spot Mirror"}
          </h3>
          <p className="text-white/70 text-[11px] sm:text-xs mt-0.5">
            {isBangla
              ? "যেখানে ভুল এখনও ধরা পড়েনি—কিন্তু ঝুঁকি জমছে"
              : "Where you haven't failed yet—but risk is forming"}
          </p>
        </div>
        {/* Help badge */}
        <div
          className="shrink-0 rounded-full px-3.5 py-1.5 flex items-center gap-1.5"
          style={{
            background: 'rgba(240, 235, 250, 0.15)',
            border: '2px solid rgba(240, 235, 250, 0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <HelpCircle className="w-3 h-3 text-white" />
          <span className="text-white text-xs sm:text-sm font-bold whitespace-nowrap">
            {isBangla ? "সূচক" : "Mirror™"}
          </span>
        </div>
      </div>

      {/* ── Blind Spot Cards (side by side grid) ── */}
      {blindSpots.length === 0 ? (
        <GlassCard className="px-4 py-5">
          <div className="flex items-center gap-3">
            <img src={blindspotSearch3d} alt="" className="w-[48px] h-[48px] object-contain shrink-0" />
            <p className="text-white/60 text-xs sm:text-sm">
              {isBangla
                ? "Blind Spot Mirror তৈরি করতে আরও কিছু শেখার ডেটা দরকার।"
                : "Blind Spot Mirror needs more learning data to become precise."}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {blindSpots.map((b) => {
            const colors = getRiskGradient(b.risk);
            return (
              <GlassCard key={b.topicName} className="p-3 relative overflow-hidden">
                {/* Risk indicator dot */}
                <div
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                  style={{
                    background: b.risk === "high" ? "#FDA4AF" : b.risk === "medium" ? "#D1CAE9" : "#AED0FF",
                    boxShadow: `0 0 8px ${b.risk === "high" ? "rgba(253,164,175,0.5)" : b.risk === "medium" ? "rgba(209,202,233,0.4)" : "rgba(174,208,255,0.4)"}`,
                  }}
                />

                {/* Topic name */}
                <div className="flex items-center gap-1.5 mb-2 pr-4">
                  <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: colors.text }} />
                  <p className="text-white font-semibold text-xs sm:text-sm truncate leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {b.topicName}
                  </p>
                </div>

                {/* Risk badge */}
                <div
                  className="inline-flex items-center rounded-full px-2.5 py-1 mb-2"
                  style={{
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                  }}
                >
                  <span className="text-[10px] sm:text-[11px] font-bold" style={{ color: colors.text }}>
                    {b.risk === "high"
                      ? (isBangla ? "উচ্চ ঝুঁকি" : "High Risk")
                      : b.risk === "medium"
                        ? (isBangla ? "মাঝারি" : "Medium")
                        : (isBangla ? "কম" : "Low")}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-white/50 text-[10px] leading-snug mb-2 line-clamp-2">
                  {b.reason}
                </p>

                {/* Attempts */}
                <div className="flex items-center gap-1 text-white/40">
                  <FlaskConical className="w-3 h-3" />
                  <span className="text-[10px] font-medium">
                    {isBangla ? "চেষ্টা" : "Attempts"}: {b.attempts}
                  </span>
                </div>

                {/* Mastery bar */}
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.masteryScore}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: b.risk === "high"
                          ? "linear-gradient(90deg, #FD91D9, #AF2D50)"
                          : b.risk === "medium"
                            ? "linear-gradient(90deg, #D1CAE9, #BC96F0)"
                            : "linear-gradient(90deg, #AED0FF, #2F6B81)",
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-white/30 mt-0.5 text-right">{b.masteryScore}%</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── Insight Footer ── */}
      {insight && (
        <div
          className="rounded-xl px-4 py-2.5 border border-[#FD91D9]/30"
          style={{ background: 'linear-gradient(135deg, rgba(253,145,217,0.15) 0%, rgba(175,45,80,0.1) 100%)' }}
        >
          <p className="text-white/80 text-[11px] sm:text-xs text-center">
            <ShieldAlert className="w-3 h-3 inline mr-1 text-[#FD91D9]" />
            {insight}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default BlindSpotMirror;
