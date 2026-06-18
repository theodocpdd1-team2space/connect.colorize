"use client";

export type MicMode = "ptt" | "toggle";

interface MicControlProps {
  mode: MicMode;
  isMicOn: boolean;
  isSpeaking: boolean;
  onModeChange: (mode: MicMode) => void;
  onMicOn: () => void;
  onMicOff: () => void;
  disabled?: boolean;
}

export default function MicControl({ mode, isMicOn, isSpeaking, onModeChange, onMicOn, onMicOff, disabled }: MicControlProps) {
  const buttonText = mode === "ptt" ? "Hold to Talk" : isMicOn ? "Tap to Mute" : "Tap to Talk";
  const stateText = mode === "toggle" ? (isMicOn ? "Mic On" : "Mic Off") : isSpeaking ? "Speaking" : "Muted";

  function handleToggleClick() {
    if (disabled) return;
    if (isMicOn) onMicOff();
    else onMicOn();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1">
        {(["ptt", "toggle"] as MicMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onModeChange(item)}
            className={`rounded-xl px-3 py-3 text-sm font-black transition ${
              mode === item ? "bg-cyan-300 text-slate-950" : "text-slate-200"
            }`}
          >
            {item === "ptt" ? "Push to Talk" : "Toggle Mic"}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={mode === "toggle" ? handleToggleClick : undefined}
        onPointerDown={(event) => {
          if (mode !== "ptt" || disabled) return;
          event.preventDefault();
          onMicOn();
        }}
        onPointerUp={() => {
          if (mode === "ptt") onMicOff();
        }}
        onPointerCancel={() => {
          if (mode === "ptt") onMicOff();
        }}
        onPointerLeave={(event) => {
          if (mode === "ptt" && event.buttons) onMicOff();
        }}
        className={`mx-auto flex aspect-square w-full max-w-[17rem] select-none flex-col items-center justify-center rounded-full border text-center shadow-glow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
          isMicOn
            ? "border-emerald-200 bg-emerald-300 text-emerald-950"
            : "border-cyan-200/40 bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950"
        }`}
      >
        <span className="text-3xl font-black sm:text-4xl">MIC</span>
        <span className="mt-2 text-sm font-extrabold uppercase">{buttonText}</span>
      </button>

      <p className="text-center text-sm font-black text-slate-100">{stateText}</p>
      {mode === "toggle" && isMicOn ? (
        <div className="rounded-2xl border border-amber-200/25 bg-amber-200/10 p-3 text-sm text-amber-50">
          Toggle Mic keeps your microphone open while active. Use headset to avoid echo.
        </div>
      ) : null}
    </div>
  );
}
