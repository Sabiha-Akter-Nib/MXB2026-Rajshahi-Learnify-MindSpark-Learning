import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import welcomeCardImg from "@/assets/welcome-card.png";
import tugiImg from "@/assets/tugi-mascot.png";

const Welcome = () => {
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

  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)",
      }}
    >
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(181,191,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(181,191,238,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Decorative blurs - desktop */}
      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px] z-[3]" style={{ background: "#B5BFEE" }} />
      <div className="hidden lg:block absolute bottom-[15%] right-[25%] w-[250px] h-[250px] rounded-full opacity-15 blur-[80px] z-[3]" style={{ background: "#5B4364" }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Welcome card image */}
        <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
          <img
            src={welcomeCardImg}
            alt="OddhaboshAI - Your AI Study Companion"
            className="w-full h-auto drop-shadow-2xl"
          />
        </div>

        {/* Buttons & info */}
        <div className="flex flex-col items-center lg:items-start gap-6 lg:gap-8 w-full max-w-sm">
          
          {/* Desktop heading */}
          <div className="hidden lg:block">
            <h1
              className="font-heading font-bold text-4xl xl:text-5xl mb-3 leading-tight"
              style={{
                background: "linear-gradient(135deg, #E8D5FF 0%, #B5BFEE 50%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start Your Journey
            </h1>
            <p className="text-base xl:text-lg leading-relaxed" style={{ color: "rgba(181, 191, 238, 0.85)" }}>
              এআই-এর সাহায্যে স্মার্ট শেখা, দ্রুত অগ্রগতি, আর অসাধারণ ফলাফল।
            </p>
          </div>

          {/* Buttons */}
          <div className="w-full space-y-4">
            <Link to="/login" className="block">
              <button
                className="w-full py-4 rounded-2xl text-lg font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #7C5CBF 0%, #4A3A8A 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 32px rgba(124, 92, 191, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                লগ ইন
              </button>
            </Link>

            <Link to="/signup" className="block">
              <button
                className="w-full py-4 rounded-2xl text-lg font-bold tracking-wide transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #9B7FD4 0%, #6B5AAE 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 32px rgba(155, 127, 212, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                সাইন আপ
              </button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-xs text-center lg:text-left" style={{ color: "rgba(181, 191, 238, 0.6)" }}>
            ✓ No credit card required &nbsp;·&nbsp; ✓ Works on any device
          </p>
        </div>
      </div>

      {/* Tugi mascot - bottom right, much larger */}
      <img
        src={tugiImg}
        alt="Tugi mascot"
        className="absolute bottom-0 right-0 h-28 sm:h-32 md:h-40 lg:h-52 xl:h-64 2xl:h-72 object-contain z-20 pointer-events-none"
      />
    </div>
  );
};

export default Welcome;
