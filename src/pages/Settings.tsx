import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  School,
  BookOpen,
  Save,
  Loader2,
  CheckCircle,
  GraduationCap,
  Trash2,
  AlertTriangle,
  Bell,
  Shield,
  AtSign,
} from "lucide-react";
import AvatarUpload from "@/components/avatar/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import DashboardLayout from "@/components/layout/DashboardLayout";

type Division = "science" | "commerce" | "arts" | null;

interface ProfileData {
  full_name: string;
  email: string;
  school_name: string;
  class: number;
  version: "bangla" | "english";
  division: Division;
  username: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "danger">("profile");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, school_name, class, version, division, username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
      } else if (data) {
        setProfile({
          full_name: data.full_name,
          email: data.email,
          school_name: data.school_name,
          class: data.class,
          version: data.version,
          division: (data as any).division || null,
          username: data.username || "",
        });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user, toast]);

  const validateUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError(username ? "Username must be at least 3 characters" : "");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Only letters, numbers, and underscores allowed");
      return;
    }
    setCheckingUsername(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (data && data.user_id !== user?.id) {
      setUsernameError("Username already taken");
    } else {
      setUsernameError("");
    }
    setCheckingUsername(false);
  };

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    if (!profile) return;
    if (field === "class" && typeof value === "number" && (value < 9 || value > 10)) {
      setProfile({ ...profile, [field]: value, division: null });
    } else {
      setProfile({ ...profile, [field]: value });
    }
    if (field === "username" && typeof value === "string") {
      validateUsername(value);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user || !profile || usernameError) return;
    setIsSaving(true);

    const updateData: Record<string, any> = {
      full_name: profile.full_name,
      school_name: profile.school_name,
      class: profile.class,
      version: profile.version,
      username: profile.username || null,
    };

    if (profile.class >= 9 && profile.class <= 10) {
      updateData.division = profile.division;
    } else {
      updateData.division = null;
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile changes.", variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !user) return;
    setIsDeleting(true);
    try {
      const userId = user.id;
      await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("chat_conversations").delete().eq("user_id", userId);
      await supabase.from("learning_plan_tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("learning_plans").delete().eq("user_id", userId);
      await supabase.from("revision_schedule").delete().eq("user_id", userId);
      await supabase.from("study_sessions").delete().eq("user_id", userId);
      await supabase.from("assessments").delete().eq("user_id", userId);
      await supabase.from("topic_mastery").delete().eq("user_id", userId);
      await supabase.from("student_progress").delete().eq("user_id", userId);
      await supabase.from("user_achievements").delete().eq("user_id", userId);
      await supabase.from("weekly_achievements").delete().eq("user_id", userId);
      await supabase.from("student_stats").delete().eq("user_id", userId);
      await supabase.from("leaderboard_entries").delete().eq("user_id", userId);
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);
      await signOut();
      toast({ title: "Account Deleted", description: "Your account and all associated data have been deleted." });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({ title: "Error", description: "Failed to delete account. Please try again.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !profile) return null;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "danger" as const, label: "Danger Zone", icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">

          {/* Header with Avatar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <AvatarUpload userId={user.id} userName={profile.full_name} size="lg" showUploadButton={true} />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground font-[Poppins] truncate">{profile.full_name}</h1>
              <p className="text-muted-foreground text-sm truncate">@{profile.username || "no-username"}</p>
              <p className="text-muted-foreground/60 text-xs mt-0.5">Class {profile.class} • {profile.version === "bangla" ? "বাংলা" : "English"}</p>
            </div>
          </motion.div>

          {/* Tab Bar */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === tab.id
                    ? "bg-white/[0.1] text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-white/[0.03]"
                } ${tab.id === "danger" && activeSection === tab.id ? "!text-destructive" : ""}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "profile" && (
                <div className="space-y-4">
                  {/* Identity */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Identity</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Full Name</Label>
                        <Input
                          value={profile.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-white/[0.05] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
                          <AtSign className="w-3 h-3" /> Username
                        </Label>
                        <div className="relative">
                          <Input
                            value={profile.username}
                            onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                            placeholder="your_username"
                            className={`bg-white/[0.05] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl ${
                              usernameError ? "!border-destructive/50" : ""
                            }`}
                          />
                          {checkingUsername && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {usernameError && <p className="text-destructive text-xs">{usernameError}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground/40 text-xs">Email (read-only)</Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="bg-white/[0.02] border-white/[0.05] text-muted-foreground/40 cursor-not-allowed rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Academic</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
                          <School className="w-3 h-3" /> School
                        </Label>
                        <Input
                          value={profile.school_name}
                          onChange={(e) => handleChange("school_name", e.target.value)}
                          placeholder="School name"
                          className="bg-white/[0.05] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" /> Class
                        </Label>
                        <Select value={profile.class.toString()} onValueChange={(val) => handleChange("class", parseInt(val))}>
                          <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-foreground rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[6, 7, 8, 9, 10].map((c) => (
                              <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Version</Label>
                        <Select value={profile.version} onValueChange={(val) => handleChange("version", val)}>
                          <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-foreground rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bangla">বাংলা ভার্সন</SelectItem>
                            <SelectItem value="english">English Version</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {profile.class >= 9 && profile.class <= 10 && (
                        <div className="space-y-1.5">
                          <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
                            <GraduationCap className="w-3 h-3" /> Division
                          </Label>
                          <Select value={profile.division || ""} onValueChange={(val) => handleChange("division", val as Division)}>
                            <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-foreground rounded-xl">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="science">বিজ্ঞান (Science)</SelectItem>
                              <SelectItem value="commerce">ব্যবসায় শিক্ষা (Commerce)</SelectItem>
                              <SelectItem value="arts">মানবিক (Arts)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save */}
                  <motion.div layout className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving || !!usernameError}
                      className="bg-gradient-to-r from-primary to-primary-light hover:opacity-90 text-primary-foreground border-0 rounded-xl px-6 shadow-lg shadow-primary/20 disabled:opacity-40"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      ) : hasChanges ? (
                        <><Save className="w-4 h-4 mr-2" />Save Changes</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" />Saved</>
                      )}
                    </Button>
                  </motion.div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden p-5 [&_.card]:bg-transparent [&_.card]:border-0 [&_.card]:shadow-none [&_[class*='bg-muted']]:bg-white/[0.05] [&_[class*='text-foreground']]:text-foreground [&_[class*='text-muted-foreground']]:text-muted-foreground [&_h3]:text-foreground [&_p]:text-muted-foreground [&_label]:text-foreground/70">
                  <NotificationSettings />
                </div>
              )}

              {activeSection === "danger" && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] backdrop-blur-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">Danger Zone</h3>
                      <p className="text-muted-foreground text-sm">Irreversible actions</p>
                    </div>
                  </div>

                  <div className="h-px bg-destructive/10" />

                  <p className="text-muted-foreground text-sm">
                    Deleting your account will permanently remove all your data including study sessions, progress, achievements, and chat history.
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 rounded-xl">
                        <Trash2 className="w-4 h-4 mr-2" />Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Delete Your Account?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>This action <strong>cannot be undone</strong>. All your data will be permanently deleted.</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>All study sessions and progress</li>
                            <li>Achievements and XP earned</li>
                            <li>Learning plans and assessments</li>
                            <li>Chat history with AI tutor</li>
                          </ul>
                          <div className="pt-2">
                            <Label htmlFor="confirm-delete" className="text-foreground">
                              Type <strong>DELETE</strong> to confirm:
                            </Label>
                            <Input
                              id="confirm-delete"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                              placeholder="DELETE"
                              className="mt-2"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== "DELETE" || isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete Account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
