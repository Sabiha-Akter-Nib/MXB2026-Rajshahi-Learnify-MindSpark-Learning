import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type Step = "email" | "emailSent";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setStep("emailSent");
      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex">
      {/* Left side - Illustration */}
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
                <CheckCircle className="w-12 h-12 text-primary-foreground" />
              ) : (
                <Mail className="w-12 h-12 text-primary-foreground" />
              )}
            </div>
            <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">
              {step === "emailSent" ? "Check Your Email!" : "Reset Your Password"}
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
              {step === "emailSent" 
                ? "We've sent you a link to reset your password."
                : "We'll send you a link to reset your password."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

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
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-2">
                Check your email
              </h1>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to reset your password.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("email")}
                  className="w-full"
                >
                  Try again
                </Button>
                <Link to="/login" className="text-primary hover:underline text-sm">
                  Back to login
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Forgot your password?
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSendResetLink} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={error ? "border-destructive" : ""}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-6">
                Remember your password?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
