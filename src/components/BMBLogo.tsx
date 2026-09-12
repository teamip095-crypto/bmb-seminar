import React from "react";

interface BMBLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCardBackground?: boolean;
}

export const BMBLogo: React.FC<BMBLogoProps> = ({
  className = "h-10 sm:h-12 w-auto",
  size,
  showCardBackground = false
}) => {
  const sizeClasses = {
    sm: "h-7 sm:h-8 w-auto",
    md: "h-9 sm:h-11 w-auto",
    lg: "h-11 sm:h-14 w-auto",
    xl: "h-14 sm:h-18 w-auto"
  };

  const finalClass = size ? sizeClasses[size] : className;

  const svgContent = (
    <svg
      viewBox="0 0 350 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${finalClass} select-none transition-transform`}
      aria-label="BMB Educom Official Logo"
    >
      <defs>
        {/* Red Gradient for B letters */}
        <linearGradient id="bmb-comp-red" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ff1725" />
          <stop offset="35%" stopColor="#e00010" />
          <stop offset="70%" stopColor="#a8000c" />
          <stop offset="100%" stopColor="#7a0006" />
        </linearGradient>

        {/* Blue/Cyan Gradient for M letter */}
        <linearGradient id="bmb-comp-blue" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="30%" stopColor="#0088ff" />
          <stop offset="65%" stopColor="#003cd6" />
          <stop offset="100%" stopColor="#120078" />
        </linearGradient>

        {/* Yellow/Gold Gradient for upper swoosh */}
        <linearGradient id="bmb-comp-swoosh-gold" x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#ffee00" />
          <stop offset="50%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#ff7700" />
        </linearGradient>

        {/* Purple/Indigo Gradient for lower swoosh */}
        <linearGradient id="bmb-comp-swoosh-purple" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00b4d8" />
          <stop offset="40%" stopColor="#0044cc" />
          <stop offset="100%" stopColor="#2c0082" />
        </linearGradient>

        {/* Crisp drop shadow */}
        <filter id="bmb-comp-shadow" x="-6%" y="-6%" width="112%" height="112%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* TOP DYNAMIC SWOOSH (GOLD & PURPLE) */}
      <g filter="url(#bmb-comp-shadow)">
        {/* Underneath Purple/Blue Swoosh */}
        <path
          d="M 104 46 C 118 20, 162 12, 198 46 C 187 36, 148 24, 114 49 Z"
          fill="url(#bmb-comp-swoosh-purple)"
        />
        {/* Primary Golden Arc */}
        <path
          d="M 90 48 C 110 9, 175 -2, 212 50 C 207 46, 201 39, 194 33 C 162 1, 118 12, 97 48 Z"
          fill="url(#bmb-comp-swoosh-gold)"
        />
      </g>

      {/* MAIN 'BMB' CHARACTERS */}
      <g filter="url(#bmb-comp-shadow)">
        {/* FIRST 'B' */}
        {/* Outer Radiant Yellow Border */}
        <path
          d="M 22 36 H 74 C 89 36, 98 44, 98 56 C 98 63, 93 69, 85 71 C 94 74, 100 81, 100 92 C 100 104, 88 113, 73 113 H 22 Z"
          fill="#ffee00"
          stroke="#ffee00"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Inner Red Fill */}
        <path
          d="M 26 40 H 73 C 85 40, 93 46, 93 56 C 93 63, 87 68, 80 70 C 89 72, 95 78, 95 89 C 95 99, 85 108, 72 108 H 26 Z"
          fill="url(#bmb-comp-red)"
        />
        {/* Upper Counter (Yellow frame + white center) */}
        <rect x="38" y="48" width="36" height="16" rx="6" fill="#ffee00" />
        <rect x="42" y="52" width="28" height="8" rx="4" fill="#ffffff" />
        {/* Lower Counter (Yellow frame + white center) */}
        <rect x="38" y="77" width="38" height="20" rx="7" fill="#ffee00" />
        <rect x="42" y="81" width="30" height="12" rx="5" fill="#ffffff" />

        {/* MIDDLE 'M' */}
        {/* Outer Radiant Yellow Border */}
        <path
          d="M 108 113 L 126 36 H 150 L 170 83 L 190 36 H 214 L 232 113 H 207 L 198 68 L 180 107 H 160 L 142 68 L 133 113 Z"
          fill="#ffee00"
          stroke="#ffee00"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {/* Inner Blue Fill */}
        <path
          d="M 111 111 L 128 39 H 148 L 170 84 L 192 39 H 212 L 229 111 H 209 L 200 66 L 181 104 H 159 L 140 66 L 131 111 Z"
          fill="url(#bmb-comp-blue)"
        />

        {/* SECOND 'B' */}
        {/* Outer Radiant Yellow Border */}
        <path
          d="M 240 36 H 292 C 307 36, 316 44, 316 56 C 316 63, 311 69, 303 71 C 312 74, 318 81, 318 92 C 318 104, 306 113, 291 113 H 240 Z"
          fill="#ffee00"
          stroke="#ffee00"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Inner Red Fill */}
        <path
          d="M 244 40 H 291 C 303 40, 311 46, 311 56 C 311 63, 305 68, 298 70 C 307 72, 313 78, 313 89 C 313 99, 303 108, 290 108 H 244 Z"
          fill="url(#bmb-comp-red)"
        />
        {/* Upper Counter */}
        <rect x="256" y="48" width="36" height="16" rx="6" fill="#ffee00" />
        <rect x="260" y="52" width="28" height="8" rx="4" fill="#ffffff" />
        {/* Lower Counter */}
        <rect x="256" y="77" width="38" height="20" rx="7" fill="#ffee00" />
        <rect x="260" y="81" width="30" height="12" rx="5" fill="#ffffff" />
      </g>

      {/* "eDUCOM" HIGH-TECH GEOMETRIC BLACK TYPOGRAPHY */}
      <g fill="#0e0e0e" stroke="#0e0e0e" strokeWidth="1" strokeLinejoin="round">
        {/* 'e' - Lowercase modern geometric */}
        <path
          d="M 50 144 C 50 131, 39 123, 26 123 C 13 123, 4 133, 4 148 C 4 163, 14 172, 28 172 C 40 172, 48 165, 50 155 H 39 C 37 160, 33 163, 28 163 C 19 163, 15 156, 15 147 H 50 Z M 15 140 C 16 134, 20 129, 27 129 C 33 129, 38 134, 39 140 H 15 Z"
        />

        {/* 'D' - Chamfered High-Tech Capital */}
        <path
          d="M 64 124 H 92 L 106 138 V 158 L 92 172 H 64 Z M 75 133 V 163 H 89 L 96 153 V 142 L 89 133 Z"
        />

        {/* 'U' - Chamfered High-Tech Capital */}
        <path
          d="M 120 124 H 132 V 157 C 132 165, 137 170, 146 170 C 155 170, 160 165, 160 157 V 124 H 172 V 157 C 172 172, 161 179, 146 179 C 131 179, 120 172, 120 157 Z"
        />

        {/* 'C' - Chamfered High-Tech Capital */}
        <path
          d="M 226 136 H 213 C 210 130, 205 128, 197 128 C 186 128, 179 137, 179 148 C 179 160, 186 168, 197 168 C 205 168, 210 165, 213 160 H 226 C 222 172, 211 179, 197 179 C 180 179, 168 166, 168 148 C 168 130, 180 118, 197 118 C 211 118, 222 125, 226 136 Z"
        />

        {/* 'O' - Symmetrical 8-Sided Polygon (Octagon) */}
        <path
          d="M 252 124 H 274 L 288 138 V 158 L 274 172 H 252 L 238 158 V 138 Z M 255 133 L 247 141 V 155 L 255 163 H 271 L 279 155 V 141 L 271 133 Z"
        />

        {/* 'M' - High-Tech Capital */}
        <path
          d="M 300 124 H 311 L 324 153 L 337 124 H 348 V 172 H 337 V 144 L 326 166 H 322 L 311 144 V 172 H 300 Z"
        />
      </g>
    </svg>
  );

  if (showCardBackground) {
    return (
      <div className="bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-neutral-200 shadow-md flex items-center justify-center">
        {svgContent}
      </div>
    );
  }

  return svgContent;
};
