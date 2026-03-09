import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  ChevronRight,
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
}

const Settings = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "danger">("profile");
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
        .select("full_name, email, school_name, class, version")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } else if (data) {
        const { data: divisionData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const profileWithDivision: ProfileData = {
          full_name: data.full_name,
          email: data.email,
          school_name: data.school_name,
          class: data.class,
          version: data.version,
          division: (divisionData as any)?.division || null,
        };
        setProfile(profileWithDivision);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, toast]);

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    if (!profile) return;
    if (field === "class" && typeof value === "number" && (value < 9 || value > 10)) {
      setProfile({ ...profile, [field]: value, division: null });
    } else {
      setProfile({ ...profile, [field]: value });
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);

    const updateData: Record<string, any> = {
      full_name: profile.full_name,
      school_name: profile.school_name,
      class: profile.class,
      version: profile.version,
    };

    if (profile.class >= 9 && profile.class <= 10) {
      updateData.division = profile.division;
    } else {
      updateData.division = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
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
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been deleted.",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !profile) return null;

  const sidebarItems = [
    { id: "profile" as const, label: "Profile", icon: User, desc: "Personal info & preferences" },
    { id: "notifications" as const, label: "Notifications", icon: Bell, desc: "Push & reminders" },
    { id: "danger" as const, label: "Danger Zone", icon: Shield, desc: "Account deletion" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white font-[Poppins]">Settings</h1>
            <p className="text-white/40 text-sm mt-1">Manage your account and preferences</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left nav */}
            <motion.nav
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="md:w-64 shrink-0"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-white/[0.04] last:border-b-0 ${
                      activeSection === item.id
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${item.id === "danger" && activeSection === item.id ? "text-red-400" : ""}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-[11px] text-white/25 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${activeSection === item.id ? "rotate-90" : ""}`} />
                  </button>
                ))}
              </div>
            </motion.nav>

            {/* Right content */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 min-w-0"
            >
              {activeSection === "profile" && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <AvatarUpload
                        userId={user.id}
                        userName={profile.full_name}
                        size="lg"
                        showUploadButton={true}
                      />
                      <div className="text-center sm:text-left">
                        <h2 className="text-lg font-semibold text-white">{profile.full_name}</h2>
                        <p className="text-white/30 text-sm">{profile.email}</p>
                        <p className="text-white/20 text-xs mt-1">Class {profile.class} • {profile.version === "bangla" ? "বাংলা ভার্সন" : "English Version"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
                    <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs">Full Name</Label>
                        <Input
                          value={profile.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label className="text-white/30 text-xs">Email (read-only)</Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="bg-white/[0.02] border-white/[0.05] text-white/30 cursor-not-allowed"
                        />
                      </div>

                      {/* School */}
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs flex items-center gap-1.5">
                          <School className="w-3 h-3" /> School Name
                        </Label>
                        <Input
                          value={profile.school_name}
                          onChange={(e) => handleChange("school_name", e.target.value)}
                          placeholder="Enter your school name"
                          className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                      </div>

                      {/* Class */}
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" /> Class
                        </Label>
                        <Select
                          value={profile.class.toString()}
                          onValueChange={(val) => handleChange("class", parseInt(val))}
                        >
                          <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                              <SelectItem key={c} value={c.toString()}>
                                Class {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Version */}
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs">Curriculum Version</Label>
                        <Select
                          value={profile.version}
                          onValueChange={(val) => handleChange("version", val)}
                        >
                          <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bangla">বাংলা ভার্সন</SelectItem>
                            <SelectItem value="english">English Version</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Division (class 9-10 only) */}
                      {profile.class >= 9 && profile.class <= 10 && (
                        <div className="space-y-1.5">
                          <Label className="text-white/50 text-xs flex items-center gap-1.5">
                            <GraduationCap className="w-3 h-3" /> Division
                          </Label>
                          <Select
                            value={profile.division || ""}
                            onValueChange={(val) => handleChange("division", val as Division)}
                          >
                            <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                              <SelectValue placeholder="Select division" />
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

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 rounded-xl px-6 shadow-lg shadow-purple-500/20 disabled:opacity-40"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : hasChanges ? (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Saved
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden [&_.card]:bg-transparent [&_.card]:border-0 [&_.card]:shadow-none [&_[class*='bg-muted']]:bg-white/[0.05] [&_[class*='text-foreground']]:text-white [&_[class*='text-muted-foreground']]:text-white/40 [&_h3]:text-white [&_p]:text-white/50 [&_label]:text-white/70">
                  <div className="p-6">
                    <NotificationSettings />
                  </div>
                </div>
              )}

              {activeSection === "danger" && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] backdrop-blur-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Danger Zone</h3>
                      <p className="text-white/30 text-sm">Irreversible actions that affect your account</p>
                    </div>
                  </div>

                  <div className="h-px bg-red-500/10" />

                  <div className="space-y-3">
                    <p className="text-white/50 text-sm">
                      Deleting your account will permanently remove all your data including study sessions, progress, achievements, and chat history.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Delete Your Account?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>
                              This action <strong>cannot be undone</strong>. This will permanently delete all your data including:
                            </p>
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
                          <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Account"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
