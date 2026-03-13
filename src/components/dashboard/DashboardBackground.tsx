const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Subtle pastel gradient blobs on light background */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{
          top: "-10%",
          left: "-10%",
          background: "radial-gradient(circle, #EC4899, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{
          top: "40%",
          right: "-10%",
          background: "radial-gradient(circle, #6A68DF, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{
          bottom: "-5%",
          left: "20%",
          background: "radial-gradient(circle, #EFB995, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
};

export default DashboardBackground;
