import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Flame,
  Clock,
  Star,
  Users,
  School,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  schoolName: string | null;
  studentClass: number;
  totalXp: number;
  currentStreak: number;
  totalStudyMinutes: number;
  isCurrentUser: boolean;
}

type FilterType = "all" | "class" | "school";
type TimeRange = "all" | "weekly" | "monthly";

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [userProfile, setUserProfile] = useState<{ class: number; school_name: string } | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("class, school_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setUserProfile(data);
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch all profiles with their stats
        let query = supabase
          .from("profiles")
          .select(`
            user_id,
            full_name,
            school_name,
            class
          `);

        // Apply class filter
        if (filter === "class" && userProfile?.class) {
          query = query.eq("class", userProfile.class);
        }
        
        // Apply school filter
        if (filter === "school" && userProfile?.school_name) {
          query = query.eq("school_name", userProfile.school_name);
        }

        const { data: profiles, error: profileError } = await query;

        if (profileError) throw profileError;

        if (!profiles || profiles.length === 0) {
          setEntries([]);
          setLoading(false);
          return;
        }

        // Fetch stats for each user
        const userIds = profiles.map(p => p.user_id);
        const { data: stats, error: statsError } = await supabase
          .from("student_stats")
          .select("user_id, total_xp, current_streak, total_study_minutes")
          .in("user_id", userIds);

        if (statsError) throw statsError;

        // Merge profiles with stats
        const mergedData = profiles.map(profile => {
          const userStats = stats?.find(s => s.user_id === profile.user_id);
          return {
            userId: profile.user_id,
            displayName: profile.full_name || "Anonymous",
            schoolName: profile.school_name,
            studentClass: profile.class,
            totalXp: userStats?.total_xp || 0,
            currentStreak: userStats?.current_streak || 0,
            totalStudyMinutes: userStats?.total_study_minutes || 0,
          };
        });

        // Sort by XP and assign ranks
        const sortedData = mergedData
          .sort((a, b) => b.totalXp - a.totalXp)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
            isCurrentUser: entry.userId === user.id,
          }));

        setEntries(sortedData);

        // Find current user's rank
        const currentUserEntry = sortedData.find(e => e.isCurrentUser);
        setUserRank(currentUserEntry || null);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, filter, timeRange, userProfile]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-orange-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-semibold">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">
                  {entries.length} students competing
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* User's Current Rank */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      getRankBadgeClass(userRank.rank)
                    )}>
                      {userRank.rank <= 3 ? getRankIcon(userRank.rank) : (
                        <span className="font-bold">{userRank.rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Your Rank</p>
                      <p className="text-sm text-muted-foreground">
                        {userRank.totalXp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>{userRank.currentStreak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{Math.floor(userRank.totalStudyMinutes / 60)}h studied</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Students
                </div>
              </SelectItem>
              <SelectItem value="class">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  My Class
                </div>
              </SelectItem>
              <SelectItem value="school">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4" />
                  My School
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Top 3 Podium */}
        {!loading && entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-4 py-4"
          >
            {/* Second Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className="font-medium text-sm text-center truncate w-full">
                {entries[1]?.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {entries[1]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-20 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg mt-2" />
            </div>

            {/* First Place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-2 shadow-xl animate-pulse-subtle">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="font-bold text-center truncate w-full">
                {entries[0]?.displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                {entries[0]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-28 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-lg mt-2" />
            </div>

            {/* Third Place */}
            <div className="flex flex-col items-center pt-12">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <p className="font-medium text-sm text-center truncate w-full">
                {entries[2]?.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {entries[2]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-16 bg-gradient-to-t from-orange-600 to-amber-600 rounded-t-lg mt-2" />
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students found. Start studying to join the leaderboard!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {entries.slice(3).map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                      entry.isCurrentUser && "bg-primary/5 border-l-4 border-primary"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      getRankBadgeClass(entry.rank)
                    )}>
                      {entry.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        entry.isCurrentUser && "text-primary"
                      )}>
                        {entry.displayName}
                        {entry.isCurrentUser && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Class {entry.studentClass} • {entry.schoolName || "Unknown School"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {entry.totalXp.toLocaleString()} XP
                      </p>
                      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.currentStreak}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(entry.totalStudyMinutes / 60)}h
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;