import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle container */}
      <circle cx="100" cy="100" r="96" fill="#1E2255" stroke="#FFE600" strokeWidth="4" />

      {/* Outer Decorative Ring with Beads */}
      <circle cx="100" cy="100" r="90" stroke="#FFE600" strokeWidth="2" strokeDasharray="1 0" />
      <circle cx="100" cy="100" r="84" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Beads around the ring */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 100 + 87 * Math.cos(rad);
        const y = 100 + 87 * Math.sin(rad);
        const r = i % 2 === 0 ? 4 : 2.5;
        return <circle key={deg} cx={x} cy={y} r={r} fill="#FFE600" stroke="#1E2255" strokeWidth="1" />;
      })}

      {/* Inner Geometric Quadrant Divider */}
      <circle cx="100" cy="100" r="74" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
      
      {/* Top Left Woven Textured Sector */}
      <path
        d="M 100 26 A 74 74 0 0 0 26 100 L 100 100 Z"
        fill="#FFE600"
        fillOpacity="0.15"
        stroke="#FFE600"
        strokeWidth="1.5"
      />
      {/* Woven Crosslines inside top left */}
      <path
        d="M 40 70 L 80 30 M 35 85 L 85 35 M 45 95 L 95 45 M 50 50 L 70 70"
        stroke="#FFE600"
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* Bottom Right Woven Textured Sector */}
      <path
        d="M 100 174 A 74 74 0 0 0 174 100 L 100 100 Z"
        fill="#FFE600"
        fillOpacity="0.15"
        stroke="#FFE600"
        strokeWidth="1.5"
      />
      <path
        d="M 120 160 L 160 120 M 110 145 L 145 110 M 130 170 L 170 130"
        stroke="#FFE600"
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* Center Rectangle Frame for Text / Buttons */}
      <rect
        x="36"
        y="72"
        width="128"
        height="56"
        rx="6"
        fill="#1E2255"
        stroke="#FFE600"
        strokeWidth="2.5"
      />

      {/* PlayStation Controller Geometric Icons (△, ⭕, ⏹, ❌) */}
      <g stroke="#FFE600" strokeWidth="2" fill="none">
        {/* Triangle △ */}
        <polygon points="50,83 44,92 56,92" />
        {/* Circle ⭕ */}
        <circle cx="68" cy="87.5" r="4.5" />
        {/* Square ⏹ */}
        <rect x="44" y="99" width="9" height="9" />
        {/* Cross ❌ */}
        <path d="M 64 99 L 72 107 M 72 99 L 64 107" />
      </g>

      {/* Title Text in Logo */}
      <text
        x="80"
        y="96"
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        ImportHour
      </text>
      <text
        x="80"
        y="108"
        fill="#FFE600"
        fontSize="6.5"
        fontWeight="800"
        fontFamily="sans-serif"
        letterSpacing="0.8"
      >
        IMPORTAÇÕES INTELIGENTES
      </text>
    </svg>
  );
};
