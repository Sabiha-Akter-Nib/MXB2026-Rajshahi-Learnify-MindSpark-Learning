// Static, performance-optimized tutor background without rapid animations
// Removes the glitchy blinking caused by 40 particles with continuous scale animations

const TutorBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Deep purple gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            hsl(270, 60%, 28%) 0%, 
            hsl(265, 55%, 22%) 25%, 
            hsl(260, 50%, 18%) 50%, 
            hsl(255, 55%, 15%) 75%, 
            hsl(250, 60%, 12%) 100%
          )`,
        }}
      />
      
      {/* Secondary gradient overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(147, 112, 219, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, rgba(100, 149, 237, 0.1) 0%, transparent 50%)`,
        }}
      />
      
      {/* Subtle static grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Static glowing orbs - CSS only, no JS animations */}
      <div 
        className="absolute rounded-full pointer-events-none animate-pulse"
        style={{
          width: 500,
          height: 500,
          left: "-10%",
          top: "10%",
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)`,
          filter: "blur(40px)",
          animationDuration: "8s",
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none animate-pulse"
        style={{
          width: 400,
          height: 400,
          left: "80%",
          top: "20%",
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)`,
          filter: "blur(40px)",
          animationDuration: "10s",
          animationDelay: "1s",
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none animate-pulse"
        style={{
          width: 350,
          height: 350,
          left: "20%",
          top: "70%",
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)`,
          filter: "blur(40px)",
          animationDuration: "12s",
          animationDelay: "2s",
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none animate-pulse"
        style={{
          width: 300,
          height: 300,
          left: "70%",
          top: "80%",
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 50%, transparent 70%)`,
          filter: "blur(40px)",
          animationDuration: "14s",
          animationDelay: "3s",
        }}
      />

      {/* Static particles using CSS - subtle and non-distracting */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${10 + (i * 7) % 80}%`,
              top: `${15 + (i * 11) % 70}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              background: `rgba(255, 255, 255, ${0.3 + (i % 3) * 0.1})`,
              boxShadow: `0 0 ${6 + i % 4}px ${2 + i % 2}px rgba(255, 255, 255, 0.2)`,
              animationDuration: `${6 + i * 2}s`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TutorBackground;
