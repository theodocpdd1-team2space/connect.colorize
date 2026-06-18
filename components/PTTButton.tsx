"use client";

type PTTButtonProps = {
  speaking: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
};

export default function PTTButton({ speaking, disabled, onStart, onStop }: PTTButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        if (!disabled) onStart();
      }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      onPointerLeave={(event) => {
        if (event.buttons) onStop();
      }}
      className={`mx-auto flex aspect-square w-full max-w-[17rem] select-none flex-col items-center justify-center rounded-full border text-center shadow-glow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        speaking
          ? "border-emerald-200 bg-emerald-300 text-emerald-950"
          : "border-cyan-200/40 bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950"
      }`}
    >
      <span className="text-3xl font-black sm:text-4xl">PTT</span>
      <span className="mt-2 text-sm font-extrabold uppercase">{speaking ? "Speaking" : "Hold to Talk"}</span>
    </button>
  );
}
