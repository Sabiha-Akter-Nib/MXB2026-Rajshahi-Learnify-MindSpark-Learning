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

// Dummy data for leaderboard
const generateDummyLeaderboard = (currentUserXP: number, currentUserId: string, currentUserName: string): LeaderboardEntry[] => {
  const dummyNames = [
    "Arif Rahman", "Fatima Akter", "Rahim Uddin", "Nusrat Jahan", "Karim Hossain",
    "Sadia Islam", "Tanvir Ahmed", "Maliha Khatun", "Sajid Ali", "Riya Sultana",
    "Zahid Hassan", "Nadia Begum", "Imran Khan", "Ayesha Siddiqua", "Rafiq Mia",
    "Lamia Haque", "Farhan Chowdhury", "Tasnim Akter", "Jubayer Ahmed", "Sumaiya Islam"
  ];

  const schools = [
    "Dhaka Collegiate School", "Rajshahi Model School", "Chittagong Grammar School",
    "Sylhet Cadet College", "Khulna Public School", "Comilla High School"
  ];

  // Generate base entries with random XP
  const entries: LeaderboardEntry[] = dummyNames.map((name, index) => {
    const baseXP = Math.floor(Math.random() * 3000) + 500;
    return {
      rank: 0,
      userId: `dummy-${index}`,
      displayName: name,
      schoolName: schools[Math.floor(Math.random() * schools.length)],
      studentClass: Math.floor(Math.random() * 5) + 5,
      totalXp: baseXP,
      currentStreak: Math.floor(Math.random() * 30),
      totalStudyMinutes: Math.floor(Math.random() * 1000) + 100,
      isCurrentUser: false,
    };
  });

  // Add current user with their actual XP
  entries.push({
    rank: 0,
    userId: currentUserId,
    displayName: currentUserName || "You",
    schoolName: "My School",
    studentClass: 7,
    totalXp: currentUserXP,
    currentStreak: 0,
    totalStudyMinutes: 0,
    isCurrentUser: true,
  });

  // Sort by XP and assign ranks
  return entries
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserDataAndGenerateLeaderboard = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch current user's stats
        const { data: userStats } = await supabase
          .from("student_stats")
          .select("total_xp, current_streak, total_study_minutes")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name, school_name, class")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentUserXP = userStats?.total_xp || 0;
        const currentUserName = userProfile?.full_name || "You";

        // Generate dummy leaderboard with user's actual XP
        let leaderboard = generateDummyLeaderboard(currentUserXP, user.id, currentUserName);

        // Update current user entry with actual data
        leaderboard = leaderboard.map(entry => {
          if (entry.isCurrentUser) {
            return {
              ...entry,
              schoolName: userProfile?.school_name || "My School",
              studentClass: userProfile?.class || 7,
              currentStreak: userStats?.current_streak || 0,
              totalStudyMinutes: userStats?.total_study_minutes || 0,
            };
          }
          return entry;
        });

        // Apply filters (for demo, we just filter display)
        if (filter === "class" && userProfile?.class) {
          leaderboard = leaderboard.filter(e => e.studentClass === userProfile.class || e.isCurrentUser);
        }
        if (filter === "school") {
          leaderboard = leaderboard.filter(e => e.isCurrentUser || Math.random() > 0.5);
        }

        // Re-rank after filtering
        leaderboard = leaderboard
          .sort((a, b) => b.totalXp - a.totalXp)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setEntries(leaderboard);

        // Find current user's rank
        const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
        setUserRank(currentUserEntry || null);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndGenerateLeaderboard();
  }, [user, filter]);

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
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-lg shadow-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">
                  {entries.length} students competing
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* User's Current Rank Card */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold",
                      getRankBadgeClass(userRank.rank)
                    )}>
                      {userRank.rank <= 3 ? getRankIcon(userRank.rank) : (
                        <span className="text-2xl">{userRank.rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Current Rank</p>
                      <p className="font-heading font-bold text-2xl">
                        #{userRank.rank} of {entries.length}
                      </p>
                      <p className="text-lg font-semibold text-primary">
                        {userRank.totalXp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center text-orange-500">
                        <Flame className="w-5 h-5" />
                        <span className="font-bold text-lg">{userRank.currentStreak}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center text-blue-500">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold text-lg">{Math.floor(userRank.totalStudyMinutes / 60)}h</span>
                      </div>
                      <p className="text-muted-foreground text-xs">Studied</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-48">
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
        </div>

        {/* Top 3 Podium */}
        {!loading && entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-3 py-6"
          >
            {/* Second Place */}
            <motion.div 
              className="flex flex-col items-center pt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-3 shadow-xl shadow-gray-400/40 ring-4 ring-gray-200">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <p className={cn(
                "font-semibold text-sm text-center truncate w-full px-2",
                entries[1]?.isCurrentUser && "text-primary"
              )}>
                {entries[1]?.displayName}
                {entries[1]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-sm font-bold text-gray-600">
                {entries[1]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-2xl mt-3 flex items-end justify-center pb-2">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-3 shadow-xl shadow-yellow-500/50 ring-4 ring-yellow-300 animate-pulse-subtle">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className={cn(
                "font-bold text-center truncate w-full px-2",
                entries[0]?.isCurrentUser && "text-primary"
              )}>
                {entries[0]?.displayName}
                {entries[0]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-base font-bold text-amber-600">
                {entries[0]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-32 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-2xl mt-3 flex items-end justify-center pb-2">
                <span className="text-white font-bold text-3xl">1</span>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div 
              className="flex flex-col items-center pt-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-xl shadow-orange-500/40 ring-4 ring-amber-400">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <p className={cn(
                "font-semibold text-sm text-center truncate w-full px-2",
                entries[2]?.isCurrentUser && "text-primary"
              )}>
                {entries[2]?.displayName}
                {entries[2]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-sm font-bold text-orange-600">
                {entries[2]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-20 bg-gradient-to-t from-orange-600 to-amber-600 rounded-t-2xl mt-3 flex items-end justify-center pb-2">
                <span className="text-white font-bold text-xl">3</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200",
                      entry.isCurrentUser && "bg-primary/5 border-l-4 border-primary"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-110",
                      getRankBadgeClass(entry.rank)
                    )}>
                      {entry.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        entry.isCurrentUser && "text-primary font-semibold"
                      )}>
                        {entry.displayName}
                        {entry.isCurrentUser && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Class {entry.studentClass} • {entry.schoolName || "Unknown School"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">
                        {entry.totalXp.toLocaleString()} XP
                      </p>
                      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
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