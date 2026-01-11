import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, Mail, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step = "email" | "otp" | "newPassword" | "success";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: otpError } = await supabase.functions.invoke("send-otp", {
        body: { email, type: "password_reset" },
      });

      if (otpError) throw otpError;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "OTP Sent",
        description: "Check your email for the 6-digit verification code.",
      });
      
      setStep("otp");
    } catch (err) {
      console.error("Send OTP error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Just verify the OTP is valid (don't reset password yet)
      const { data, error: verifyError } = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otp, type: "password_reset" },
      });

      // If verification fails
      if (verifyError || data?.error) {
        throw new Error(data?.error || "Invalid or expired OTP");
      }

      // OTP verified, move to password step
      // We need to send OTP again for the actual password reset
      // Or store the verified state
      setStep("newPassword");
      
      // Send a new OTP for the final password reset
      await supabase.functions.invoke("send-otp", {
        body: { email, type: "password_reset" },
      });
      
      toast({
        title: "Code Verified",
        description: "Now enter your new password.",
      });
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: resetError } = await supabase.functions.invoke("verify-otp", {
        body: { 
          email, 
          code: otp, 
          type: "password_reset",
          newPassword: password 
        },
      });

      if (resetError) throw resetError;
      if (data?.error) throw new Error(data.error);

      setStep("success");
      toast({
        title: "Password Reset",
        description: "Your password has been updated successfully.",
      });
    } catch (err) {
      console.error("Reset password error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await supabase.functions.invoke("send-otp", {
        body: { email, type: "password_reset" },
      });
      toast({
        title: "OTP Resent",
        description: "A new code has been sent to your email.",
      });
      setOtp("");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend code",
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
              {step === "success" ? (
                <CheckCircle className="w-12 h-12 text-primary-foreground" />
              ) : step === "newPassword" ? (
                <Lock className="w-12 h-12 text-primary-foreground" />
              ) : (
                <Mail className="w-12 h-12 text-primary-foreground" />
              )}
            </div>
            <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">
              {step === "success" ? "All Done!" : step === "newPassword" ? "Create New Password" : "Reset Your Password"}
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
              {step === "success" 
                ? "Your password has been reset successfully."
                : step === "newPassword"
                ? "Choose a strong password for your account."
                : "We'll send you a 6-digit code to verify your identity."}
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

          {step === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="font-heading font-bold text-2xl mb-2">
                Password Reset Complete
              </h1>
              <p className="text-muted-foreground mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Button variant="hero" size="lg" asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </motion.div>
          ) : step === "newPassword" ? (
            <>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Create new password
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter a new password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : step === "otp" ? (
            <>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Enter verification code
              </h1>
              <p className="text-muted-foreground mb-8">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <p className="text-center text-muted-foreground text-sm">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Resend
                  </button>
                </p>

                <button
                  onClick={() => setStep("email")}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-heading font-bold text-3xl mb-2">
                Forgot your password?
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-5">
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
                      Send Verification Code
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
