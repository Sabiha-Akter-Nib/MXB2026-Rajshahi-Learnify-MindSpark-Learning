import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2, CheckCircle, Mail } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const classes = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];

const divisions = [
  { value: "science", label: "Science (বিজ্ঞান)", labelBn: "বিজ্ঞান" },
  { value: "commerce", label: "Commerce (ব্যবসায় শিক্ষা)", labelBn: "ব্যবসায় শিক্ষা" },
  { value: "arts", label: "Arts (মানবিক)", labelBn: "মানবিক" },
];

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  school: z.string().min(2, "School name is required").max(200),
  class: z.string().min(1, "Please select a class"),
  version: z.enum(["bangla", "english"], { required_error: "Please select a version" }),
  division: z.string().optional(),
}).refine((data) => {
  const classNum = parseInt(data.class);
  if (classNum >= 9 && classNum <= 10) {
    return !!data.division;
  }
  return true;
}, {
  message: "Please select a division for Class 9-10",
  path: ["division"],
});

type Step = "form" | "emailSent" | "success";

const Signup = () => {
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    class: "",
    version: "",
    division: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedClass = parseInt(formData.class) || 0;
  const showDivision = selectedClass >= 9 && selectedClass <= 10;

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Clear division when class changes to non 9-10
  useEffect(() => {
    if (!showDivision && formData.division) {
      setFormData(prev => ({ ...prev, division: "" }));
    }
  }, [showDivision, formData.division]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.name,
          school_name: formData.school,
          class: parseInt(formData.class),
          version: formData.version as "bangla" | "english",
          ...(showDivision && formData.division ? { division: formData.division } : {}),
        }
      );

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("An account with this email already exists. Please log in instead.");
        }
        throw error;
      }

      setStep("emailSent");
      toast({
        title: "Verification Email Sent",
        description: "Please check your email to confirm your account.",
      });
      
    } catch (err) {
      console.error("Signup error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              MindSpark
            </span>
          </Link>

          {step === "emailSent" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Check your email
              </h1>
              <p className="text-muted-foreground mb-6">
                We've sent a confirmation link to <strong>{formData.email}</strong>. 
                Click the link in the email to activate your account.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  className="w-full"
                >
                  Back to signup
                </Button>
                <Link to="/login" className="text-primary hover:underline text-sm">
                  Already verified? Log in
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Create your account
              </h1>
              <p className="text-muted-foreground mb-8">
                Start your personalized learning journey today
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* School */}
                <div className="space-y-2">
                  <Label htmlFor="school">School Name</Label>
                  <Input
                    id="school"
                    placeholder="Enter your school name"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className={errors.school ? "border-destructive" : ""}
                  />
                  {errors.school && <p className="text-sm text-destructive">{errors.school}</p>}
                </div>

                {/* Class & Version */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                    >
                      <SelectTrigger className={errors.class ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.value} value={cls.value}>
                            {cls.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.class && <p className="text-sm text-destructive">{errors.class}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Select
                      value={formData.version}
                      onValueChange={(value) => setFormData({ ...formData, version: value })}
                    >
                      <SelectTrigger className={errors.version ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bangla">বাংলা</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.version && <p className="text-sm text-destructive">{errors.version}</p>}
                  </div>
                </div>

                {/* Division (for Class 9-10 only) */}
                {showDivision && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label>Division (বিভাগ)</Label>
                    <Select
                      value={formData.division}
                      onValueChange={(value) => setFormData({ ...formData, division: value })}
                    >
                      <SelectTrigger className={errors.division ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select your division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((div) => (
                          <SelectItem key={div.value} value={div.value}>
                            {div.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.division && <p className="text-sm text-destructive">{errors.division}</p>}
                  </motion.div>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-24 h-24 bg-primary-foreground/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              {step === "emailSent" ? (
                <Mail className="w-12 h-12 text-primary-foreground" />
              ) : (
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              )}
            </div>
            <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">
              {step === "emailSent" ? "Almost there!" : "Join MindSpark Learning"}
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
              {step === "emailSent" 
                ? "Just one more step - confirm your email to start learning."
                : "Your personalized AI tutor, designed for NCTB curriculum. Learn smarter, not harder."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
