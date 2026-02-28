import { Link } from "react-router-dom";
import welcomeCardImg from "@/assets/welcome-card.png";
import tugiImg from "@/assets/tugi-mascot.png";

const Welcome = () => {
  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A1F30 0%, #5B4364 28%, #0B065A 47%, #B5BFEE 89%)",
      }}
    >
      {/* Desktop decorative elements */}
      <div className="hidden lg:block absolute top-[10%] left-[8%] w-[300px] h-[300px] rounded-full opacity-20 blur-[100px]" style={{ background: "#B5BFEE" }} />
      <div className="hidden lg:block absolute bottom-[15%] right-[25%] w-[250px] h-[250px] rounded-full opacity-15 blur-[80px]" style={{ background: "#5B4364" }} />
      <div className="hidden lg:block absolute top-[40%] left-[30%] w-[180px] h-[180px] rounded-full opacity-10 blur-[60px]" style={{ background: "#B5BFEE" }} />

      {/* Subtle grid pattern for desktop richness */}
      <div
        className="hidden lg:block absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content area */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Left side - Welcome card image */}
        <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
          <img
            src={welcomeCardImg}
            alt="OddhaboshAI - Your AI Study Companion"
            className="w-full h-auto drop-shadow-2xl"
          />
        </div>

        {/* Right side - Buttons & info (desktop) / Below (mobile) */}
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

      {/* Tugi mascot - bottom right corner, no animation */}
      <img
        src={tugiImg}
        alt="Tugi mascot"
        className="absolute bottom-0 right-0 h-28 sm:h-36 md:h-44 lg:h-56 xl:h-64 object-contain z-20"
      />
    </div>
  );
};

export default Welcome;
