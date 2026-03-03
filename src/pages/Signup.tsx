import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowLeft, ChevronRight } from "lucide-react";
import loginLogoImg from "@/assets/login-logo-card.png";
import tugiGlassesImg from "@/assets/tugi-glasses.png";
import tugiOtpImg from "@/assets/tugi-otp.png";
import tugiMascotImg from "@/assets/tugi-mascot.png";
import tugiSchoolImg from "@/assets/tugi-school.png";
import tugiGradesImg from "@/assets/tugi-grades.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// ─── Particle Canvas (same as Login) ───
const SignupParticleCanvas = () => {
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

// ─── Step definitions ───
const TOTAL_STEPS = 6;

const stepTugiMap: Record<number, string> = {
  0: tugiGlassesImg,
  1: tugiOtpImg,
  2: tugiMascotImg,
  3: tugiMascotImg,
  4: tugiSchoolImg,
  5: tugiGradesImg,
};

const classesBn = [
  { value: "1", label: "প্রথম শ্রেণি" },
  { value: "2", label: "দ্বিতীয় শ্রেণি" },
  { value: "3", label: "তৃতীয় শ্রেণি" },
  { value: "4", label: "চতুর্থ শ্রেণি" },
  { value: "5", label: "পঞ্চম শ্রেণি" },
  { value: "6", label: "ষষ্ঠ শ্রেণি" },
  { value: "7", label: "সপ্তম শ্রেণি" },
  { value: "8", label: "অষ্টম শ্রেণি" },
  { value: "9", label: "নবম শ্রেণি" },
  { value: "10", label: "দশম শ্রেণি" },
];

const divisions = [
  { value: "science", label: "বিজ্ঞান" },
  { value: "commerce", label: "ব্যবসায় শিক্ষা" },
  { value: "arts", label: "মানবিক" },
];

const inputStyle = {
  background: "rgba(240, 235, 250, 0.92)",
  color: "#2D1B4E",
  boxShadow: "0 4px 12px rgba(160, 130, 200, 0.35), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
  border: "2px solid rgba(180, 150, 220, 0.5)",
};

const inputErrorStyle = {
  ...inputStyle,
  border: "2px solid #ef4444",
};

const cardStyle = {
  background: "linear-gradient(135deg, rgba(91,67,100,0.35) 0%, rgba(11,6,90,0.3) 100%)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(181, 191, 238, 0.2)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
};

const btnStyle = {
  background: "rgba(240, 235, 250, 0.92)",
  color: "#4A3A8A",
  boxShadow: "0 4px 16px rgba(160, 130, 200, 0.4), inset 0 -2px 0 rgba(180, 150, 220, 0.4)",
  border: "2px solid rgba(180, 150, 220, 0.5)",
};

const labelColor = "rgba(181, 191, 238, 0.9)";

const Signup = () => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    school: "",
    class: "",
    version: "",
    division: "",
  });

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedClass = parseInt(formData.class) || 0;
  const showDivision = selectedClass >= 9 && selectedClass <= 10;

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  const invokeEdge = async (fn: string, body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (error) {
      // Try to parse error context from FunctionsHttpError
      try {
        const ctx = JSON.parse((error as any).context?.body || "{}");
        if (ctx.error) throw new Error(ctx.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
      }
      throw new Error(error.message || "Network error");
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleNext = async () => {
    setError("");
    setIsLoading(true);
    try {
      switch (step) {
        case 0: {
          const emailResult = z.string().email("সঠিক ইমেইল দিন").safeParse(formData.email);
          if (!emailResult.success) { setError(emailResult.error.errors[0].message); break; }
          await invokeEdge("send-otp", { email: formData.email });
          toast({ title: "OTP পাঠানো হয়েছে!", description: "আপনার ইমেইল চেক করুন।" });
          setStep(1);
          break;
        }
        case 1: {
          if (otpCode.length !== 6) { setError("৬ সংখ্যার কোড দিন"); break; }
          await invokeEdge("verify-otp", { email: formData.email, code: otpCode });
          toast({ title: "ভেরিফাই হয়েছে!", description: "আপনার ইমেইল সফলভাবে ভেরিফাই হয়েছে।" });
          setStep(2);
          break;
        }
        case 2: {
          const pwResult = z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").safeParse(formData.password);
          if (!pwResult.success) { setError(pwResult.error.errors[0].message); break; }
          setStep(3);
          break;
        }
        case 3: {
          if (formData.name.trim().length < 2) { setError("নাম দিন"); break; }
          setStep(4);
          break;
        }
        case 4: {
          if (formData.school.trim().length < 2) { setError("স্কুলের নাম দিন"); break; }
          setStep(5);
          break;
        }
        case 5: {
          if (!formData.class) { setError("ক্লাস নির্বাচন করুন"); break; }
          if (!formData.version) { setError("ভার্সন নির্বাচন করুন"); break; }
          if (showDivision && !formData.division) { setError("বিভাগ নির্বাচন করুন"); break; }
          // Complete signup
          await invokeEdge("complete-signup", {
            email: formData.email,
            password: formData.password,
            full_name: formData.name,
            school_name: formData.school,
            class: formData.class,
            version: formData.version,
            ...(showDivision && formData.division ? { division: formData.division } : {}),
          });
          toast({ title: "অ্যাকাউন্ট তৈরি হয়েছে!", description: "এখন লগ ইন করুন।" });
          navigate("/login");
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || "কিছু সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep(step - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTugi = stepTugiMap[step];

  // ─── Step Content Renderers ───
  const renderStepContent = () => {
    const variants = {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -40 },
    };

    switch (step) {
      case 0:
        return (
          <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>ইমেইল / মোবাইল</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
              style={error ? inputErrorStyle : inputStyle}
            />
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
              ইমেইল/মোবাইল নম্বরে পাঠানো ৬ সংখ্যার ওটিপি নম্বর
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none text-center tracking-[0.5em] transition-all focus:ring-2"
              style={error ? inputErrorStyle : inputStyle}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>পাসওয়ার্ড তৈরি করুন</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                className="w-full py-3.5 px-5 pr-12 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
                style={error ? inputErrorStyle : inputStyle}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80" style={{ color: "#5B4364" }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>তোমার নাম</label>
            <input
              type="text"
              placeholder="পুরো নাম লিখুন"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
              style={error ? inputErrorStyle : inputStyle}
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>তোমার স্কুলের নাম</label>
            <input
              type="text"
              placeholder="স্কুলের নাম লিখুন"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="w-full py-3.5 px-5 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2"
              style={error ? inputErrorStyle : inputStyle}
            />
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <label className="block text-sm font-semibold mb-3 text-center" style={{ color: labelColor }}>তোমার ক্লাস</label>
            <div className="max-h-[180px] overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
              {classesBn.map((cls) => (
                <button
                  key={cls.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, class: cls.value, division: "" })}
                  className="w-full py-3 px-5 rounded-2xl text-sm font-medium transition-all duration-200"
                  style={formData.class === cls.value ? {
                    background: "rgba(224, 210, 255, 0.95)",
                    color: "#4A3A8A",
                    border: "2px solid rgba(160, 130, 200, 0.8)",
                    boxShadow: "0 4px 16px rgba(160, 130, 200, 0.5)",
                  } : {
                    background: "rgba(181, 191, 238, 0.15)",
                    color: "rgba(181, 191, 238, 0.8)",
                    border: "1px solid rgba(181, 191, 238, 0.15)",
                  }}
                >
                  {cls.label}
                </button>
              ))}
            </div>

            {/* Version selection */}
            <label className="block text-sm font-semibold mb-2 text-center" style={{ color: labelColor }}>ভার্সন</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[{ value: "bangla", label: "বাংলা" }, { value: "english", label: "English" }].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, version: v.value })}
                  className="py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200"
                  style={formData.version === v.value ? {
                    background: "rgba(224, 210, 255, 0.95)",
                    color: "#4A3A8A",
                    border: "2px solid rgba(160, 130, 200, 0.8)",
                    boxShadow: "0 4px 16px rgba(160, 130, 200, 0.5)",
                  } : {
                    background: "rgba(181, 191, 238, 0.15)",
                    color: "rgba(181, 191, 238, 0.8)",
                    border: "1px solid rgba(181, 191, 238, 0.15)",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Division (9-10 only) */}
            {showDivision && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className="block text-sm font-semibold mb-2 text-center" style={{ color: labelColor }}>বিভাগ</label>
                <div className="grid grid-cols-3 gap-2">
                  {divisions.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, division: d.value })}
                      className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200"
                      style={formData.division === d.value ? {
                        background: "rgba(224, 210, 255, 0.95)",
                        color: "#4A3A8A",
                        border: "2px solid rgba(160, 130, 200, 0.8)",
                      } : {
                        background: "rgba(181, 191, 238, 0.15)",
                        color: "rgba(181, 191, 238, 0.8)",
                        border: "1px solid rgba(181, 191, 238, 0.15)",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)" }}>
      <SignupParticleCanvas />

      {/* Grid */}
      <div className="absolute inset-0 z-[2] opacity-[0.08]" style={{
        backgroundImage: "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Decorative blurs */}
      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] z-[3]" style={{ background: "#B5BFEE" }} />
      <div className="hidden lg:block absolute bottom-[15%] right-[25%] w-[250px] h-[250px] rounded-full opacity-15 blur-[80px] z-[3]" style={{ background: "#5B4364" }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5 pt-10 pb-40 lg:pt-16 flex flex-col items-center gap-5 lg:gap-6">

        {/* Logo card */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-xs sm:max-w-sm">
          <img src={loginLogoImg} alt="OddhaboshAI" className="w-full h-auto drop-shadow-2xl" />
        </motion.div>

        {/* সাইন আপ header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="w-full">
          <div className="w-full py-3.5 rounded-2xl text-center text-lg font-bold tracking-wide" style={{
            background: "linear-gradient(135deg, rgba(91,67,100,0.6) 0%, rgba(11,6,90,0.5) 100%)",
            color: "rgba(181, 191, 238, 0.9)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(181, 191, 238, 0.15)",
          }}>
            সাইন আপ
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full rounded-3xl p-6" style={cardStyle}>

          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium mt-3 text-center" style={{ color: "#fca5a5" }}>
              {error}
            </motion.p>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 py-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{
                background: i === step ? "rgba(224, 210, 255, 0.95)" : i < step ? "rgba(181, 191, 238, 0.5)" : "rgba(181, 191, 238, 0.2)",
                transform: i === step ? "scale(1.3)" : "scale(1)",
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            {step > 0 && (
              <button type="button" onClick={handleBack} disabled={isLoading}
                className="p-3 rounded-full transition-transform hover:scale-105 active:scale-95"
                style={{ background: "rgba(181, 191, 238, 0.15)", border: "1px solid rgba(181, 191, 238, 0.2)" }}>
                <ArrowLeft className="w-4 h-4" style={{ color: "rgba(181, 191, 238, 0.8)" }} />
              </button>
            )}
            <button type="button" onClick={handleNext} disabled={isLoading}
              className="px-10 py-3 rounded-full text-base font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] disabled:opacity-60"
              style={btnStyle}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  অপেক্ষা করুন...
                </span>
              ) : step === TOTAL_STEPS - 1 ? "সাইন আপ করুন" : "পরবর্তী"}
            </button>
          </div>
        </motion.div>

        {/* Login link */}
        <p className="text-sm text-center" style={{ color: "rgba(181, 191, 238, 0.7)" }}>
          ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "rgba(224, 210, 255, 0.95)" }}>
            লগ ইন করুন
          </Link>
        </p>
      </div>

      {/* Tugi mascot - changes per step */}
      <AnimatePresence mode="wait">
        <motion.img
          key={step}
          src={currentTugi}
          alt="Tugi mascot"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-0 right-0 h-32 sm:h-36 md:h-44 lg:h-56 xl:h-64 2xl:h-72 object-contain z-20 pointer-events-none"
        />
      </AnimatePresence>
    </div>
  );
};

export default Signup;
