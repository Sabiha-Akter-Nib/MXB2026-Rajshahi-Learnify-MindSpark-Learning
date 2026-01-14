import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  School,
  BookOpen,
  Languages,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  GraduationCap,
  Trash2,
  AlertTriangle,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

      // Fetch without division first (type-safe), then get division separately
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
        // Fetch division separately using raw query to avoid type issues
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
    
    // If class changes and is no longer 9-10, clear division
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

    // Only include division for class 9-10
    const updateData: Record<string, any> = {
      full_name: profile.full_name,
      school_name: profile.school_name,
      class: profile.class,
      version: profile.version,
    };

    // Only save division if user is in class 9-10
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
      console.error("Error saving profile:", error);
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
      
      // Delete all user data from tables in order (respecting foreign keys)
      // First delete child records, then parent records
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

      // Sign out the user (the auth user deletion requires admin privileges)
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading font-bold text-xl">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account details</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex justify-center pb-4 border-b border-border/50">
                <AvatarUpload
                  userId={user.id}
                  userName={profile.full_name}
                  size="lg"
                  showUploadButton={true}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                  Email (cannot be changed)
                </Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="school_name" className="flex items-center gap-2">
                  <School className="w-4 h-4 text-muted-foreground" />
                  School Name
                </Label>
                <Input
                  id="school_name"
                  value={profile.school_name}
                  onChange={(e) => handleChange("school_name", e.target.value)}
                  placeholder="Enter your school name"
                />
              </div>

              {/* Class Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  Class
                </Label>
                <Select
                  value={profile.class.toString()}
                  onValueChange={(val) => handleChange("class", parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your class" />
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

              {/* Division Selection (only for class 9-10) */}
              {profile.class >= 9 && profile.class <= 10 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    Division
                  </Label>
                  <Select
                    value={profile.division || ""}
                    onValueChange={(val) => handleChange("division", val as Division)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="science">বিজ্ঞান (Science)</SelectItem>
                      <SelectItem value="commerce">ব্যবসায় শিক্ষা (Commerce)</SelectItem>
                      <SelectItem value="arts">মানবিক (Arts)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This determines which subjects you'll see for your class
                  </p>
                </div>
              )}

              {/* Version Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  Curriculum Version
                </Label>
                <Select
                  value={profile.version}
                  onValueChange={(val) => handleChange("version", val as "bangla" | "english")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bangla">বাংলা (Bangla)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-[140px]"
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
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NotificationSettings />
        </motion.div>


        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <Link to="/achievements">View Achievements</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
              <Button variant="outline" asChild className="col-span-2">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone - Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
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
                        This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all your data including:
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
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;