import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Trophy, Loader2, Lock, Zap, ChevronDown, ChevronUp, Shield, Clock, Users, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LEAGUES, getLeagueForXp, getXpToNextLeague, syncLeaderboardEntry, League } from "@/lib/leaderboard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import mascotImg from "@/assets/ai-mascot-3d.png";

interface LeaderboardUser {
  userId: string;
  displayName: string;
  totalXp: number;
  currentStreak: number;
  studentClass: number;
  schoolName: string | null;
  avatarUrl: string | null;
  isCurrentUser: boolean;
  rank: number;
}

// Glass card
const GlassCard = ({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-white/[0.15] backdrop-blur-2xl", className)}
    style={{
      background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const Leaderboard = () => {
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasExams, setHasExams] = useState<boolean | null>(null);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [userLeagueId, setUserLeagueId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if user has at least 1 assessment
        const { count } = await supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        const examCount = count || 0;
        setHasExams(examCount > 0);

        if (examCount === 0) {
          setLoading(false);
          return;
        }

        // Sync current user's leaderboard entry
        await syncLeaderboardEntry(user.id);

        // Fetch all public leaderboard entries
        const { data: entries } = await supabase
          .from("leaderboard_entries")
          .select("user_id, display_name, total_xp, current_streak, class, school_name, is_public")
          .eq("is_public", true)
          .order("total_xp", { ascending: false });

        if (!entries || entries.length === 0) {
          setAllUsers([]);
          setLoading(false);
          return;
        }

        // Fetch avatars for all users
        const userIds = entries.map(e => e.user_id);
        const { data: avatars } = await supabase
          .from("user_avatars")
          .select("user_id, avatar_url")
          .in("user_id", userIds);

        const avatarMap = new Map(avatars?.map(a => [a.user_id, a.avatar_url]) || []);

        const users: LeaderboardUser[] = entries.map((e, i) => ({
          userId: e.user_id,
          displayName: e.display_name,
          totalXp: e.total_xp,
          currentStreak: e.current_streak,
          studentClass: e.class,
          schoolName: e.school_name,
          avatarUrl: avatarMap.get(e.user_id) || null,
          isCurrentUser: e.user_id === user.id,
          rank: i + 1,
        }));

        setAllUsers(users);

        // Find current user's league
        const currentUser = users.find(u => u.isCurrentUser);
        if (currentUser) {
          const league = getLeagueForXp(currentUser.totalXp);
          setUserLeagueId(league.id);
          setExpandedLeague(league.id);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Group users by league
  const leagueGroups = LEAGUES.map(league => {
    const users = allUsers.filter(u => {
      const l = getLeagueForXp(u.totalXp);
      return l.id === league.id;
    });
    // Re-rank within league
    users.sort((a, b) => b.totalXp - a.totalXp);
    return { league, users };
  });

  const currentUser = allUsers.find(u => u.isCurrentUser);
  const currentLeague = currentUser ? getLeagueForXp(currentUser.totalXp) : null;
  const xpToNext = currentUser ? getXpToNextLeague(currentUser.totalXp) : 0;

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      </DashboardLayout>
    );
  }

  // Gate: require at least 1 exam
  if (hasExams === false) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, hsla(270, 60%, 55%, 0.2), hsla(330, 70%, 55%, 0.2))" }}>
              <Lock className="w-10 h-10 text-white/40" />
            </div>
            <motion.img src={mascotImg} alt="mascot" className="w-28 h-28 mx-auto mb-4 drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          </motion.div>
          <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            Leaderboard Locked 🔒
          </h2>
          <p className="text-white/50 text-sm max-w-xs mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
            Complete at least 1 Model Test or Assessment to unlock the National Leaderboard and start competing!
          </p>
          <Button
            onClick={() => navigate("/assessment")}
            className="rounded-full px-8 py-3 font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(300, 65%, 52%), hsl(270, 60%, 55%))" }}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Take Your First Exam
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5" style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* Header */}
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(300, 65%, 52%), hsl(270, 60%, 55%))" }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">National Leaderboard</h1>
              <p className="text-white/40 text-xs flex items-center gap-1">
                <Users className="w-3 h-3" /> {allUsers.length} students competing
              </p>
            </div>
          </div>
        </header>

        {/* Current User League Card */}
        {currentUser && currentLeague && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ background: currentLeague.gradient }} />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: currentLeague.gradient, boxShadow: `0 4px 20px ${currentLeague.glowColor}` }}>
                  {currentLeague.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs">Your League</p>
                  <h2 className="text-white font-bold text-lg">{currentLeague.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-white/70 text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3" style={{ color: currentLeague.textColor }} />
                      {currentUser.totalXp.toLocaleString()} XP
                    </span>
                    <span className="text-white/70 text-xs">
                      Rank #{allUsers.findIndex(u => u.isCurrentUser) + 1}
                    </span>
                  </div>
                  {xpToNext > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                        <span>Next league</span>
                        <span>{xpToNext} XP needed</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((currentUser.totalXp - currentLeague.minXp) / (currentLeague.maxXp === Infinity ? 1000 : currentLeague.maxXp - currentLeague.minXp + 1)) * 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: currentLeague.gradient }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Weekly Info */}
        <GlassCard className="px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
          <p className="text-white/50 text-[11px] leading-tight">
            Leaderboard resets weekly. <span className="text-white/70 font-semibold">Top 40%</span> safe zone, <span className="text-white/70 font-semibold">bottom 30%</span> risk demotion.
          </p>
        </GlassCard>

        {/* League Sections */}
        {leagueGroups.map(({ league, users }, gi) => (
          <motion.div
            key={league.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
          >
            <LeagueSection
              league={league}
              users={users}
              isExpanded={expandedLeague === league.id}
              isUserLeague={userLeagueId === league.id}
              onToggle={() => setExpandedLeague(expandedLeague === league.id ? null : league.id)}
              currentUserId={user?.id || ""}
            />
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

// ── League Section Component ──
interface LeagueSectionProps {
  league: League;
  users: LeaderboardUser[];
  isExpanded: boolean;
  isUserLeague: boolean;
  onToggle: () => void;
  currentUserId: string;
}

const LeagueSection = ({ league, users, isExpanded, isUserLeague, onToggle, currentUserId }: LeagueSectionProps) => {
  const navigate = useNavigate();
  const safeCount = Math.max(1, Math.ceil(users.length * 0.4));
  const demotionStart = Math.floor(users.length * 0.7);

  return (
    <GlassCard
      className={cn("overflow-hidden transition-all", isUserLeague && "ring-1")}
      style={isUserLeague ? { borderColor: league.borderColor, boxShadow: `0 0 20px ${league.glowColor}, 0 8px 32px rgba(0,0,0,0.35)` } : {}}
    >
      {/* League Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: league.gradient, boxShadow: `0 2px 12px ${league.glowColor}` }}>
            {league.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">{league.name}</h3>
              {isUserLeague && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                  style={{ background: league.gradient }}>
                  YOU
                </span>
              )}
            </div>
            <p className="text-white/40 text-[11px]">
              {league.maxXp === Infinity ? `${league.minXp.toLocaleString()}+ XP` : `${league.minXp.toLocaleString()} – ${league.maxXp.toLocaleString()} XP`}
              {" · "}{users.length} {users.length === 1 ? "student" : "students"}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {users.length === 0 ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-white/30 text-xs py-6">No students in this league yet</p>
              </div>
            ) : (
              <div className="px-3 pb-3 space-y-1">
                {/* Safe zone / demotion labels */}
                {users.length >= 3 && (
                  <div className="flex items-center gap-2 px-2 pb-2">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400/70" />
                      <span className="text-emerald-400/70 text-[9px] font-medium">Safe zone: Top {safeCount}</span>
                    </div>
                  </div>
                )}

                {users.map((u, i) => {
                  const isSafe = i < safeCount;
                  const isDemotion = i >= demotionStart && users.length >= 3;

                  return (
                    <motion.button
                      key={u.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/profile?id=${u.userId}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                        u.isCurrentUser
                          ? "bg-white/10 ring-1 ring-white/20"
                          : "hover:bg-white/5",
                        isDemotion && "opacity-70"
                      )}
                    >
                      {/* Rank */}
                      <div className="w-6 text-center flex-shrink-0">
                        {i === 0 ? (
                          <span className="text-base">👑</span>
                        ) : i === 1 ? (
                          <span className="text-base">🥈</span>
                        ) : i === 2 ? (
                          <span className="text-base">🥉</span>
                        ) : (
                          <span className="text-white/40 text-xs font-bold">#{i + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-9 h-9 border-2 flex-shrink-0" style={{ borderColor: u.isCurrentUser ? league.borderColor : "rgba(255,255,255,0.1)" }}>
                        <AvatarImage src={u.avatarUrl || undefined} alt={u.displayName} />
                        <AvatarFallback className="text-white text-xs font-bold" style={{ background: league.gradient, fontSize: "10px" }}>
                          {u.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm font-semibold truncate", u.isCurrentUser ? "text-white" : "text-white/80")}>
                            {u.displayName}
                          </span>
                          {u.isCurrentUser && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/70">YOU</span>
                          )}
                        </div>
                        <p className="text-white/35 text-[10px] truncate">
                          Class {u.studentClass}{u.schoolName ? ` · ${u.schoolName}` : ""}
                        </p>
                      </div>

                      {/* XP */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Zap className="w-3 h-3" style={{ color: league.textColor }} />
                        <span className="text-white/80 text-xs font-bold">{u.totalXp.toLocaleString()}</span>
                      </div>

                      {/* Zone indicator */}
                      {users.length >= 3 && (
                        <div className="flex-shrink-0">
                          {isSafe ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-400/60" title="Safe zone" />
                          ) : isDemotion ? (
                            <div className="w-2 h-2 rounded-full bg-red-400/60" title="Demotion risk" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-yellow-400/40" title="Neutral zone" />
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}

                {/* Zone Legend */}
                {users.length >= 3 && (
                  <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                      <span className="text-white/30 text-[9px]">Safe</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
                      <span className="text-white/30 text-[9px]">Neutral</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400/60" />
                      <span className="text-white/30 text-[9px]">At Risk</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default Leaderboard;
