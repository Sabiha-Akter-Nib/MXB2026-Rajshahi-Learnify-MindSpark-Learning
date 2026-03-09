import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Trophy, Loader2, Lock, Zap, Shield, Users, Crown, Clock,
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

const BRAND = {
  purple: "#6A68DF",
  pink: "#E91E8C",
  peach: "#EFB995",
  white: "#FEFEFE",
  dark: "#2E2C2D",
  magenta: "#C2185B",
};

const Leaderboard = () => {
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasExams, setHasExams] = useState<boolean | null>(null);
  const [activeLeague, setActiveLeague] = useState<string>("diamond");

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Countdown to next Sunday midnight (reset time)
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const getNextSunday = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
      next.setHours(0, 0, 0, 0);
      return next;
    };

    const update = () => {
      const diff = Math.max(0, getNextSunday().getTime() - Date.now());
      const s = Math.floor(diff / 1000);
      setCountdown({
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { count } = await supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        const examCount = count || 0;
        setHasExams(examCount > 0);
        if (examCount === 0) { setLoading(false); return; }

        await syncLeaderboardEntry(user.id);

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

        const currentUser = users.find(u => u.isCurrentUser);
        if (currentUser) {
          const league = getLeagueForXp(currentUser.totalXp);
          setActiveLeague(league.id);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Get users for current active league
  const activeLeagueData = LEAGUES.find(l => l.id === activeLeague)!;
  const leagueUsers = allUsers
    .filter(u => getLeagueForXp(u.totalXp).id === activeLeague)
    .sort((a, b) => b.totalXp - a.totalXp);

  const top3 = leagueUsers.slice(0, 3);
  const rest = leagueUsers.slice(3);

  const safeCount = Math.max(1, Math.ceil(leagueUsers.length * 0.4));

  const currentUser = allUsers.find(u => u.isCurrentUser);
  const currentLeague = currentUser ? getLeagueForXp(currentUser.totalXp) : null;
  const xpToNext = currentUser ? getXpToNextLeague(currentUser.totalXp) : 0;

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.purple }} />
        </div>
      </DashboardLayout>
    );
  }

  if (hasExams === false) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `linear-gradient(135deg, ${BRAND.purple}30, ${BRAND.pink}30)` }}>
              <Lock className="w-10 h-10 style={{ color: BRAND.purple + '80' }}" />
            </div>
            <motion.img src={mascotImg} alt="mascot" className="w-28 h-28 mx-auto mb-4 drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          </motion.div>
          <h2 className="font-bold text-xl mb-2" style={{ fontFamily: "Poppins", color: BRAND.dark }}>
            Leaderboard Locked 🔒
          </h2>
          <p className="text-sm max-w-xs mb-6" style={{ fontFamily: "Poppins", color: BRAND.dark + "80" }}>
            Complete at least 1 Assessment to unlock the National Leaderboard!
          </p>
          <Button
            onClick={() => navigate("/assessment")}
            className="rounded-full px-8 py-3 font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})` }}
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
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4" style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* Header */}
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5 text-white/70" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: BRAND.peach }} />
              Leaderboards
            </h1>
            <p className="text-white/40 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" /> {allUsers.length} students nationwide
            </p>
          </div>
        </header>

        {/* Reset Countdown Timer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.peach }} />
          <p className="text-white/50 text-xs flex-1">Resets in</p>
          <div className="flex items-center gap-1.5">
            {[
              { val: countdown.d, label: "d" },
              { val: countdown.h, label: "h" },
              { val: countdown.m, label: "m" },
              { val: countdown.s, label: "s" },
            ].map(({ val, label }) => (
              <div key={label} className="flex items-center gap-0.5">
                <span
                  className="text-white font-bold text-sm tabular-nums min-w-[22px] text-center rounded-lg px-1 py-0.5"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  {String(val).padStart(2, "0")}
                </span>
                <span className="text-white/30 text-[10px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* League Tabs - Horizontal scrollable buttons */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {LEAGUES.map(league => {
            const isActive = activeLeague === league.id;
            const count = allUsers.filter(u => getLeagueForXp(u.totalXp).id === league.id).length;
            return (
              <button
                key={league.id}
                onClick={() => setActiveLeague(league.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 border",
                  isActive
                    ? "text-white shadow-lg scale-[1.02]"
                    : "text-white/50 border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                )}
                style={isActive ? {
                  background: activeLeagueData.id === league.id ? league.gradient : undefined,
                  borderColor: league.borderColor,
                  boxShadow: `0 4px 20px ${league.glowColor}`,
                } : {}}
              >
                <span className="text-lg">{league.emoji}</span>
                <span>{league.name.replace(" League", "")}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-white/30"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active League Info Bar */}
        <div className="rounded-2xl px-4 py-3 border border-white/10" style={{ background: activeLeagueData.bgColor }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeLeagueData.emoji}</span>
              <div>
                <h2 className="text-white font-bold text-sm">{activeLeagueData.name}</h2>
                <p className="text-white/40 text-[10px]">
                  {activeLeagueData.maxXp === Infinity
                    ? `${activeLeagueData.minXp.toLocaleString()}+ XP`
                    : `${activeLeagueData.minXp.toLocaleString()} – ${activeLeagueData.maxXp.toLocaleString()} XP`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
              <Shield className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
              <span className="text-[10px] font-medium text-white/60">Top {activeLeagueData.safeZonePercent}% safe</span>
            </div>
          </div>

          {/* Safe zone progress bar */}
          <div className="relative h-2 rounded-full overflow-hidden bg-white/10">
            {/* Safe zone (green) */}
            <div
              className="absolute left-0 top-0 h-full rounded-l-full"
              style={{
                width: `${activeLeagueData.safeZonePercent}%`,
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
              }}
            />
            {/* Neutral zone (yellow) */}
            <div
              className="absolute top-0 h-full"
              style={{
                left: `${activeLeagueData.safeZonePercent}%`,
                width: `${100 - activeLeagueData.safeZonePercent - activeLeagueData.demotionRiskPercent}%`,
                background: "linear-gradient(90deg, #eab308, #facc15)",
              }}
            />
            {/* Demotion zone (red) */}
            <div
              className="absolute top-0 h-full rounded-r-full"
              style={{
                left: `${100 - activeLeagueData.demotionRiskPercent}%`,
                width: `${activeLeagueData.demotionRiskPercent}%`,
                background: "linear-gradient(90deg, #ef4444, #f87171)",
              }}
            />
            {/* Shield icon at safe zone boundary */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${activeLeagueData.safeZonePercent}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-[#1a1a2e] flex items-center justify-center border border-white/20">
                <Shield className="w-2.5 h-2.5" style={{ color: "#4ade80" }} />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-emerald-400/70 font-medium">Safe</span>
            <span className="text-[9px] text-yellow-400/70 font-medium">Neutral</span>
            <span className="text-[9px] text-red-400/70 font-medium">At Risk</span>
          </div>
        </div>

        {/* Current user XP to next league (only if user is in this league) */}
        {currentUser && currentLeague && currentLeague.id === activeLeague && xpToNext > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-4 py-3 border flex items-center gap-3"
            style={{ borderColor: currentLeague.borderColor, background: currentLeague.bgColor }}
          >
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: currentLeague.textColor }} />
            <div className="flex-1">
              <p className="text-white/60 text-[10px] mb-1">
                <span className="text-white font-semibold">{xpToNext} XP</span> to next league
              </p>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, ((currentUser.totalXp - currentLeague.minXp) / (currentLeague.maxXp === Infinity ? 3000 : currentLeague.maxXp - currentLeague.minXp + 1)) * 100)}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: currentLeague.gradient }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium for Top 3 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLeague}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {leagueUsers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
                <div className="text-4xl mb-3">{activeLeagueData.emoji}</div>
                <p className="text-white/40 text-sm font-medium">No students in this league yet</p>
                <p className="text-white/25 text-xs mt-1">Be the first to reach {activeLeagueData.name}!</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                {top3.length > 0 && (
                  <div className="flex items-end justify-center gap-3 mb-4 px-4">
                    {/* 2nd Place */}
                    {top3.length >= 2 ? (
                      <PodiumSlot
                        user={top3[1]}
                        place={2}
                        league={activeLeagueData}
                        height="h-24"
                        color="#C0C0C0"
                        labelBg="linear-gradient(135deg, #94a3b8, #64748b)"
                        onClick={() => navigate(`/profile?id=${top3[1].userId}`)}
                      />
                    ) : <div className="w-[30%]" />}

                    {/* 1st Place */}
                    <PodiumSlot
                      user={top3[0]}
                      place={1}
                      league={activeLeagueData}
                      height="h-32"
                      color={BRAND.peach}
                      labelBg={`linear-gradient(135deg, ${BRAND.peach}, #e8a87c)`}
                      onClick={() => navigate(`/profile?id=${top3[0].userId}`)}
                      crown
                    />

                    {/* 3rd Place */}
                    {top3.length >= 3 ? (
                      <PodiumSlot
                        user={top3[2]}
                        place={3}
                        league={activeLeagueData}
                        height="h-20"
                        color="#CD7F32"
                        labelBg="linear-gradient(135deg, #b45309, #92400e)"
                        onClick={() => navigate(`/profile?id=${top3[2].userId}`)}
                      />
                    ) : <div className="w-[30%]" />}
                  </div>
                )}

                {/* Rest of List */}
                {rest.length > 0 && (
                  <div className="space-y-1.5">
                    {rest.map((u, i) => {
                      const rank = i + 4;
                      const isSafe = rank <= safeCount;
                      const isDemotion = rank > leagueUsers.length * 0.7 && leagueUsers.length >= 3;

                      return (
                        <motion.button
                          key={u.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => navigate(`/profile?id=${u.userId}`)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left border",
                            u.isCurrentUser
                              ? "border-white/20 bg-white/[0.08]"
                              : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]",
                            isDemotion && "opacity-60"
                          )}
                        >
                          {/* Rank */}
                          <div className="w-7 flex-shrink-0 text-center">
                            <span className="text-white/40 text-xs font-bold">#{rank}</span>
                          </div>

                          {/* Zone indicator */}
                          {leagueUsers.length >= 3 && (
                            <div className="flex-shrink-0">
                              {isSafe ? (
                                <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
                              ) : isDemotion ? (
                                <div className="w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
                              ) : (
                                <div className="w-2 h-2 rounded-full" style={{ background: "#facc15" }} />
                              )}
                            </div>
                          )}

                          {/* Avatar */}
                          <Avatar className="w-10 h-10 border-2 flex-shrink-0" style={{
                            borderColor: u.isCurrentUser ? BRAND.purple + "80" : "rgba(255,255,255,0.1)"
                          }}>
                            <AvatarImage src={u.avatarUrl || undefined} alt={u.displayName} />
                            <AvatarFallback className="text-white text-xs font-bold" style={{ background: activeLeagueData.gradient }}>
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
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: BRAND.purple }}>YOU</span>
                              )}
                            </div>
                            <p className="text-white/35 text-[10px] truncate">
                              Class {u.studentClass}{u.schoolName ? ` · ${u.schoolName}` : ""}
                            </p>
                          </div>

                          {/* XP */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Zap className="w-3 h-3" style={{ color: BRAND.peach }} />
                            <span className="text-white/80 text-xs font-bold">{u.totalXp.toLocaleString()}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

// ── Podium Slot ──
interface PodiumSlotProps {
  user: LeaderboardUser;
  place: number;
  league: League;
  height: string;
  color: string;
  labelBg: string;
  onClick: () => void;
  crown?: boolean;
}

const PodiumSlot = ({ user, place, league, height, color, labelBg, onClick, crown }: PodiumSlotProps) => {
  const placeLabels = ["", "1st", "2nd", "3rd"];
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center w-[30%] group"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Crown for 1st */}
      {crown && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-1"
        >
          <Crown className="w-6 h-6" style={{ color: BRAND.peach, filter: `drop-shadow(0 2px 6px ${BRAND.peach}60)` }} />
        </motion.div>
      )}

      {/* Avatar */}
      <div className="relative mb-2">
        <div
          className="rounded-full p-[3px]"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}90)` }}
        >
          <Avatar className={cn("border-2 border-[#1a1a2e]", place === 1 ? "w-16 h-16" : "w-13 h-13")}>
            <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
            <AvatarFallback className="text-white text-sm font-bold" style={{ background: league.gradient }}>
              {user.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Name */}
      <p className={cn("text-white font-semibold truncate max-w-full text-center", place === 1 ? "text-sm" : "text-xs")}>
        {user.displayName.split(" ")[0]}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <Zap className="w-3 h-3" style={{ color: BRAND.peach }} />
        <span className="text-white/70 text-[11px] font-bold">{user.totalXp.toLocaleString()}</span>
      </div>

      {/* Podium bar */}
      <div
        className={cn("w-full rounded-t-xl mt-2 flex items-end justify-center pb-2 border-t-2", height)}
        style={{
          background: `linear-gradient(180deg, ${color}30, ${color}10)`,
          borderColor: color,
          borderLeft: `1px solid ${color}30`,
          borderRight: `1px solid ${color}30`,
        }}
      >
        <span
          className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
          style={{ background: labelBg }}
        >
          {placeLabels[place]}
        </span>
      </div>
    </motion.button>
  );
};

export default Leaderboard;
