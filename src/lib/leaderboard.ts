import { supabase } from "@/integrations/supabase/client";

export interface League {
  id: string;
  name: string;
  emoji: string;
  minXp: number;
  maxXp: number;
  gradient: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  bgColor: string;
  safeZonePercent: number;
  demotionRiskPercent: number;
}

export const LEAGUES: League[] = [
  {
    id: "diamond", name: "Diamond League", emoji: "💎",
    minXp: 3000, maxXp: Infinity,
    gradient: "linear-gradient(135deg, hsl(200, 80%, 60%), hsl(220, 90%, 70%), hsl(180, 70%, 55%))",
    borderColor: "hsla(200, 80%, 60%, 0.5)", glowColor: "hsla(200, 80%, 60%, 0.3)",
    textColor: "hsl(200, 80%, 70%)", bgColor: "hsla(200, 80%, 60%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
  {
    id: "platinum", name: "Platinum League", emoji: "⚡",
    minXp: 1500, maxXp: 2999,
    gradient: "linear-gradient(135deg, hsl(270, 50%, 65%), hsl(280, 60%, 70%), hsl(250, 50%, 60%))",
    borderColor: "hsla(270, 50%, 65%, 0.5)", glowColor: "hsla(270, 50%, 65%, 0.3)",
    textColor: "hsl(270, 50%, 75%)", bgColor: "hsla(270, 50%, 65%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
  {
    id: "gold", name: "Gold League", emoji: "🥇",
    minXp: 700, maxXp: 1499,
    gradient: "linear-gradient(135deg, hsl(45, 90%, 55%), hsl(35, 85%, 50%), hsl(50, 95%, 60%))",
    borderColor: "hsla(45, 90%, 55%, 0.5)", glowColor: "hsla(45, 90%, 55%, 0.3)",
    textColor: "hsl(45, 90%, 65%)", bgColor: "hsla(45, 90%, 55%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
  {
    id: "silver", name: "Silver League", emoji: "🥈",
    minXp: 300, maxXp: 699,
    gradient: "linear-gradient(135deg, hsl(220, 15%, 65%), hsl(210, 20%, 75%), hsl(215, 15%, 60%))",
    borderColor: "hsla(220, 15%, 65%, 0.5)", glowColor: "hsla(220, 15%, 65%, 0.3)",
    textColor: "hsl(220, 15%, 75%)", bgColor: "hsla(220, 15%, 65%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
  {
    id: "bronze", name: "Bronze League", emoji: "🥉",
    minXp: 100, maxXp: 299,
    gradient: "linear-gradient(135deg, hsl(25, 60%, 50%), hsl(30, 55%, 45%), hsl(20, 65%, 55%))",
    borderColor: "hsla(25, 60%, 50%, 0.5)", glowColor: "hsla(25, 60%, 50%, 0.3)",
    textColor: "hsl(25, 60%, 60%)", bgColor: "hsla(25, 60%, 50%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
  {
    id: "stone", name: "Stone League", emoji: "🪨",
    minXp: 0, maxXp: 99,
    gradient: "linear-gradient(135deg, hsl(0, 0%, 45%), hsl(0, 0%, 55%), hsl(0, 0%, 40%))",
    borderColor: "hsla(0, 0%, 50%, 0.5)", glowColor: "hsla(0, 0%, 50%, 0.2)",
    textColor: "hsl(0, 0%, 65%)", bgColor: "hsla(0, 0%, 50%, 0.08)",
    safeZonePercent: 40, demotionRiskPercent: 30,
  },
];

export function getLeagueForXp(xp: number): League {
  for (const league of LEAGUES) {
    if (xp >= league.minXp && xp <= league.maxXp) return league;
  }
  return LEAGUES[LEAGUES.length - 1]; // stone
}

export function getNextLeague(currentLeague: League): League | null {
  const idx = LEAGUES.findIndex(l => l.id === currentLeague.id);
  return idx > 0 ? LEAGUES[idx - 1] : null;
}

export function getXpToNextLeague(xp: number): number {
  const league = getLeagueForXp(xp);
  const next = getNextLeague(league);
  if (!next) return 0;
  return next.minXp - xp;
}

/** Get user's current rank (1-indexed) among all public entries */
export async function getUserRank(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("leaderboard_entries")
      .select("user_id, total_xp")
      .eq("is_public", true)
      .order("total_xp", { ascending: false });

    if (!data) return 0;
    const idx = data.findIndex(e => e.user_id === userId);
    return idx === -1 ? 0 : idx + 1;
  } catch {
    return 0;
  }
}

/** Upsert the current user's leaderboard entry with latest data */
export async function syncLeaderboardEntry(userId: string): Promise<void> {
  try {
    const [profileRes, statsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, class, school_name").eq("user_id", userId).maybeSingle(),
      supabase.from("student_stats").select("total_xp, current_streak").eq("user_id", userId).maybeSingle(),
    ]);

    if (!profileRes.data) return;

    const entry = {
      user_id: userId,
      display_name: profileRes.data.full_name,
      class: profileRes.data.class,
      school_name: profileRes.data.school_name,
      total_xp: statsRes.data?.total_xp || 0,
      current_streak: statsRes.data?.current_streak || 0,
      is_public: true,
      updated_at: new Date().toISOString(),
    };

    // Check if entry exists
    const { data: existing } = await supabase
      .from("leaderboard_entries")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("leaderboard_entries").update(entry).eq("user_id", userId);
    } else {
      await supabase.from("leaderboard_entries").insert(entry);
    }
  } catch (e) {
    console.error("Failed to sync leaderboard entry:", e);
  }
}
