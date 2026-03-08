// Clean, light-themed tutor background inspired by reference design
// Uses the brand colors: #6A68DF, #EFB995, #FEFEFE

const TutorBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Clean light background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, 
            hsl(240, 10%, 96%) 0%, 
            hsl(240, 8%, 98%) 50%, 
            hsl(240, 10%, 96%) 100%
          )`,
        }}
      />
      
      {/* Subtle gradient orbs for depth */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: "-15%",
          top: "-10%",
          background: `radial-gradient(circle, hsla(245, 58%, 64%, 0.06) 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          right: "-10%",
          bottom: "-5%",
          background: `radial-gradient(circle, hsla(25, 85%, 79%, 0.06) 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
    </div>
  );
};

export default TutorBackground;
