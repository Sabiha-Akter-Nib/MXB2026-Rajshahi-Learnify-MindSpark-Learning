import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Zap,
  Brain,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import futureSnapshot3d from '@/assets/future-snapshot-3d.png';
import confidenceForecast3d from '@/assets/confidence-forecast-3d.png';

// --- Types ---
interface FutureScenario {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  masteryChange: number;
  daysUntilDecay: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  icon: 'current' | 'better' | 'worse';
  color: string;
}

interface TopicForecast {
  topicName: string;
  currentMastery: number;
  projectedMastery: number;
  daysUntilForgotten: number;
  revisionsNeeded: number;
}

interface SnapshotData {
  overallConfidence: number;
  masteryTrend: 'rising' | 'stable' | 'declining';
  topWeakTopic: string | null;
  averageRetentionDays: number;
  scenarios: FutureScenario[];
  topicForecasts: TopicForecast[];
}

// --- Liquid glass card ---
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

// --- Main Component ---
const FutureYouSnapshot = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('current');
  const [isBangla, setIsBangla] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSnapshotData();
      checkLanguagePreference();
    }
  }, [user]);

  const checkLanguagePreference = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('version')
      .eq('user_id', user.id)
      .single();
    if (data) setIsBangla(data.version === 'bangla');
  };

  const fetchSnapshotData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [{ data: masteryData }, { data: revisionData }, { data: sessionData }] = await Promise.all([
        supabase.from('topic_mastery').select('*').eq('user_id', user.id).order('mastery_score', { ascending: true }),
        supabase.from('revision_schedule').select('*').eq('user_id', user.id).eq('is_completed', false),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);
      setSnapshotData(calculateProjections(masteryData || [], revisionData || [], sessionData || []));
    } catch (error) {
      console.error('Error fetching snapshot data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProjections = (mastery: any[], revisions: any[], sessions: any[]): SnapshotData => {
    const avgMastery = mastery.length > 0
      ? mastery.reduce((sum, t) => sum + t.mastery_score, 0) / mastery.length
      : 50;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(s => new Date(s.created_at) > sevenDaysAgo);
    const studyConsistency = Math.min(recentSessions.length / 7, 1);

    const weakTopics = mastery.filter(t => t.is_weak_topic);
    const masteryTrend: 'rising' | 'stable' | 'declining' =
      studyConsistency > 0.7 ? 'rising' : studyConsistency > 0.3 ? 'stable' : 'declining';

    const avgRetentionDays = revisions.length > 0
      ? revisions.reduce((sum, r) => sum + r.review_interval_days, 0) / revisions.length
      : 7;

    const topicForecasts: TopicForecast[] = mastery.slice(0, 5).map(topic => {
      const decayRate = 0.1;
      const daysUntilForgotten = Math.ceil(topic.mastery_score / (decayRate * 100));
      const projectedMastery = Math.max(0, topic.mastery_score - (decayRate * 14 * 100));
      return {
        topicName: topic.topic_name,
        currentMastery: topic.mastery_score,
        projectedMastery: studyConsistency > 0.5 ? Math.min(100, topic.mastery_score + 10) : projectedMastery,
        daysUntilForgotten: studyConsistency > 0.5 ? daysUntilForgotten * 2 : daysUntilForgotten,
        revisionsNeeded: Math.ceil((100 - topic.mastery_score) / 20),
      };
    });

    const scenarios: FutureScenario[] = [
      {
        id: 'current',
        title: 'Current Pace',
        titleBn: 'বর্তমান গতি',
        description: masteryTrend === 'rising'
          ? 'You\'re building strong foundations. Keep it up!'
          : masteryTrend === 'stable'
            ? 'Steady progress, but there\'s room to grow.'
            : 'Some topics may slip away without revision.',
        descriptionBn: masteryTrend === 'rising'
          ? 'তুমি শক্তিশালী ভিত্তি তৈরি করছো। চালিয়ে যাও!'
          : masteryTrend === 'stable'
            ? 'স্থির অগ্রগতি, কিন্তু বাড়ার সুযোগ আছে।'
            : 'রিভিশন ছাড়া কিছু টপিক ভুলে যেতে পারো।',
        masteryChange: masteryTrend === 'rising' ? 15 : masteryTrend === 'stable' ? 0 : -20,
        daysUntilDecay: Math.round(avgRetentionDays),
        confidenceLevel: masteryTrend === 'rising' ? 'high' : masteryTrend === 'stable' ? 'medium' : 'low',
        icon: 'current',
        color: masteryTrend === 'rising' ? 'primary' : masteryTrend === 'stable' ? 'accent' : 'destructive',
      },
      {
        id: 'better',
        title: '+10 min daily revision',
        titleBn: '+১০ মিনিট দৈনিক রিভিশন',
        description: 'Topics stay fresh until exams. Confidence doubles.',
        descriptionBn: 'পরীক্ষা পর্যন্ত টপিক মনে থাকবে। আত্মবিশ্বাস দ্বিগুণ।',
        masteryChange: 25,
        daysUntilDecay: Math.round(avgRetentionDays * 2.5),
        confidenceLevel: 'high',
        icon: 'better',
        color: 'emerald',
      },
      {
        id: 'worse',
        title: 'Skip revision for 2 weeks',
        titleBn: '২ সপ্তাহ রিভিশন বাদ দিলে',
        description: 'Most topics feel unfamiliar. Relearning required.',
        descriptionBn: 'বেশিরভাগ টপিক অপরিচিত মনে হবে। পুনরায় শিখতে হবে।',
        masteryChange: -35,
        daysUntilDecay: Math.round(avgRetentionDays * 0.3),
        confidenceLevel: 'low',
        icon: 'worse',
        color: 'rose',
      },
    ];

    return {
      overallConfidence: Math.round(avgMastery * studyConsistency),
      masteryTrend,
      topWeakTopic: weakTopics[0]?.topic_name || null,
      averageRetentionDays: Math.round(avgRetentionDays),
      scenarios,
      topicForecasts,
    };
  };

  const activeScenarioData = snapshotData?.scenarios.find(s => s.id === activeScenario);

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl h-[100px] animate-pulse" style={{ background: 'linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)' }} />
        <GlassCard className="h-[90px] animate-pulse" />
      </div>
    );
  }

  if (!snapshotData) return null;

  const trendLabel = snapshotData.masteryTrend === 'rising'
    ? (isBangla ? 'উন্নতি' : 'Rising')
    : snapshotData.masteryTrend === 'stable'
      ? (isBangla ? 'স্থির' : 'Stable')
      : (isBangla ? 'পতনশীল' : 'Declining');

  return (
    <div className="space-y-3">
      {/* ── Header Card (pink gradient) ── */}
      <div
        className="relative rounded-2xl overflow-hidden px-4 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #FD91D9 0%, #AF2D50 100%)' }}
      >
        {/* 3D Icon */}
        <img
          src={futureSnapshot3d}
          alt=""
          className="w-[90px] h-[90px] object-contain shrink-0 -ml-2 -my-2"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {isBangla ? 'ভবিষ্যতের তুমি' : 'Future You Snapshot'}
          </h3>
          <p className="text-white/70 text-[11px] sm:text-xs mt-0.5">
            {isBangla ? 'আজকের শেখার ফলাফল' : 'Based on today\'s learning'}
          </p>
        </div>

        {/* Trend Badge */}
        <div className="shrink-0 rounded-full px-3 py-1.5 border border-white/30 bg-white/10 backdrop-blur-sm">
          <span className="text-white text-xs sm:text-sm font-semibold whitespace-nowrap">
            {trendLabel}
          </span>
        </div>
      </div>

      {/* ── Confidence Forecast Card ── */}
      <GlassCard className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={confidenceForecast3d}
            alt=""
            className="w-[56px] h-[56px] object-contain shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm sm:text-base leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isBangla ? 'আত্মবিশ্বাস পূর্বাভাস' : 'Confidence Forecast'}
            </h4>
            <p className="text-white/50 text-[10px] sm:text-xs mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isBangla
                ? `গড় ধারণ: ${snapshotData.averageRetentionDays} দিন`
                : `Average retention: ${snapshotData.averageRetentionDays} days`}
            </p>
            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${snapshotData.overallConfidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: snapshotData.overallConfidence >= 70
                      ? 'linear-gradient(90deg, #AED0FF, #2F6B81)'
                      : snapshotData.overallConfidence >= 40
                        ? 'linear-gradient(90deg, #D1CAE9, #BC96F0)'
                        : 'linear-gradient(90deg, #FD91D9, #AF2D50)',
                  }}
                />
              </div>
              <span className="text-white font-bold text-sm sm:text-base shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {snapshotData.overallConfidence}%
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Scenario Selector ── */}
      <GlassCard className="px-4 py-3">
        <p className="text-white/70 text-[11px] sm:text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FD91D9]" />
          {isBangla ? 'সম্ভাব্য ভবিষ্যত' : 'Possible Futures'}
        </p>

        {/* Scenario tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {snapshotData.scenarios.map((scenario) => {
            const isActive = activeScenario === scenario.id;
            return (
              <motion.button
                key={scenario.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "relative flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 text-left",
                  isActive
                    ? "border-white/30 bg-white/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    scenario.icon === 'better' && "bg-emerald-500/20 text-emerald-400",
                    scenario.icon === 'worse' && "bg-rose-500/20 text-rose-400",
                    scenario.icon === 'current' && "bg-white/10 text-white/70"
                  )}
                >
                  {scenario.icon === 'better' ? <TrendingUp className="w-4 h-4" /> :
                    scenario.icon === 'worse' ? <TrendingDown className="w-4 h-4" /> :
                      <Target className="w-4 h-4" />}
                </div>
                <span className="text-white text-[11px] sm:text-xs font-medium whitespace-nowrap">
                  {isBangla ? scenario.titleBn : scenario.title}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Active Scenario Detail */}
        <AnimatePresence mode="wait">
          {activeScenarioData && (
            <motion.div
              key={activeScenarioData.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    activeScenarioData.confidenceLevel === 'high' && "bg-emerald-500/20 text-emerald-400",
                    activeScenarioData.confidenceLevel === 'medium' && "bg-amber-500/20 text-amber-400",
                    activeScenarioData.confidenceLevel === 'low' && "bg-rose-500/20 text-rose-400"
                  )}
                >
                  {activeScenarioData.confidenceLevel === 'high' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                  {isBangla ? activeScenarioData.descriptionBn : activeScenarioData.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-white/5">
                  <p className="text-white/40 text-[10px] sm:text-[11px] mb-0.5">
                    {isBangla ? 'দক্ষতা পরিবর্তন' : 'Mastery Change'}
                  </p>
                  <p
                    className="text-base sm:text-lg font-bold"
                    style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      color: activeScenarioData.masteryChange > 0 ? '#6EE7B7' : activeScenarioData.masteryChange < 0 ? '#FDA4AF' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {activeScenarioData.masteryChange > 0 ? '+' : ''}{activeScenarioData.masteryChange}%
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5">
                  <p className="text-white/40 text-[10px] sm:text-[11px] mb-0.5">
                    {isBangla ? 'টপিক মনে থাকবে' : 'Topics Stay Fresh'}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
                    {activeScenarioData.daysUntilDecay} <span className="text-xs font-normal text-white/50">{isBangla ? 'দিন' : 'days'}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* ── Topic Forecasts ── */}
      {snapshotData.topicForecasts.length > 0 && (
        <GlassCard className="px-4 py-3">
          <p className="text-white/70 text-[11px] sm:text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#BC96F0]" />
            {isBangla ? 'টপিক পূর্বাভাস' : 'Topic Forecasts'}
          </p>
          <div className="space-y-2">
            {snapshotData.topicForecasts.slice(0, 3).map((topic, index) => (
              <motion.div
                key={topic.topicName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-white text-xs sm:text-sm font-medium truncate">{topic.topicName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.currentMastery}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #AED0FF, #2F6B81)' }}
                      />
                    </div>
                    <ArrowRight className="w-3 h-3 text-white/30 shrink-0" />
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.projectedMastery}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                        className="h-full rounded-full"
                        style={{
                          background: topic.projectedMastery >= topic.currentMastery
                            ? 'linear-gradient(90deg, #6EE7B7, #059669)'
                            : 'linear-gradient(90deg, #FDA4AF, #E11D48)',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-xs font-bold"
                    style={{
                      color: topic.daysUntilForgotten > 14 ? '#6EE7B7' : topic.daysUntilForgotten > 7 ? '#FCD34D' : '#FDA4AF',
                    }}
                  >
                    {topic.daysUntilForgotten}d
                  </p>
                  <p className="text-[10px] text-white/40">{isBangla ? 'বাকি' : 'left'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Insight Message ── */}
      {snapshotData.topWeakTopic && (
        <div
          className="rounded-xl px-4 py-2.5 border border-[#FD91D9]/30"
          style={{ background: 'linear-gradient(135deg, rgba(253,145,217,0.15) 0%, rgba(175,45,80,0.1) 100%)' }}
        >
          <p className="text-white/80 text-[11px] sm:text-xs text-center">
            <Zap className="w-3 h-3 inline mr-1 text-[#FD91D9]" />
            {isBangla
              ? `"${snapshotData.topWeakTopic}" টপিকে ২টি ছোট রিভিশন পরীক্ষা পর্যন্ত শক্তিশালী রাখবে।`
              : `With 2 short revisions, "${snapshotData.topWeakTopic}" stays strong until exams.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default FutureYouSnapshot;
