import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from "lucide-react";
import loginLogoImg from "@/assets/login-logo-card.png";
import tugiForgotImg from "@/assets/tugi-forgot.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// ─── Particle Canvas ───
const ResetParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1, o: Math.random() * 0.5 + 0.2,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(181, 191, 238, ${p.o})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(181, 191, 238, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />;
};

const cardStyle = {
  background: "linear-gradient(135deg, rgba(91,67,100,0.35) 0%, rgba(11,6,90,0.3) 100%)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(181, 191, 238, 0.2)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
};

const inputStyle = {
  background: "rgba(240, 235, 250, 0.92)",
  color: "#2D1B4E",
  boxShadow: "0 4px 12px rgba(160, 130, 200, 0.35), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
  border: "2px solid rgba(180, 150, 220, 0.5)",
};

const inputErrorStyle = { ...inputStyle, border: "2px solid #ef4444" };

const btnStyle = {
  background: "rgba(240, 235, 250, 0.92)",
  color: "#4A3A8A",
  boxShadow: "0 4px 16px rgba(160, 130, 200, 0.4), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
  border: "2px solid rgba(180, 150, 220, 0.5)",
};

const labelColor = "rgba(181, 191, 238, 0.9)";

const passwordSchema = z.object({
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") setIsValidSession(true);
        });
        return () => subscription.unsubscribe();
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async () => {
    setErrors({});
    const result = passwordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: formData.password });
    setIsLoading(false);
    if (error) { toast({ title: "সমস্যা", description: error.message, variant: "destructive" }); return; }
    setIsSuccess(true);
    toast({ title: "পাসওয়ার্ড পরিবর্তন হয়েছে!" });
  };

  // Invalid session state
  if (!isValidSession) {
    return (
      <div className="min-h-[100dvh] max-h-[100dvh] relative flex flex-col items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)" }}>
        <ResetParticleCanvas />
        <div className="absolute inset-0 z-[2] opacity-[0.08]" style={{
          backgroundImage: "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(181, 191, 238, 0.15)" }}>
            <Lock className="w-7 h-7" style={{ color: "rgba(181, 191, 238, 0.9)" }} />
          </div>
          <p className="text-sm font-semibold text-center" style={{ color: labelColor }}>লিংক অবৈধ বা মেয়াদোত্তীর্ণ</p>
          <Link to="/forgot-password" className="px-8 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.04]" style={btnStyle}>
            নতুন লিংক নিন
          </Link>
        </div>
        <motion.img src={tugiForgotImg} alt="Tugi" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute bottom-0 right-0 h-28 sm:h-32 md:h-40 lg:h-52 object-contain z-20 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] relative flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)" }}>
      <ResetParticleCanvas />

      <div className="absolute inset-0 z-[2] opacity-[0.08]" style={{
        backgroundImage: "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] z-[3]" style={{ background: "#B5BFEE" }} />

      <div className="relative z-10 w-full max-w-md mx-auto px-5 flex flex-col items-center justify-center flex-1 gap-4 py-4">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[240px] sm:max-w-xs">
          <img src={loginLogoImg} alt="OddhaboshAI" className="w-full h-auto drop-shadow-2xl" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full">
          <div className="w-full py-2.5 rounded-2xl text-center text-base font-bold tracking-wide" style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.6) 0%, rgba(11,6,90,0.5) 100%)",
            color: "rgba(181, 191, 238, 0.9)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(181, 191, 238, 0.15)",
          }}>
            নতুন পাসওয়ার্ড
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full rounded-3xl p-6" style={cardStyle}>

          {isSuccess ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(181, 191, 238, 0.15)" }}>
                <CheckCircle className="w-7 h-7" style={{ color: "rgba(181, 191, 238, 0.9)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: labelColor }}>পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!</p>
              <Link to="/login"
                className="inline-block mt-4 px-8 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.04]"
                style={btnStyle}>
                লগ ইন করুন
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>নতুন পাসওয়ার্ড</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="কমপক্ষে ৬ অক্ষর" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="w-full py-3.5 px-5 pr-12 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
                      style={errors.password ? inputErrorStyle : inputStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80" style={{ color: "#5B4364" }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="আবার লিখুন" value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="w-full py-3.5 px-5 pr-12 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
                      style={errors.confirmPassword ? inputErrorStyle : inputStyle} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80" style={{ color: "#5B4364" }}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: "#fca5a5" }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className="w-full mt-5 py-3 rounded-full text-base font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] disabled:opacity-60"
                style={btnStyle}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    অপেক্ষা করুন...
                  </span>
                ) : "পাসওয়ার্ড পরিবর্তন করুন"}
              </button>
            </>
          )}
        </motion.div>

        <Link to="/login" className="text-sm font-semibold hover:underline" style={{ color: "rgba(224, 210, 255, 0.95)" }}>
          লগ ইন এ ফিরে যান
        </Link>
      </div>

      <motion.img src={tugiForgotImg} alt="Tugi mascot"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="absolute bottom-0 right-0 h-28 sm:h-32 md:h-40 lg:h-52 xl:h-60 object-contain z-20 pointer-events-none" />
    </div>
  );
};

export default ResetPassword;
