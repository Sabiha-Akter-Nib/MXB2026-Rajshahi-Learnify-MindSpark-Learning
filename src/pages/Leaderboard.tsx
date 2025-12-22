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
  Sparkles,
  Zap,
  TrendingUp,
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
  schoolName: string;
  studentClass: number;
  totalXp: number;
  currentStreak: number;
  totalStudyMinutes: number;
  isCurrentUser: boolean;
}

interface UserProfile {
  full_name: string;
  school_name: string;
  class: number;
}

type FilterType = "all" | "class" | "school";

// Dummy data for leaderboard - school name will be set dynamically
const generateDummyLeaderboard = (
  currentUserXP: number, 
  currentUserId: string, 
  userProfile: UserProfile | null
): LeaderboardEntry[] => {
  const dummyNames = [
    "Arif Rahman", "Fatima Akter", "Rahim Uddin", "Nusrat Jahan", "Karim Hossain",
    "Sadia Islam", "Tanvir Ahmed", "Maliha Khatun", "Sajid Ali", "Riya Sultana",
    "Zahid Hassan", "Nadia Begum", "Imran Khan", "Ayesha Siddiqua", "Rafiq Mia",
    "Lamia Haque", "Farhan Chowdhury", "Tasnim Akter", "Jubayer Ahmed", "Sumaiya Islam"
  ];

  const userSchool = userProfile?.school_name || "My School";
  const userClass = userProfile?.class || 7;

  // Generate base entries - some with user's school, some with other schools
  const entries: LeaderboardEntry[] = dummyNames.map((name, index) => {
    const baseXP = Math.floor(Math.random() * 3000) + 500;
    // 40% chance to be from same school
    const isSameSchool = Math.random() < 0.4;
    // 30% chance to be from same class
    const isSameClass = Math.random() < 0.3;
    
    return {
      rank: 0,
      userId: `dummy-${index}`,
      displayName: name,
      schoolName: isSameSchool ? userSchool : ["Dhaka Collegiate School", "Rajshahi Model School", "Chittagong Grammar School", "Sylhet Cadet College", "Khulna Public School"][Math.floor(Math.random() * 5)],
      studentClass: isSameClass ? userClass : Math.floor(Math.random() * 5) + 5,
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
    displayName: userProfile?.full_name || "You",
    schoolName: userSchool,
    studentClass: userClass,
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
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, school_name, class")
          .eq("user_id", user.id)
          .maybeSingle();

        const profile: UserProfile | null = profileData ? {
          full_name: profileData.full_name,
          school_name: profileData.school_name,
          class: profileData.class,
        } : null;

        setUserProfile(profile);

        const currentUserXP = userStats?.total_xp || 0;

        // Generate dummy leaderboard with user's actual school
        let leaderboard = generateDummyLeaderboard(currentUserXP, user.id, profile);

        // Update current user entry with actual data
        leaderboard = leaderboard.map(entry => {
          if (entry.isCurrentUser) {
            return {
              ...entry,
              currentStreak: userStats?.current_streak || 0,
              totalStudyMinutes: userStats?.total_study_minutes || 0,
            };
          }
          return entry;
        });

        setAllEntries(leaderboard);
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
  }, [user]);

  // Apply filters when filter changes
  useEffect(() => {
    if (allEntries.length === 0) return;

    let filtered = [...allEntries];

    if (filter === "class" && userProfile?.class) {
      filtered = allEntries.filter(e => e.studentClass === userProfile.class);
    }
    
    if (filter === "school" && userProfile?.school_name) {
      filtered = allEntries.filter(e => e.schoolName === userProfile.school_name);
    }

    // Re-rank after filtering
    filtered = filtered
      .sort((a, b) => b.totalXp - a.totalXp)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    setEntries(filtered);

    // Update user rank for filtered view
    const currentUserEntry = filtered.find(e => e.isCurrentUser);
    setUserRank(currentUserEntry || null);
  }, [filter, allEntries, userProfile]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-lg" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-500" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-yellow-900 shadow-xl shadow-yellow-500/40 ring-2 ring-yellow-300/50";
      case 2:
        return "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-xl shadow-slate-400/40 ring-2 ring-slate-200/50";
      case 3:
        return "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-amber-900 shadow-xl shadow-orange-500/40 ring-2 ring-amber-300/50";
      default:
        return "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-card/60 backdrop-blur-xl border-b border-border/50 z-30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 hover:text-primary transition-all duration-300">
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 ring-2 ring-yellow-300/30">
                  <Trophy className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </motion.div>
              <div>
                <h1 className="font-heading font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Leaderboard</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {entries.length} students competing
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* User's Current Rank Card */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-primary/30 overflow-hidden relative group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 sm:p-8 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold relative",
                        getRankBadgeClass(userRank.rank)
                      )}
                    >
                      {userRank.rank <= 3 ? getRankIcon(userRank.rank) : (
                        <span className="text-3xl font-black">{userRank.rank}</span>
                      )}
                      {userRank.rank <= 3 && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/20"
                        />
                      )}
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        Your Current Rank
                      </p>
                      <p className="font-heading font-black text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        #{userRank.rank} <span className="text-lg font-normal text-muted-foreground">of {entries.length}</span>
                      </p>
                      <p className="text-xl font-bold text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        {userRank.totalXp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                    >
                      <div className="flex items-center gap-1 justify-center text-orange-500">
                        <Flame className="w-5 h-5" />
                        <span className="font-bold text-xl">{userRank.currentStreak}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">Day Streak</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
                    >
                      <div className="flex items-center gap-1 justify-center text-blue-500">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold text-xl">{Math.floor(userRank.totalStudyMinutes / 60)}h</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">Studied</p>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-56 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card hover:border-primary/30 transition-all duration-300">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="all" className="hover:bg-primary/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  All Students
                </div>
              </SelectItem>
              <SelectItem value="class" className="hover:bg-primary/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  My Class
                </div>
              </SelectItem>
              <SelectItem value="school" className="hover:bg-primary/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-accent" />
                  My School
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {filter !== "all" && userProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-sm"
            >
              {filter === "class" && <span>Class {userProfile.class}</span>}
              {filter === "school" && <span className="truncate max-w-[200px]">{userProfile.school_name}</span>}
            </motion.div>
          )}
        </motion.div>

        {/* Top 3 Podium */}
        {!loading && entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 py-8"
          >
            {/* Second Place */}
            <motion.div 
              className="flex flex-col items-center pt-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-18 h-18 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-slate-400/50 ring-4 ring-slate-200/50 relative"
              >
                <Medal className="w-9 h-9 text-white drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 shadow-lg">2</div>
              </motion.div>
              <p className={cn(
                "font-semibold text-sm text-center truncate w-full px-2",
                entries[1]?.isCurrentUser && "text-primary"
              )}>
                {entries[1]?.displayName}
                {entries[1]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-sm font-bold bg-gradient-to-r from-slate-500 to-slate-600 bg-clip-text text-transparent">
                {entries[1]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-28 bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200 rounded-t-3xl mt-3 flex items-end justify-center pb-3 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-white font-black text-3xl drop-shadow-lg relative z-10">2</span>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -8 }}
            >
              <motion.div 
                whileHover={{ scale: 1.15, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 20px rgba(251, 191, 36, 0.4)", "0 0 40px rgba(251, 191, 36, 0.6)", "0 0 20px rgba(251, 191, 36, 0.4)"]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity },
                  scale: { type: "spring", stiffness: 300 }
                }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-3 ring-4 ring-yellow-300/50 relative"
              >
                <Crown className="w-12 h-12 text-white drop-shadow-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-yellow-900 shadow-lg ring-2 ring-yellow-300">1</div>
                <Sparkles className="w-5 h-5 text-yellow-200 absolute top-0 left-0 animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-200 absolute bottom-2 right-0 animate-pulse delay-500" />
              </motion.div>
              <p className={cn(
                "font-bold text-center truncate w-full px-2 text-lg",
                entries[0]?.isCurrentUser && "text-primary"
              )}>
                {entries[0]?.displayName}
                {entries[0]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-base font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                {entries[0]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-36 bg-gradient-to-t from-amber-500 via-yellow-400 to-yellow-300 rounded-t-3xl mt-3 flex items-end justify-center pb-4 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                <span className="text-white font-black text-4xl drop-shadow-lg relative z-10">1</span>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div 
              className="flex flex-col items-center pt-12"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-2xl shadow-orange-500/50 ring-4 ring-amber-400/50 relative"
              >
                <Medal className="w-8 h-8 text-white drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-amber-900 shadow-lg">3</div>
              </motion.div>
              <p className={cn(
                "font-semibold text-sm text-center truncate w-full px-2",
                entries[2]?.isCurrentUser && "text-primary"
              )}>
                {entries[2]?.displayName}
                {entries[2]?.isCurrentUser && " (You)"}
              </p>
              <p className="text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                {entries[2]?.totalXp.toLocaleString()} XP
              </p>
              <div className="w-full h-24 bg-gradient-to-t from-orange-600 via-orange-500 to-amber-500 rounded-t-3xl mt-3 flex items-end justify-center pb-3 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                <span className="text-white font-black text-2xl drop-shadow-lg relative z-10">3</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Full Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : entries.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No students found</p>
                  <p className="text-sm">Start studying to join the leaderboard!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {entries.slice(3).map((entry, index) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ 
                        backgroundColor: "hsl(var(--primary) / 0.05)",
                        x: 4,
                      }}
                      className={cn(
                        "flex items-center gap-4 p-5 transition-all duration-300 cursor-default group",
                        entry.isCurrentUser && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary"
                      )}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg",
                          entry.rank <= 10 
                            ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground" 
                            : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
                        )}
                      >
                        {entry.rank}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold truncate group-hover:text-primary transition-colors",
                          entry.isCurrentUser && "text-primary font-bold"
                        )}>
                          {entry.displayName}
                          {entry.isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <School className="w-3 h-3" />
                            {entry.schoolName}
                          </span>
                          <span>•</span>
                          <span>Class {entry.studentClass}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-1 justify-end">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          {entry.totalXp.toLocaleString()} XP
                        </p>
                        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {entry.currentStreak}d
                          </span>
                          <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                            <Clock className="w-3 h-3 text-blue-500" />
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
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;