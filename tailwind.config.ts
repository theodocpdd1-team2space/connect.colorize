import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        easycyan: "#36d9ff",
        easyblue: "#2f7dff",
        easynavy: "#07111f"
      },
      boxShadow: {
        glow: "0 0 40px rgba(54, 217, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
