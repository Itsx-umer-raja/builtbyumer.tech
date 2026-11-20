/**
 * Static composed frame — the same three brand colours as flat
 * blocks, shown while the WebGL canvas is still loading and as
 * the permanent hero visual when the user prefers reduced motion.
 * Same aspect and position as the canvas, so swapping it in or
 * out never shifts the layout (CLS).
 */
export function StaticBlocks() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <div className="relative h-[62%] w-[78%]">
        {/* ink cube */}
        <div className="absolute left-[4%] top-[6%] h-[42%] w-[34%] -rotate-6 rounded-[10%] bg-[#161613] shadow-[0_24px_50px_rgba(22,22,19,0.25)]" />
        {/* vermillion cube */}
        <div className="absolute right-[2%] top-[30%] h-[46%] w-[38%] rotate-3 rounded-[10%] bg-[#ff4d00] shadow-[0_24px_50px_rgba(255,77,0,0.35)]" />
        {/* paper cube, black edge so it reads on paper */}
        <div className="absolute bottom-[0%] left-[30%] h-[38%] w-[30%] -rotate-3 rounded-[10%] border-2 border-[#161613] bg-white shadow-[0_24px_50px_rgba(22,22,19,0.18)]" />
        {/* small vermillion sphere accent */}
        <div className="absolute left-[46%] top-[2%] h-[13%] w-[11%] rounded-full bg-[#ff4d00]" />
      </div>
    </div>
  );
}
