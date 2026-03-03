import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import loginLogoImg from "@/assets/login-logo-card.png";
import tugiForgotImg from "@/assets/tugi-forgot.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// ─── Particle Canvas (shared auth vibe) ───
const ForgotParticleCanvas = () => {
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

type Step = "email" | "emailSent";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendResetLink = async () => {
    setError("");
    const result = z.string().email("সঠিক ইমেইল দিন").safeParse(email);
    if (!result.success) { setError(result.error.errors[0].message); return; }

    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setStep("emailSent");
      toast({ title: "লিংক পাঠানো হয়েছে!", description: "আপনার ইমেইল চেক করুন।" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "কিছু সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] relative flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)" }}>
      <ForgotParticleCanvas />

      {/* Grid */}
      <div className="absolute inset-0 z-[2] opacity-[0.08]" style={{
        backgroundImage: "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] z-[3]" style={{ background: "#B5BFEE" }} />
      <div className="hidden lg:block absolute bottom-[15%] right-[25%] w-[250px] h-[250px] rounded-full opacity-15 blur-[80px] z-[3]" style={{ background: "#5B4364" }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5 flex flex-col items-center justify-center flex-1 gap-4 py-4">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[240px] sm:max-w-xs">
          <img src={loginLogoImg} alt="OddhaboshAI" className="w-full h-auto drop-shadow-2xl" />
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full">
          <div className="w-full py-2.5 rounded-2xl text-center text-base font-bold tracking-wide" style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.6) 0%, rgba(11,6,90,0.5) 100%)",
            color: "rgba(181, 191, 238, 0.9)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(181, 191, 238, 0.15)",
          }}>
            পাসওয়ার্ড ভুলে গেছেন?
          </div>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full rounded-3xl p-6" style={cardStyle}>

          {step === "emailSent" ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(181, 191, 238, 0.15)" }}>
                <Mail className="w-7 h-7" style={{ color: "rgba(181, 191, 238, 0.9)" }} />
              </div>
              <p className="text-sm mb-1 font-semibold" style={{ color: labelColor }}>ইমেইল চেক করুন</p>
              <p className="text-xs mb-5" style={{ color: "rgba(181, 191, 238, 0.6)" }}>
                <strong>{email}</strong> এ রিসেট লিংক পাঠানো হয়েছে।
              </p>
              <button type="button" onClick={() => setStep("email")}
                className="px-8 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.04] active:scale-[0.98]"
                style={btnStyle}>
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <>
              <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>ইমেইল</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendResetLink()}
                className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
                style={error ? inputErrorStyle : inputStyle} />

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium mt-2 text-center" style={{ color: "#fca5a5" }}>
                  {error}
                </motion.p>
              )}

              <button type="button" onClick={handleSendResetLink} disabled={isLoading}
                className="w-full mt-5 py-3 rounded-full text-base font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] disabled:opacity-60"
                style={btnStyle}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    অপেক্ষা করুন...
                  </span>
                ) : "রিসেট লিংক পাঠান"}
              </button>
            </>
          )}
        </motion.div>

        {/* Back to login */}
        <Link to="/login" className="flex items-center gap-2 text-sm font-semibold hover:underline"
          style={{ color: "rgba(224, 210, 255, 0.95)" }}>
          <ArrowLeft className="w-4 h-4" /> লগ ইন এ ফিরে যান
        </Link>
      </div>

      {/* Tugi mascot */}
      <motion.img src={tugiForgotImg} alt="Tugi mascot"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="absolute bottom-0 right-0 h-28 sm:h-32 md:h-40 lg:h-52 xl:h-60 object-contain z-20 pointer-events-none" />
    </div>
  );
};

export default ForgotPassword;
