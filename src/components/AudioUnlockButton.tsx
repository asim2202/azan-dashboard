"use client";

interface AudioUnlockButtonProps {
  onUnlock: () => void;
}

export default function AudioUnlockButton({ onUnlock }: AudioUnlockButtonProps) {
  const handleClick = () => {
    // Create and play a silent audio context to unlock audio
    try {
      const ctx = new AudioContext();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();

      // Also try with HTML5 Audio
      const audio = new Audio();
      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      audio.play().catch(() => {});
    } catch {
      // Audio unlock failed silently
    }

    onUnlock();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={handleClick}
    >
      <div className="text-center px-8 py-12 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-4">
        <div className="text-6xl mb-6">&#x1F54C;</div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Azan Clock
        </h2>
        <p className="text-white/60 mb-6">
          Tap anywhere to enable Azan audio playback
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500/20 text-amber-300 text-sm">
          <span>&#x1F50A;</span>
          <span>Tap to Start</span>
        </div>
      </div>
    </div>
  );
}
