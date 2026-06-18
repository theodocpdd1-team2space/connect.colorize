"use client";

/* eslint-disable @next/next/no-img-element */
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type QRCodePanelProps = {
  value: string;
  label?: string;
};

export default function QRCodePanel({ value, label = "Scan to join" }: QRCodePanelProps) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#06111f",
        light: "#f4fbff"
      }
    }).then(setSrc);
  }, [value]);

  return (
    <div className="glass rounded-[1.5rem] p-4 text-center">
      <div className="rounded-[1.1rem] bg-white p-3">
        {src ? <img src={src} alt={label} className="mx-auto h-auto w-full max-w-72" /> : null}
      </div>
      <p className="mt-3 text-sm font-bold text-cyan-100">{label}</p>
      <p className="mt-1 break-all text-xs text-slate-300">{value}</p>
    </div>
  );
}
