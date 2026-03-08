import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Skull, Clock, Brain, AlertTriangle, TrendingDown, Calendar, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

import blindspotSearch3d from "@/assets/blindspot-search-3d.png";

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
  remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 5, create: 6,
};

const fractureGradients: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  rushed: { bg: "linear-gradient(135deg, rgba(209,202,233,0.15) 0%, rgba(188,150,240,0.1) 100%)", border: "rgba(188,150,240,0.35)", text: "#D1CAE9", dot: "#BC96F0" },
  skipped: { bg: "linear-gradient(135deg, rgba(253,145,217,0.15) 0%, rgba(175,45,80,0.1) 100%)", border: "rgba(253,145,217,0.35)", text: "#FD91D9", dot: "#FD91D9" },
  shallow: { bg: "linear-gradient(135deg, rgba(174,208,255,0.15) 0%, rgba(47,107,129,0.1) 100%)", border: "rgba(174,208,255,0.3)", text: "#AED0FF", dot: "#AED0FF" },
  collapsed: { bg: "linear-gradient(135deg, rgba(253,164,175,0.2) 0%, rgba(175,45,80,0.15) 100%)", border: "rgba(253,164,175,0.4)", text: "#FDA4AF", dot: "#FDA4AF" },
};

function analyzeFractures(
  masteryScore: number, attempts: number, bloomLevel: string, lastPracticedAt: string | null, isWeakTopic: boolean
): FracturePoint[] {
  const fractures: FracturePoint[] = [];
  const now = new Date();
  const lastPracticed = lastPracticedAt ? new Date(lastPracticedAt) : null;
  const daysSincePractice = lastPracticed ? differenceInDays(now, lastPracticed) : null;

  if (masteryScore >= 60 && attempts <= 2) {
    fractures.push({ label: "Rushed understanding", description: "High confidence reached too quickly without deep practice.", type: "rushed" });
  }
  if (daysSincePractice && daysSincePractice > 14 && masteryScore < 80) {
    fractures.push({ label: "Revision skipped", description: `${daysSincePractice} days without revisiting. Memory decay likely.`, type: "skipped", daysAgo: daysSincePractice });
  }
  const bloomRankValue = bloomRank[bloomLevel.toLowerCase()] || 1;
  if (bloomRankValue <= 2 && masteryScore >= 50) {
    fractures.push({ label: "Memorized without grounding", description: "Only surface-level understanding. Never tested at Apply or Analyze.", type: "shallow" });
  }
  if (isWeakTopic && attempts >= 3) {
    fractures.push({ label: "Concept quietly collapsed", description: "Multiple attempts but understanding never solidified.", type: "collapsed" });
  }
  if (masteryScore >= 70 && isWeakTopic) {
    fractures.push({ label: "Confidence replaced understanding", description: "Score looks strong, but system detected fragility.", type: "collapsed" });
  }
  return fractures;
}

const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-white/[0.15] backdrop-blur-2xl", className)}
    style={{
      background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1), 0 0 0 0.5px rgba(255,255,255,0.08)",
    }}
    {...props}
  >
    {children}
  </div>
);

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
          supabase.from("profiles").select("version").eq("user_id", user.id).maybeSingle(),
          supabase.from("topic_mastery").select("topic_name, mastery_score, attempts, last_practiced_at, bloom_level, is_weak_topic").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50),
        ]);
        setIsBangla(profile?.version === "bangla");

        const results: AutopsyResult[] = (mastery || [])
          .map((m): AutopsyResult | null => {
            const fractures = analyzeFractures(Number(m.mastery_score || 0), Number(m.attempts || 0), String(m.bloom_level || "remember"), m.last_practiced_at ?? null, Boolean(m.is_weak_topic));
            if (fractures.length === 0) return null;
            return { topicName: String(m.topic_name || ""), masteryScore: Number(m.mastery_score || 0), bloomLevel: String(m.bloom_level || "remember"), fracturePoints: fractures, lastPracticedAt: m.last_practiced_at ?? null, isWeakTopic: Boolean(m.is_weak_topic) };
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
    const collapsedCount = autopsyResults.filter((r) => r.fracturePoints.some((f) => f.type === "collapsed")).length;
    if (collapsedCount >= 2) return isBangla ? "একাধিক ধারণা নীরবে ভেঙে পড়েছে।" : "Multiple concepts have quietly collapsed.";
    if (collapsedCount === 1) return isBangla ? "একটি ধারণা যেখানে বোঝাপড়া নষ্ট হয়েছে।" : "One concept where understanding faded.";
    return isBangla ? "কিছু শেখার পথে ছোট ফাটল রয়েছে।" : "Some small fractures in the learning path.";
  }, [autopsyResults, isBangla]);

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
      transition={{ duration: 0.45, delay: 0.1 }}
      className="space-y-3"
    >
      {/* ── Header Card (pink gradient) ── */}
      <div
        className="relative rounded-2xl overflow-hidden px-4 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)' }}
      >
        <img
          src={blindspotSearch3d}
          alt=""
          className="w-[90px] h-[90px] object-contain shrink-0 -ml-2 -my-2"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {isBangla ? "কীভাবে ধারণা ভেঙেছে" : "How This Concept Broke"}
          </h3>
          <p className="text-white/70 text-[11px] sm:text-xs mt-0.5">
            {isBangla
              ? "বোঝাপড়া এখানে বিবর্ণ হয়েছে"
              : "Understanding faded here—not failed"}
          </p>
        </div>
        {/* Badge */}
        <div
          className="shrink-0 rounded-full px-3.5 py-1.5 flex items-center gap-1.5"
          style={{
            background: 'rgba(240, 235, 250, 0.15)',
            border: '2px solid rgba(240, 235, 250, 0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs sm:text-sm font-bold whitespace-nowrap">
            {isBangla ? "টাইমলাইন" : "Autopsy™"}
          </span>
        </div>
      </div>

      {/* ── Autopsy Cards (side by side grid) ── */}
      {autopsyResults.length === 0 ? (
        <GlassCard className="px-4 py-5">
          <div className="flex items-center gap-3">
            <img src={blindspotSearch3d} alt="" className="w-[48px] h-[48px] object-contain shrink-0" />
            <p className="text-white/60 text-xs sm:text-sm">
              {isBangla
                ? "Knowledge Autopsy তৈরি করতে আরও শেখার ইতিহাস দরকার।"
                : "Knowledge Autopsy needs more learning history to reconstruct breakdowns."}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {autopsyResults.map((result) => {
            const primaryFracture = result.fracturePoints[0];
            const colors = fractureGradients[primaryFracture?.type || "shallow"];

            return (
              <GlassCard key={result.topicName} className="p-3 relative overflow-hidden">
                {/* Type indicator dot */}
                <div
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                  style={{
                    background: colors.dot,
                    boxShadow: `0 0 8px ${colors.dot}80`,
                  }}
                />

                {/* Topic name */}
                <div className="flex items-center gap-1.5 mb-2 pr-4">
                  <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: colors.text }} />
                  <p className="text-white font-semibold text-xs sm:text-sm truncate leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {result.topicName}
                  </p>
                </div>

                {/* Mastery badge */}
                <div
                  className="inline-flex items-center rounded-full px-2.5 py-1 mb-2"
                  style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                >
                  <span className="text-[10px] sm:text-[11px] font-bold" style={{ color: colors.text }}>
                    {result.masteryScore}% {isBangla ? "দক্ষতা" : "Mastery"}
                  </span>
                </div>

                {/* Fracture points (compact timeline) */}
                <div className="space-y-1.5 mb-2">
                  {result.fracturePoints.slice(0, 2).map((fracture, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                        style={{ background: fractureGradients[fracture.type]?.dot || colors.dot }}
                      />
                      <p className="text-white/50 text-[10px] leading-snug line-clamp-1">
                        {fracture.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Last practiced */}
                {result.lastPracticedAt && (
                  <div className="flex items-center gap-1 text-white/40">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-medium">
                      {format(new Date(result.lastPracticedAt), "MMM d")}
                    </span>
                  </div>
                )}

                {/* Mastery bar */}
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.masteryScore}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: primaryFracture?.type === "collapsed"
                          ? "linear-gradient(90deg, #FD91D9, #AF2D50)"
                          : primaryFracture?.type === "rushed"
                            ? "linear-gradient(90deg, #D1CAE9, #BC96F0)"
                            : "linear-gradient(90deg, #AED0FF, #2F6B81)",
                      }}
                    />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ── Insight Footer ── */}
      {summaryInsight && (
        <div
          className="rounded-xl px-4 py-2.5 border border-[#FD91D9]/30"
          style={{ background: 'linear-gradient(135deg, rgba(253,145,217,0.15) 0%, rgba(175,45,80,0.1) 100%)' }}
        >
          <p className="text-white/80 text-[11px] sm:text-xs text-center">
            <AlertTriangle className="w-3 h-3 inline mr-1 text-[#FD91D9]" />
            {summaryInsight}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default KnowledgeAutopsy;
