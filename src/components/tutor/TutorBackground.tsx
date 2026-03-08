const TutorBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, 
            hsl(250, 15%, 97%) 0%, 
            hsl(280, 12%, 96%) 25%,
            hsl(240, 10%, 97%) 50%,
            hsl(20, 20%, 97%) 75%,
            hsl(250, 15%, 97%) 100%
          )`,
        }}
      />
      
      {/* Large purple orb top-left */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          left: "-20%",
          top: "-15%",
          background: `radial-gradient(circle, hsla(245, 58%, 64%, 0.08) 0%, transparent 65%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Magenta orb center-right */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          right: "-10%",
          top: "30%",
          background: `radial-gradient(circle, hsla(320, 70%, 65%, 0.06) 0%, transparent 65%)`,
          filter: "blur(70px)",
        }}
      />

      {/* Peach orb bottom-left */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          left: "10%",
          bottom: "-10%",
          background: `radial-gradient(circle, hsla(25, 85%, 79%, 0.07) 0%, transparent 65%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Subtle dot pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(245, 58%, 64%) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
};

export default TutorBackground;
