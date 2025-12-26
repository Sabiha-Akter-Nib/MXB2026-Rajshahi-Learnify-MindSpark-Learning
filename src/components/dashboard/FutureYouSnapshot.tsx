import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Brain, 
  Sparkles,
  ChevronRight,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
    if (data) {
      setIsBangla(data.version === 'bangla');
    }
  };

  const fetchSnapshotData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch topic mastery data
      const { data: masteryData } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('user_id', user.id)
        .order('mastery_score', { ascending: true });

      // Fetch revision schedule
      const { data: revisionData } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false);

      // Fetch recent study sessions
      const { data: sessionData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // Calculate projections
      const snapshot = calculateProjections(masteryData || [], revisionData || [], sessionData || []);
      setSnapshotData(snapshot);
    } catch (error) {
      console.error('Error fetching snapshot data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProjections = (
    mastery: any[],
    revisions: any[],
    sessions: any[]
  ): SnapshotData => {
    // Calculate average mastery
    const avgMastery = mastery.length > 0
      ? mastery.reduce((sum, t) => sum + t.mastery_score, 0) / mastery.length
      : 50;

    // Calculate study consistency (sessions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(s => new Date(s.created_at) > sevenDaysAgo);
    const studyConsistency = Math.min(recentSessions.length / 7, 1);

    // Calculate trend based on recent mastery changes
    const weakTopics = mastery.filter(t => t.is_weak_topic);
    const masteryTrend: 'rising' | 'stable' | 'declining' = 
      studyConsistency > 0.7 ? 'rising' : 
      studyConsistency > 0.3 ? 'stable' : 'declining';

    // Calculate retention days based on revision patterns
    const avgRetentionDays = revisions.length > 0
      ? revisions.reduce((sum, r) => sum + r.review_interval_days, 0) / revisions.length
      : 7;

    // Generate topic forecasts
    const topicForecasts: TopicForecast[] = mastery.slice(0, 5).map(topic => {
      const decayRate = 0.1; // 10% decay per day without revision
      const daysUntilForgotten = Math.ceil(topic.mastery_score / (decayRate * 100));
      const projectedMastery = Math.max(0, topic.mastery_score - (decayRate * 14 * 100));
      
      return {
        topicName: topic.topic_name,
        currentMastery: topic.mastery_score,
        projectedMastery: studyConsistency > 0.5 ? Math.min(100, topic.mastery_score + 10) : projectedMastery,
        daysUntilForgotten: studyConsistency > 0.5 ? daysUntilForgotten * 2 : daysUntilForgotten,
        revisionsNeeded: Math.ceil((100 - topic.mastery_score) / 20)
      };
    });

    // Generate scenarios
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
        color: masteryTrend === 'rising' ? 'emerald' : masteryTrend === 'stable' ? 'amber' : 'rose'
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
        color: 'emerald'
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
        color: 'rose'
      }
    ];

    return {
      overallConfidence: Math.round(avgMastery * studyConsistency),
      masteryTrend,
      topWeakTopic: weakTopics[0]?.topic_name || null,
      averageRetentionDays: Math.round(avgRetentionDays),
      scenarios,
      topicForecasts
    };
  };

  const getScenarioIcon = (icon: string) => {
    switch (icon) {
      case 'better': return <TrendingUp className="w-5 h-5" />;
      case 'worse': return <TrendingDown className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-emerald-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-rose-500';
      default: return 'text-muted-foreground';
    }
  };

  const activeScenarioData = snapshotData?.scenarios.find(s => s.id === activeScenario);

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 animate-pulse" />
          <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </motion.div>
    );
  }

  if (!snapshotData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Compass className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">
                {isBangla ? 'ভবিষ্যতের তুমি' : 'Future You'}
                <span className="text-xs text-muted-foreground ml-2">Snapshot™</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {isBangla ? 'আজকের শেখার ফলাফল' : 'Based on today\'s learning'}
              </p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              snapshotData.masteryTrend === 'rising' && "bg-emerald-500/10 text-emerald-500",
              snapshotData.masteryTrend === 'stable' && "bg-amber-500/10 text-amber-500",
              snapshotData.masteryTrend === 'declining' && "bg-rose-500/10 text-rose-500"
            )}
          >
            {snapshotData.masteryTrend === 'rising' && (isBangla ? '📈 উন্নতি হচ্ছে' : '📈 Rising')}
            {snapshotData.masteryTrend === 'stable' && (isBangla ? '➡️ স্থির' : '➡️ Stable')}
            {snapshotData.masteryTrend === 'declining' && (isBangla ? '📉 পতনশীল' : '📉 Declining')}
          </motion.div>
        </div>

        {/* Confidence Meter */}
        <div className="mb-6 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              {isBangla ? 'আত্মবিশ্বাস পূর্বাভাস' : 'Confidence Forecast'}
            </span>
            <span className={cn(
              "text-2xl font-bold",
              snapshotData.overallConfidence >= 70 ? "text-emerald-500" :
              snapshotData.overallConfidence >= 40 ? "text-amber-500" : "text-rose-500"
            )}>
              {snapshotData.overallConfidence}%
            </span>
          </div>
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${snapshotData.overallConfidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                snapshotData.overallConfidence >= 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                snapshotData.overallConfidence >= 40 ? "bg-gradient-to-r from-amber-500 to-amber-400" : 
                "bg-gradient-to-r from-rose-500 to-rose-400"
              )}
            />
            {/* Glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: `${snapshotData.overallConfidence}%` }}
              className={cn(
                "absolute inset-y-0 left-0 rounded-full blur-sm",
                snapshotData.overallConfidence >= 70 ? "bg-emerald-500/50" :
                snapshotData.overallConfidence >= 40 ? "bg-amber-500/50" : "bg-rose-500/50"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isBangla 
              ? `গড় ধারণ: ${snapshotData.averageRetentionDays} দিন` 
              : `Avg retention: ${snapshotData.averageRetentionDays} days`}
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {isBangla ? 'সম্ভাব্য ভবিষ্যত' : 'Possible Futures'}
          </p>

          {/* Single wide “tab” row across all devices */}
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {snapshotData.scenarios.map((scenario) => (
              <motion.button
                key={scenario.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "relative flex-shrink-0 w-[220px] p-3 rounded-xl border transition-all duration-300 text-left",
                  activeScenario === scenario.id
                    ? "bg-card border-primary/50 shadow-lg shadow-primary/10"
                    : "bg-card/30 border-border/30 hover:border-border"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                    scenario.icon === 'better' && "bg-emerald-500/10 text-emerald-500",
                    scenario.icon === 'worse' && "bg-rose-500/10 text-rose-500",
                    scenario.icon === 'current' &&
                      (scenario.color === 'emerald'
                        ? "bg-emerald-500/10 text-emerald-500"
                        : scenario.color === 'amber'
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-rose-500/10 text-rose-500")
                  )
                }
                >
                  {getScenarioIcon(scenario.icon)}
                </div>
                <p className="text-xs font-medium leading-snug">
                  {isBangla ? scenario.titleBn : scenario.title}
                </p>

                {activeScenario === scenario.id && (
                  <motion.div
                    layoutId="activeScenario"
                    className="absolute inset-0 rounded-xl border-2 border-primary/50"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Active Scenario Details */}
        <AnimatePresence mode="wait">
          {activeScenarioData && (
            <motion.div
              key={activeScenarioData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  activeScenarioData.confidenceLevel === 'high' && "bg-emerald-500/10 text-emerald-500",
                  activeScenarioData.confidenceLevel === 'medium' && "bg-amber-500/10 text-amber-500",
                  activeScenarioData.confidenceLevel === 'low' && "bg-rose-500/10 text-rose-500"
                )}>
                  {activeScenarioData.confidenceLevel === 'high' && <CheckCircle2 className="w-5 h-5" />}
                  {activeScenarioData.confidenceLevel === 'medium' && <AlertTriangle className="w-5 h-5" />}
                  {activeScenarioData.confidenceLevel === 'low' && <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {isBangla ? activeScenarioData.descriptionBn : activeScenarioData.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isBangla ? 'দক্ষতা পরিবর্তন' : 'Mastery Change'}
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    activeScenarioData.masteryChange > 0 ? "text-emerald-500" : 
                    activeScenarioData.masteryChange < 0 ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {activeScenarioData.masteryChange > 0 ? '+' : ''}{activeScenarioData.masteryChange}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isBangla ? 'টপিক মনে থাকবে' : 'Topics Stay Fresh'}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {activeScenarioData.daysUntilDecay} {isBangla ? 'দিন' : 'days'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Topic Forecasts */}
        {snapshotData.topicForecasts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {isBangla ? 'টপিক পূর্বাভাস' : 'Topic Forecasts'}
            </p>
            <div className="space-y-2">
              {snapshotData.topicForecasts.slice(0, 3).map((topic, index) => (
                <motion.div
                  key={topic.topicName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.topicName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.currentMastery}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="h-full bg-primary/60 rounded-full"
                        />
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.projectedMastery}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                          className={cn(
                            "h-full rounded-full",
                            topic.projectedMastery >= topic.currentMastery 
                              ? "bg-emerald-500/60" 
                              : "bg-rose-500/60"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <p className={cn(
                      "text-xs font-medium",
                      topic.daysUntilForgotten > 14 ? "text-emerald-500" :
                      topic.daysUntilForgotten > 7 ? "text-amber-500" : "text-rose-500"
                    )}>
                      {topic.daysUntilForgotten}d
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isBangla ? 'বাকি' : 'left'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Insight Message */}
        {snapshotData.topWeakTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <p className="text-xs text-center">
              <Zap className="w-3 h-3 inline mr-1 text-primary" />
              {isBangla 
                ? `"${snapshotData.topWeakTopic}" টপিকে ২টি ছোট রিভিশন পরীক্ষা পর্যন্ত শক্তিশালী রাখবে।`
                : `With 2 short revisions, "${snapshotData.topWeakTopic}" stays strong until exams.`}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FutureYouSnapshot;
