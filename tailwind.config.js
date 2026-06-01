/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "background": "#10141a",
        "surface": "#161B22",
        "surface-container-lowest": "#0a0e14",
        "surface-container-low": "#181c22",
        "surface-container": "#1c2026",
        "surface-container-high": "#262a31",
        "surface-container-highest": "#31353c",
        "border": "#30363D",
        "text-primary": "#E6EDF3",
        "text-secondary": "#8B949E",
        "primary": "#ffb68a",
        "primary-container": "#f77800",
        "on-primary": "#522300",
        "on-primary-container": "#572600",
        "secondary-container": "#0071c7",
        "tertiary": "#7bdb80",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "pastel-blue": "#BAE1FF",
        "pastel-purple": "#E0BAFF",
        "pastel-green": "#BFFCC6",
        "pastel-yellow": "#FFFFBA",
        "pastel-pink": "#FFB3BA"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "margin-desktop": "32px",
        "card-padding": "24px",
        "margin-mobile": "16px",
        "gutter": "24px"
      },
      maxWidth: {
        "container-max": "1280px"
      },
      fontFamily: {
        "display-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-md": ["Inter", "system-ui", "sans-serif"],
        "label-caps": ["Inter", "system-ui", "sans-serif"],
        "body-base": ["Inter", "system-ui", "sans-serif"],
        "mono-data": ["JetBrains Mono", "ui-monospace", "monospace"],
        "body-sm": ["Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-caps": ["11px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "700" }],
        "body-base": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "mono-data": ["13px", { lineHeight: "1", letterSpacing: "0.02em", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }]
      }
    }
  },
  safelist: [
    {
      pattern: /(bg|border|text)-(pastel-blue|pastel-purple|pastel-green|pastel-yellow|pastel-pink)(\/(10|20|30|50))?/,
      variants: ["hover", "focus", "group-hover"]
    }
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};
