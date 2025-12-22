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
} from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";


interface ProfileData {
  full_name: string;
  email: string;
  school_name: string;
  class: number;
  version: "bangla" | "english";
}

const Settings = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { user, loading } = useAuth();
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
        setProfile(data);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, toast]);

  const handleChange = (field: keyof ProfileData, value: string | number) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        school_name: profile.school_name,
        class: profile.class,
        version: profile.version,
      })
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
      </main>
    </div>
  );
};

export default Settings;