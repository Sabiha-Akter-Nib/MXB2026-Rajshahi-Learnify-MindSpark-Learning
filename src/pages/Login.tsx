import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import loginLogoImg from "@/assets/login-logo-card.png";
import tugiImg from "@/assets/tugi-mascot.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(181, 191, 238, ${p.o})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(181, 191, 238, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />;
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);
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
    const { error } = await signIn(formData.email, formData.password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast({ title: "Login failed", description: "Invalid email or password. Please try again.", variant: "destructive" });
      } else if (error.message.includes("Email not confirmed")) {
        toast({ title: "Email not verified", description: "Please check your email and verify your account first.", variant: "destructive" });
      } else {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Welcome back!", description: "You have successfully logged in." });
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative flex flex-col items-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)",
      }}
    >
      {/* Particle canvas */}
      <LoginParticleCanvas />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Decorative blurs */}
      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] z-[3]" style={{ background: "#B5BFEE" }} />
      <div className="hidden lg:block absolute bottom-[15%] right-[25%] w-[250px] h-[250px] rounded-full opacity-15 blur-[80px] z-[3]" style={{ background: "#5B4364" }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5 pt-10 pb-32 lg:pt-16 flex flex-col items-center gap-5 lg:gap-6">

        {/* Welcome card / logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xs sm:max-w-sm"
        >
          <img
            src={loginLogoImg}
            alt="OddhaboshAI - Your AI Study Companion"
            className="w-full h-auto drop-shadow-2xl"
          />
        </motion.div>

        {/* Log In header bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full"
        >
          <div
            className="w-full py-3.5 rounded-2xl text-center text-lg font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(91,67,100,0.6) 0%, rgba(11,6,90,0.5) 100%)",
              color: "rgba(181, 191, 238, 0.9)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(181, 191, 238, 0.15)",
            }}
          >
            লগ ইন
          </div>
        </motion.div>

        {/* Form card */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full rounded-3xl p-6 space-y-5"
          style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.35) 0%, rgba(11,6,90,0.3) 100%)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(181, 191, 238, 0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: "rgba(181, 191, 238, 0.9)" }}>
              ইমেইল / মোবাইল
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background: "rgba(240, 235, 250, 0.92)",
                  color: "#2D1B4E",
                  boxShadow: "0 4px 12px rgba(160, 130, 200, 0.35), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
                  border: errors.email ? "2px solid #ef4444" : "2px solid rgba(180, 150, 220, 0.5)",
                }}
              />
            </div>
            {errors.email && <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold" style={{ color: "rgba(181, 191, 238, 0.9)" }}>
                পাসওয়ার্ড
              </label>
              <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "rgba(181, 191, 238, 0.7)" }}>
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="আপনার পাসওয়ার্ড দিন"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full py-3.5 px-5 pr-12 rounded-2xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background: "rgba(240, 235, 250, 0.92)",
                  color: "#2D1B4E",
                  boxShadow: "0 4px 12px rgba(160, 130, 200, 0.35), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
                  border: errors.password ? "2px solid #ef4444" : "2px solid rgba(180, 150, 220, 0.5)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "#5B4364" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>{errors.password}</p>}
          </div>

          {/* Decorative dots */}
          <div className="flex justify-center gap-1.5 py-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(181, 191, 238, 0.3)" }} />
            ))}
          </div>

          {/* Submit button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="px-12 py-3.5 rounded-full text-base font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              style={{
                background: "rgba(240, 235, 250, 0.92)",
                color: "#4A3A8A",
                boxShadow: "0 4px 16px rgba(160, 130, 200, 0.4), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
                border: "2px solid rgba(180, 150, 220, 0.5)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  লগ ইন হচ্ছে...
                </span>
              ) : (
                "লগ ইন"
              )}
            </button>
          </div>
        </motion.form>

        {/* Sign up link */}
        <p className="text-sm text-center" style={{ color: "rgba(181, 191, 238, 0.7)" }}>
          অ্যাকাউন্ট নেই?{" "}
          <Link to="/signup" className="font-semibold hover:underline" style={{ color: "rgba(224, 210, 255, 0.95)" }}>
            সাইন আপ করুন
          </Link>
        </p>
      </div>

      {/* Tugi mascot */}
      <img
        src={tugiImg}
        alt="Tugi mascot"
        className="absolute bottom-0 right-0 h-28 sm:h-32 md:h-40 lg:h-52 xl:h-64 2xl:h-72 object-contain z-20 pointer-events-none"
      />
    </div>
  );
};

export default Login;
