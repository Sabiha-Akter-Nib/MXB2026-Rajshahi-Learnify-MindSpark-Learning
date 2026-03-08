import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Edit3,
  UserPlus,
  UserCheck,
  Search,
  X,
  Mail,
  Phone,
  Users,
  Award,
  CheckCircle,
  Lock,
  Calendar,
  BookOpen,
  GraduationCap,
  Flame,
  Zap,
  ClipboardCheck,
  CircleCheckBig,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import VerifiedBadge, { isVerifiedEmail } from "@/components/VerifiedBadge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { format, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import statStreak3d from "@/assets/stat-streak-glass.png";
import subjectIcon3d from "@/assets/subject-icon-3d.png";
import subjectBooks3dNew from "@/assets/subject-books-3d-new.png";
import statXp3d from "@/assets/stat-xp-3d.png";
import statRank3d from "@/assets/stat-rank-3d.png";
import statExams3d from "@/assets/stat-exams-3d.png";
import coverStar3d from "@/assets/cover-star-3d.png";

// ── Glass Card ──
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-white/[0.15] backdrop-blur-2xl", className)}
    style={{
      background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)",
    }}
    {...props}
  >
    {children}
  </div>
);

// ── Glowing Pie Chart ──
const GlowingPieChart = ({
  data,
  colors,
  size = 120,
  title,
}: {
  data: { name: string; value: number }[];
  colors: string[];
  size?: number;
  title?: string;
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      {title && (
        <p className="text-white/80 text-xs font-bold mb-2 uppercase tracking-wider" style={{ fontFamily: "Poppins, sans-serif" }}>
          {title}
        </p>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            filter: "blur(12px)",
            background: `conic-gradient(${colors.map((c, i) => `${c} ${(i / colors.length) * 100}%`).join(", ")})`,
            opacity: 0.3,
          }}
        />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.3}
              outerRadius={size * 0.44}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-extrabold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
            {total}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
            <span className="text-white/60 text-[9px] font-medium">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Types ──
interface ProfileData {
  user_id: string;
  full_name: string;
  username: string | null;
  email: string;
  school_name: string;
  class: number;
  version: string;
  created_at: string;
  division: string | null;
  cover_color: string | null;
}

interface FollowUser {
  user_id: string;
  full_name: string;
  username: string | null;
  school_name: string;
  class: number;
  email: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewUserId = searchParams.get("id");

  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const targetUserId = viewUserId || user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editSchool, setEditSchool] = useState("");
  const [editCoverColor, setEditCoverColor] = useState("#6A68DF");

  // Stats
  const [totalXP, setTotalXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);

  // Follow
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Follow lists
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Subject progress
  const [subjectProgress, setSubjectProgress] = useState<{ name: string; correct: number; wrong: number; skipped: number }[]>([]);

  // Bloom
  const [bloomLevels, setBloomLevels] = useState<{ name: string; value: number }[]>([]);

  // Achievements
  const [earnedBadges, setEarnedBadges] = useState<{ name: string; icon: string; description: string; xp_reward: number }[]>([]);

  // Weekly XP chart
  const [weeklyXpTarget, setWeeklyXpTarget] = useState<{ label: string; xp: number }[]>([]);
  const [weeklyXpSelf, setWeeklyXpSelf] = useState<{ label: string; xp: number }[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!targetUserId || !user) return;
    fetchProfile();
  }, [targetUserId, user]);

  const fetchProfile = async () => {
    if (!targetUserId || !user) return;
    setIsLoading(true);
    try {
      // Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (profileData) {
        setProfile(profileData as ProfileData);
        setEditName(profileData.full_name);
        setEditUsername(profileData.username || "");
        setEditSchool(profileData.school_name);
        setEditCoverColor((profileData as any).cover_color || "#6A68DF");
      }

      // Stats
      const { data: stats } = await supabase.from("student_stats").select("total_xp, current_streak").eq("user_id", targetUserId).maybeSingle();
      setTotalXP(stats?.total_xp || 0);
      setCurrentStreak(stats?.current_streak || 0);

      // Exams
      const { data: exams } = await supabase.from("assessments").select("id, correct_answers, total_questions, bloom_level, subject_id").eq("user_id", targetUserId);
      setTotalExams(exams?.length || 0);
      setTotalCorrect(exams?.reduce((sum, a) => sum + (a.correct_answers || 0), 0) || 0);

      // Leaderboard rank
      const { data: lb } = await supabase.from("leaderboard_entries").select("user_id, total_xp").eq("is_public", true).order("total_xp", { ascending: false });
      if (lb) {
        const idx = lb.findIndex((e) => e.user_id === targetUserId);
        setLeaderboardRank(idx >= 0 ? idx + 1 : null);
      }

      // Followers/following counts
      const { count: fwers } = await supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", targetUserId);
      const { count: fwing } = await supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", targetUserId);
      setFollowerCount(fwers || 0);
      setFollowingCount(fwing || 0);

      // Am I following this user?
      if (!isOwnProfile) {
        const { data: followCheck } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", user!.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
        setIsFollowing(!!followCheck);
      }

      // Subject progress - fetch actual subjects for student's class, then map assessment data
      const studentClass = profileData?.class || 6;
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, name_bn, icon, color")
        .lte("min_class", studentClass)
        .gte("max_class", studentClass);

      // Build assessment stats per subject
      const assessmentMap: Record<string, { correct: number; wrong: number; skipped: number }> = {};
      exams?.forEach((a) => {
        if (a.subject_id) {
          if (!assessmentMap[a.subject_id]) assessmentMap[a.subject_id] = { correct: 0, wrong: 0, skipped: 0 };
          assessmentMap[a.subject_id].correct += a.correct_answers || 0;
          const wrong = (a.total_questions || 0) - (a.correct_answers || 0);
          assessmentMap[a.subject_id].wrong += wrong > 0 ? wrong : 0;
        }
      });

      if (subjectsData) {
        setSubjectProgress(subjectsData.map((s) => ({
          name: s.name,
          correct: assessmentMap[s.id]?.correct || 0,
          wrong: assessmentMap[s.id]?.wrong || 0,
          skipped: assessmentMap[s.id]?.skipped || 0,
        })));
      }

      // Bloom levels
      const bloomMap: Record<string, number> = {};
      exams?.forEach((a) => {
        const bl = a.bloom_level || "remember";
        bloomMap[bl] = (bloomMap[bl] || 0) + 1;
      });
      setBloomLevels(Object.entries(bloomMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      // Achievements
      const { data: userAch } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", targetUserId);
      if (userAch && userAch.length > 0) {
        const achIds = userAch.map((a) => a.achievement_id);
        const { data: achData } = await supabase.from("achievements").select("name, icon, description, xp_reward").in("id", achIds);
        setEarnedBadges(achData || []);
      } else {
        setEarnedBadges([]);
      }

      // Weekly XP chart data (last 7 days) for target user
      const sevenDaysAgo = subDays(new Date(), 6);
      const buildWeekData = () => {
        const data: { label: string; xp: number }[] = [];
        const keyMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, "yyyy-MM-dd");
          const dayLabel = format(d, "EEE");
          const dateLabel = format(d, "dd, MMM");
          keyMap[key] = data.length;
          data.push({ label: `${dayLabel}\n${dateLabel}`, xp: 0 });
        }
        return { data, keyMap };
      };

      // Target user's XP
      const targetWeek = buildWeekData();
      const { data: targetSessions } = await supabase.from("study_sessions").select("created_at, xp_earned").eq("user_id", targetUserId).gte("created_at", sevenDaysAgo.toISOString());
      const { data: targetAssess } = await supabase.from("assessments").select("completed_at, xp_earned").eq("user_id", targetUserId).gte("completed_at", sevenDaysAgo.toISOString());
      targetSessions?.forEach((s) => { const k = format(new Date(s.created_at), "yyyy-MM-dd"); if (targetWeek.keyMap[k] !== undefined) targetWeek.data[targetWeek.keyMap[k]].xp += s.xp_earned || 0; });
      targetAssess?.forEach((a) => { const k = format(new Date(a.completed_at), "yyyy-MM-dd"); if (targetWeek.keyMap[k] !== undefined) targetWeek.data[targetWeek.keyMap[k]].xp += a.xp_earned || 0; });
      setWeeklyXpTarget(targetWeek.data);

      // Current user's XP (for comparison when viewing others)
      if (!isOwnProfile && user) {
        const selfWeek = buildWeekData();
        const { data: selfSessions } = await supabase.from("study_sessions").select("created_at, xp_earned").eq("user_id", user.id).gte("created_at", sevenDaysAgo.toISOString());
        const { data: selfAssess } = await supabase.from("assessments").select("completed_at, xp_earned").eq("user_id", user.id).gte("completed_at", sevenDaysAgo.toISOString());
        selfSessions?.forEach((s) => { const k = format(new Date(s.created_at), "yyyy-MM-dd"); if (selfWeek.keyMap[k] !== undefined) selfWeek.data[selfWeek.keyMap[k]].xp += s.xp_earned || 0; });
        selfAssess?.forEach((a) => { const k = format(new Date(a.completed_at), "yyyy-MM-dd"); if (selfWeek.keyMap[k] !== undefined) selfWeek.data[selfWeek.keyMap[k]].xp += a.xp_earned || 0; });
        setWeeklyXpSelf(selfWeek.data);
      } else {
        setWeeklyXpSelf([]);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !targetUserId || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setUsernameError("");

    // Validate username uniqueness if provided
    if (editUsername.trim()) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", editUsername.trim())
        .neq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        setUsernameError("This username is already taken");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName, username: editUsername.trim() || null, school_name: editSchool, cover_color: editCoverColor } as any)
      .eq("user_id", user.id);

    if (error?.message?.includes("unique")) {
      setUsernameError("This username is already taken");
      return;
    }

    setProfile((p) => (p ? { ...p, full_name: editName, username: editUsername.trim(), school_name: editSchool, cover_color: editCoverColor } : p));
    setIsEditing(false);
  };

  const loadFollowers = async () => {
    if (!targetUserId) return;
    const { data } = await supabase.from("user_follows").select("follower_id").eq("following_id", targetUserId);
    if (data) {
      const ids = data.map((d) => d.follower_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, school_name, class, email").in("user_id", ids);
        setFollowersList((profiles as FollowUser[]) || []);
      } else {
        setFollowersList([]);
      }
    }
    setShowFollowers(true);
  };

  const loadFollowing = async () => {
    if (!targetUserId) return;
    const { data } = await supabase.from("user_follows").select("following_id").eq("follower_id", targetUserId);
    if (data) {
      const ids = data.map((d) => d.following_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, username, school_name, class, email").in("user_id", ids);
        setFollowingList((profiles as FollowUser[]) || []);
      } else {
        setFollowingList([]);
      }
    }
    setShowFollowing(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const q = searchQuery.trim();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(20);
      setSearchResults((data as ProfileData[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const bloomColors = ["#6A68DF", "#9B87F5", "#FD91D9", "#EFB995", "#BC96F0", "#FEFEFE"];
  const subjectPieColors = ["#58CC02", "#FF4B4B", "#FFBA33"];

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[100dvh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-white/70" />
            <p className="text-white/60 font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>Loading profile...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !profile) return null;

  const displayName = profile.full_name || "Student";
  const joinedDate = format(new Date(profile.created_at), "MMM yyyy");

  return (
    <DashboardLayout>
      <div className="min-h-[100dvh] overflow-x-hidden" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

          {/* ── Header ── */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-white font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>Profile</h1>
            </div>
          </header>

          {/* ── Profile Card ── */}
          <GlassCard className="overflow-hidden">
            {/* Cover Color Banner */}
            <div
              className="h-28 sm:h-36 w-full relative overflow-hidden"
              style={{
                background: profile.cover_color
                  ? `linear-gradient(135deg, ${profile.cover_color}, ${profile.cover_color}dd)`
                  : "linear-gradient(135deg, #6A68DF, #9B87F5)",
              }}
            >
              {/* Decorative 3D stars */}
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                <img src={coverStar3d} alt="" className="absolute -right-4 -top-2 w-24 h-24 sm:w-32 sm:h-32 opacity-30 rotate-12" />
                <img src={coverStar3d} alt="" className="absolute right-16 sm:right-24 -top-1 w-12 h-12 sm:w-16 sm:h-16 opacity-20 -rotate-6" />
                <img src={coverStar3d} alt="" className="absolute right-6 sm:right-10 bottom-0 w-10 h-10 sm:w-14 sm:h-14 opacity-15 rotate-[20deg]" />
              </div>
              {/* Light sweep */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.08) 55%, transparent 70%)" }} />
            </div>

            {/* Profile Info Row */}
            <div className="px-4 sm:px-6 pb-5">
              <div className="flex items-center gap-3 -mt-8 sm:-mt-10">
                {/* Avatar */}
                <div className="shrink-0 [&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0 rounded-full overflow-hidden">
                  <AvatarUpload userId={profile.user_id} userName={displayName} size="lg" showUploadButton={false} />
                </div>

                {/* Name + Username */}
                <div className="flex-1 min-w-0 pt-8 sm:pt-10 overflow-hidden">
                  <h2 className="text-white font-extrabold text-lg sm:text-xl truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{displayName}</span>
                    {isVerifiedEmail(profile.email) && <VerifiedBadge size={18} />}
                  </h2>
                  {profile.username && (
                    <p className="text-white/60 text-sm sm:text-base font-semibold truncate leading-snug">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* School + Joined */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-white/40 text-xs">
                <span className="flex items-center gap-1 truncate">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  {profile.school_name}
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  Joined {joinedDate}
                </span>
              </div>

              {/* Class / Following / Followers */}
              <div className="flex items-center gap-5 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-white font-extrabold text-lg">{profile.class}</span>
                  <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Class</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <button onClick={loadFollowing} className="flex flex-col items-center hover:scale-105 transition-transform active:scale-95">
                  <span className="text-white font-extrabold text-lg">{followingCount}</span>
                  <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Following</span>
                </button>
                <div className="w-px h-8 bg-white/10" />
                <button onClick={loadFollowers} className="flex flex-col items-center hover:scale-105 transition-transform active:scale-95">
                  <span className="text-white font-extrabold text-lg">{followerCount}</span>
                  <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Followers</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2 w-full">
                {isOwnProfile ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 border border-white/[0.15] text-white"
                      style={{
                        background: "linear-gradient(135deg, rgba(106,104,223,0.3) 0%, rgba(155,135,245,0.2) 100%)",
                        boxShadow: "0 4px 20px rgba(106,104,223,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowSearch(true)}
                      className="flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 border border-white/[0.15] text-white"
                      style={{
                        background: "linear-gradient(-45deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <Search className="w-4 h-4" />
                      Find Friends
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={cn(
                      "flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 border transition-all",
                      isFollowing
                        ? "border-white/20 text-white/80"
                        : "border-transparent text-white"
                    )}
                    style={{
                      background: isFollowing
                        ? "linear-gradient(-45deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)"
                        : "linear-gradient(135deg, #6A68DF 0%, #9B87F5 50%, #FD91D9 100%)",
                      boxShadow: isFollowing
                        ? "0 4px 16px rgba(0,0,0,0.2)"
                        : "0 4px 20px rgba(106,104,223,0.4), 0 0 40px rgba(253,145,217,0.15)",
                    }}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* ── Stat Cards (same as Analytics) ── */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { img: statStreak3d, value: String(currentStreak), label: "Streak", grad: "linear-gradient(135deg, #BBA7FD, #9B87F5)", bg: "linear-gradient(150deg, rgba(187,167,253,0.25) 0%, rgba(155,135,245,0.15) 50%, rgba(106,104,223,0.1) 100%)", shadow: "0 8px 32px rgba(155,135,245,0.15), inset 0 1px 0 rgba(255,255,255,0.2)" },
              { img: statRank3d, value: `#${leaderboardRank ?? "—"}`, label: "Rank", grad: "linear-gradient(135deg, #6A68DF, #9B87F5)", bg: "linear-gradient(150deg, rgba(106,104,223,0.25) 0%, rgba(88,80,200,0.15) 50%, rgba(155,135,245,0.1) 100%)", shadow: "0 8px 32px rgba(106,104,223,0.15), inset 0 1px 0 rgba(255,255,255,0.2)" },
              { img: statExams3d, value: String(totalExams), label: "Exams", grad: "linear-gradient(135deg, #FD91D9, #EFB995)", bg: "linear-gradient(150deg, rgba(253,145,217,0.2) 0%, rgba(239,185,149,0.15) 50%, rgba(106,104,223,0.1) 100%)", shadow: "0 8px 32px rgba(253,145,217,0.12), inset 0 1px 0 rgba(255,255,255,0.2)" },
              { img: statXp3d, value: String(totalXP), label: "Total XP", grad: "linear-gradient(135deg, #FD91D9, #AF2D50)", bg: "linear-gradient(150deg, rgba(253,145,217,0.15) 0%, rgba(175,45,80,0.2) 50%, rgba(253,145,217,0.1) 100%)", shadow: "0 8px 32px rgba(175,45,80,0.15), inset 0 1px 0 rgba(255,255,255,0.2)" },
            ].map((card) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border border-white/[0.12] relative"
                style={{ background: card.bg, boxShadow: card.shadow }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(254,254,254,0.04) 50%, transparent 70%)" }} />
                <div className="relative z-10 p-3 flex flex-col items-center text-center">
                  <img src={card.img} alt={card.label} className="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-1" />
                  <p className="text-white text-xl sm:text-2xl font-extrabold leading-none">
                    <span style={{ background: card.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{card.value}</span>
                  </p>
                  <p className="text-white/70 text-[9px] sm:text-[10px] font-bold mt-0.5 uppercase tracking-wide">{card.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Achievements ── */}
          {(() => {
            const streakMilestones = [7, 14, 30, 50, 100, 200, 365];
            const xpMilestones = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);
            const examMilestones = Array.from({ length: 50 }, (_, i) => (i + 1) * 10);
            const correctMilestones = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);

            const getHighest = (milestones: number[], current: number) => {
              const reached = milestones.filter((m) => current >= m);
              return reached.length > 0 ? reached[reached.length - 1] : null;
            };

            // Fixed pink/purple/pale palette — each badge always unique
            const badgeStyles = [
              { grad: "linear-gradient(135deg, #FF6B9D, #C2185B)", shadow: "0 0 24px rgba(255,107,157,0.5)", ring: "rgba(255,107,157,0.25)", textColor: "#FF6B9D" },
              { grad: "linear-gradient(135deg, #A78BFA, #5B21B6)", shadow: "0 0 24px rgba(167,139,250,0.5)", ring: "rgba(167,139,250,0.25)", textColor: "#A78BFA" },
              { grad: "linear-gradient(135deg, #F0ABFC, #9333EA)", shadow: "0 0 24px rgba(240,171,252,0.5)", ring: "rgba(240,171,252,0.25)", textColor: "#F0ABFC" },
              { grad: "linear-gradient(135deg, #FDA4AF, #BE123C)", shadow: "0 0 24px rgba(253,164,175,0.5)", ring: "rgba(253,164,175,0.25)", textColor: "#FDA4AF" },
            ];

            const allBadges = [
              { icon: Flame, highest: getHighest(streakMilestones, currentStreak), topLabel: (h: number) => `${h}`, bottomLabel: "Streak", style: badgeStyles[0] },
              { icon: Zap, highest: getHighest(xpMilestones, totalXP), topLabel: (h: number) => h >= 1000 ? `${(h/1000).toFixed(h%1000===0?0:1)}K` : `${h}`, bottomLabel: "XP", style: badgeStyles[1] },
              { icon: ClipboardCheck, highest: getHighest(examMilestones, totalExams), topLabel: (h: number) => `${h}`, bottomLabel: "Exams", style: badgeStyles[2] },
              { icon: CircleCheckBig, highest: getHighest(correctMilestones, totalCorrect), topLabel: (h: number) => h >= 1000 ? `${(h/1000).toFixed(h%1000===0?0:1)}K` : `${h}`, bottomLabel: "Correct", style: badgeStyles[3] },
            ];

            if (achieved.length === 0) return (
              <GlassCard className="p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FD91D9, #9B87F5)", boxShadow: "0 2px 10px rgba(253,145,217,0.3)" }}>
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base uppercase tracking-wider" style={{ fontFamily: "Poppins, sans-serif" }}>Achievements</h3>
                </div>
                <p className="text-white/40 text-sm text-center py-6" style={{ fontFamily: "Poppins, sans-serif" }}>No badges to display</p>
              </GlassCard>
            );

            return (
              <GlassCard className="p-4 sm:p-5 relative overflow-hidden">
                {/* Background shimmer */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #FD91D9, transparent 70%)" }} />
                  <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #9B87F5, transparent 70%)" }} />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center gap-2 mb-5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #FD91D9, #9B87F5)", boxShadow: "0 2px 10px rgba(253,145,217,0.3)" }}
                  >
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base uppercase tracking-wider" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Achievements
                  </h3>
                  <div className="flex-1 h-px ml-1" style={{ background: "linear-gradient(90deg, rgba(253,145,217,0.3), transparent)" }} />
                </div>

                {/* Badge Grid - centered showcase */}
                <div className="relative z-10 flex flex-wrap justify-center gap-4 sm:gap-6">
                  {achieved.map((b, i) => {
                    const Icon = b.icon;
                    const s = b.style;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                        transition={{
                          opacity: { delay: i * 0.12, duration: 0.4 },
                          scale: { delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 200 },
                          y: { delay: i * 0.12 + 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                        }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative">
                          {/* Outer glow pulse */}
                          <div
                            className="absolute -inset-3 rounded-full animate-pulse"
                            style={{ background: s.ring, filter: "blur(10px)", opacity: 0.6 }}
                          />
                          {/* Badge circle */}
                          <div
                            className="relative w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full flex flex-col items-center justify-center border-[2.5px] border-white/30"
                            style={{
                              background: s.grad,
                              boxShadow: `${s.shadow}, inset 0 2px 0 rgba(255,255,255,0.35), 0 4px 20px rgba(0,0,0,0.3)`,
                            }}
                          >
                            {/* Inner glass highlight */}
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 45%)" }}
                            />
                            {/* Icon */}
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg mb-0.5" strokeWidth={2.5} />
                            {/* Number */}
                            <span
                              className="text-white text-lg sm:text-xl font-extrabold leading-none drop-shadow-md"
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                              {b.topLabel(b.highest!)}
                            </span>
                            {/* Sub-label */}
                            <span
                              className="text-white/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5 drop-shadow-sm"
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                              {b.bottomLabel}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })()}

          {/* ── Subject Progress ── */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <img src={subjectBooks3dNew} alt="Subjects" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 object-contain" />
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: "linear-gradient(135deg, rgba(253,145,217,0.35) 0%, rgba(175,45,80,0.35) 100%)" }}
              >
                <h3 className="text-white font-semibold text-sm sm:text-base">Subject Progress</h3>
                <p className="text-white/50 text-[10px] sm:text-xs">Your performance across subjects</p>
              </div>
            </div>
            {subjectProgress.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">No subjects found for your class.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {subjectProgress.map((sub, index) => {
                  const total = sub.correct + sub.wrong + sub.skipped;
                  const progress = total > 0 ? Math.round((sub.correct / total) * 100) : 0;
                  return (
                    <motion.div
                      key={sub.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl px-2 py-1.5 sm:px-3 sm:py-3 border border-white/10 bg-white/5 backdrop-blur-sm flex flex-row items-center gap-2 sm:gap-2.5"
                    >
                      <img src={subjectIcon3d} alt="" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <span className="text-white text-[11px] sm:text-sm font-medium truncate">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: "linear-gradient(90deg, #E040A0, #A040E0)" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 font-medium">{progress}%</span>
                        </div>
                        <div className="flex gap-2 text-[8px] sm:text-[9px] font-medium">
                          <span className="text-[#58CC02]">{sub.correct}✓</span>
                          <span className="text-[#FF4B4B]">{sub.wrong}✗</span>
                          <span className="text-[#FFBA33]">{sub.skipped}—</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* ── Bloom Level Progress ── */}
          {bloomLevels.length > 0 && (
            <GlassCard className="p-4 sm:p-5">
              <h3 className="text-white font-bold text-sm sm:text-base mb-4 uppercase tracking-wider">Bloom's Taxonomy</h3>
              <div className="flex justify-center">
                <GlowingPieChart
                  data={bloomLevels}
                  colors={bloomColors}
                  size={140}
                />
              </div>
            </GlassCard>
          )}

          {/* ── Weekly XP Chart ── */}
          <GlassCard className="p-4 sm:p-5">
            <h3 className="text-white font-bold text-sm sm:text-base text-center mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              Weekly XP Points History
            </h3>
            <p className="text-white/40 text-[10px] sm:text-xs text-center mb-3">Last 7 days</p>

            {/* Legend */}
            {!isOwnProfile && weeklyXpSelf.length > 0 && (
              <div className="flex items-center gap-4 mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
                  <span className="text-white/50 text-[9px] sm:text-[10px] font-medium">{profile?.full_name || "User"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#9B87F5" }} />
                  <span className="text-white/50 text-[9px] sm:text-[10px] font-medium">You</span>
                </div>
              </div>
            )}

            <div
              className="rounded-xl p-3 sm:p-4"
              style={{ background: "linear-gradient(180deg, rgba(253,145,217,0.15) 0%, rgba(255,255,255,0.05) 100%)" }}
            >
              <div className="h-48 sm:h-56 overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyXpTarget.map((d, i) => ({
                      label: d.label,
                      targetXp: d.xp,
                      selfXp: weeklyXpSelf[i]?.xp ?? 0,
                    }))}
                    margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={() => null} />
                    {/* Target user's line */}
                    <Line
                      type="linear"
                      dataKey="targetXp"
                      stroke={isOwnProfile ? "#9B87F5" : "rgba(255,255,255,0.35)"}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (cx == null || cy == null) return null;
                        const xpVal = payload?.targetXp ?? 0;
                        const isGray = !isOwnProfile;
                        return (
                          <g key={`target-${props.index}`}>
                            <text x={cx} y={cy - 14} textAnchor="middle" fill={isGray ? "rgba(255,255,255,0.4)" : "#BBA7FD"} fontSize={9} fontWeight={600}>{xpVal}</text>
                            <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z" fill={isGray ? "rgba(255,255,255,0.35)" : "#BBA7FD"} stroke={isGray ? "rgba(255,255,255,0.25)" : "#9B87F5"} strokeWidth="1" />
                            </svg>
                          </g>
                        );
                      }}
                      activeDot={{ r: 6, fill: isOwnProfile ? "#BBA7FD" : "rgba(255,255,255,0.5)", stroke: "#fff", strokeWidth: 2 }}
                    />
                    {/* Self line when viewing other profile */}
                    {!isOwnProfile && weeklyXpSelf.length > 0 && (
                      <Line
                        type="linear"
                        dataKey="selfXp"
                        stroke="#9B87F5"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (cx == null || cy == null) return null;
                          const xpVal = payload?.selfXp ?? 0;
                          return (
                            <g key={`self-${props.index}`}>
                              <text x={cx} y={cy - 14} textAnchor="middle" fill="#BBA7FD" fontSize={9} fontWeight={600}>{xpVal}</text>
                              <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z" fill="#BBA7FD" stroke="#9B87F5" strokeWidth="1" />
                              </svg>
                            </g>
                          );
                        }}
                        activeDot={{ r: 6, fill: "#BBA7FD", stroke: "#fff", strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent
          className="border-white/[0.15] max-w-md max-h-[85vh] overflow-y-auto mx-4"
          style={{
            background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex justify-center [&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0">
              <AvatarUpload userId={user.id} userName={editName} size="lg" showUploadButton={false} interactive />
            </div>
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1 block">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1 block">Username</label>
              <Input
                value={editUsername}
                onChange={(e) => { setEditUsername(e.target.value); setUsernameError(""); }}
                placeholder="Choose a username"
                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/30"
              />
              {usernameError && <p className="text-red-400 text-xs mt-1 font-medium">{usernameError}</p>}
            </div>
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1 block">School</label>
              <Input
                value={editSchool}
                onChange={(e) => setEditSchool(e.target.value)}
                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 block">Cover Color</label>
              
              {/* Preview banner */}
              <div
                className="w-full h-16 rounded-xl mb-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${editCoverColor}, ${editCoverColor}dd)`,
                  boxShadow: `0 4px 20px ${editCoverColor}40`,
                }}
              >
                <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)" }} />
              </div>

              {/* Preset colors grid */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {[
                  "#6A68DF", "#9B87F5", "#FD91D9", "#E91E63", "#FF4B4B", "#FF5722",
                  "#FFBA33", "#58CC02", "#1DB954", "#00BCD4", "#2196F3", "#7C4DFF",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditCoverColor(c)}
                    className={cn(
                      "aspect-square rounded-xl border-2 transition-all hover:scale-110 active:scale-95",
                      editCoverColor.toUpperCase() === c ? "border-white scale-105 shadow-lg" : "border-white/10"
                    )}
                    style={{
                      background: c,
                      boxShadow: editCoverColor.toUpperCase() === c ? `0 0 16px ${c}60` : "none",
                    }}
                  />
                ))}
              </div>

              {/* Hex input + color picker */}
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg shrink-0 cursor-pointer relative overflow-hidden border border-white/20"
                  style={{ background: editCoverColor }}
                >
                  <input
                    type="color"
                    value={editCoverColor}
                    onChange={(e) => setEditCoverColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">#</span>
                  <Input
                    value={editCoverColor.replace("#", "").toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      if (val.length <= 6) setEditCoverColor(`#${val}`);
                    }}
                    maxLength={6}
                    placeholder="6A68DF"
                    className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/30 pl-7 font-mono text-sm tracking-widest"
                  />
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              className="w-full py-2.5 rounded-full font-bold text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #6A68DF 0%, #9B87F5 50%, #FD91D9 100%)",
                boxShadow: "0 4px 20px rgba(106,104,223,0.4)",
              }}
            >
              Save Changes
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Followers Dialog ── */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent
          className="border-white/[0.15] max-w-md max-h-[70vh] overflow-y-auto"
          style={{
            background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Followers</DialogTitle>
          </DialogHeader>
          {followersList.length > 0 ? (
            <div className="space-y-2 mt-2">
              {followersList.map((f) => (
                <Link
                  key={f.user_id}
                  to={`/profile?id=${f.user_id}`}
                  onClick={() => setShowFollowers(false)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="[&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0 shrink-0">
                    <AvatarUpload userId={f.user_id} userName={f.full_name} size="sm" showUploadButton={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate flex items-center gap-1">{f.full_name}{isVerifiedEmail(f.email) && <VerifiedBadge size={14} />}</p>
                    <p className="text-white/40 text-xs truncate">
                      {f.username ? `@${f.username} • ` : ""}Class {f.class} • {f.school_name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-6">No followers yet</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Following Dialog ── */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent
          className="border-white/[0.15] max-w-md max-h-[70vh] overflow-y-auto"
          style={{
            background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Following</DialogTitle>
          </DialogHeader>
          {followingList.length > 0 ? (
            <div className="space-y-2 mt-2">
              {followingList.map((f) => (
                <Link
                  key={f.user_id}
                  to={`/profile?id=${f.user_id}`}
                  onClick={() => setShowFollowing(false)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="[&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0 shrink-0">
                    <AvatarUpload userId={f.user_id} userName={f.full_name} size="sm" showUploadButton={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate flex items-center gap-1">{f.full_name}{isVerifiedEmail(f.email) && <VerifiedBadge size={14} />}</p>
                    <p className="text-white/40 text-xs truncate">
                      {f.username ? `@${f.username} • ` : ""}Class {f.class} • {f.school_name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-6">Not following anyone yet</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Search Friends Dialog ── */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent
          className="border-white/[0.15] max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[80vh] overflow-y-auto overflow-x-hidden mx-4"
          style={{
            background: "linear-gradient(135deg, #291A30 0%, #5B0329 38%, #31065A 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Find Friends</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/30 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={searchLoading}
                className="px-4 py-2 rounded-xl font-bold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg, #6A68DF, #9B87F5)",
                  boxShadow: "0 4px 16px rgba(106,104,223,0.3)",
                }}
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </motion.button>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <Link
                    key={r.user_id}
                    to={`/profile?id=${r.user_id}`}
                    onClick={() => setShowSearch(false)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="[&_*]:ring-0 [&_*]:ring-offset-0 [&_*]:border-0 shrink-0">
                      <AvatarUpload userId={r.user_id} userName={r.full_name} size="sm" showUploadButton={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate flex items-center gap-1">{r.full_name}{isVerifiedEmail(r.email) && <VerifiedBadge size={14} />}</p>
                      <p className="text-white/40 text-xs truncate">
                        {r.username ? `@${r.username} • ` : ""}Class {r.class} • {r.school_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchQuery && !searchLoading ? (
              <p className="text-white/40 text-sm text-center py-6">No results found</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Profile;
