import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

interface Props extends React.SVGAttributes<SVGSVGElement> {
  category: ProductCategory;
  brand?: string; // hex color
  tone?: "light" | "dark";
}

/**
 * Lightweight, stylized SVG that suggests the product silhouette without
 * shipping vendor imagery. Categories drive the silhouette; brand color is
 * used as accent.
 */
export function ProductGlyph({ category, brand = "#049fd9", tone = "light", className, ...rest }: Props) {
  const bg = tone === "dark" ? "#0e1118" : "#ffffff";
  const fg = tone === "dark" ? "#1a1e26" : "#eef2f8";
  const stroke = tone === "dark" ? "#2b313d" : "#dde1e9";
  const accent = brand;

  return (
    <svg
      viewBox="0 0 320 180"
      className={cn("h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={category}
      {...rest}
    >
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone === "dark" ? "#0e1118" : "#ffffff"} />
          <stop offset="100%" stopColor={tone === "dark" ? "#0a0c11" : "#f5f7fb"} />
        </linearGradient>
        <linearGradient id="device-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone === "dark" ? "#1a1e26" : "#ffffff"} />
          <stop offset="100%" stopColor={tone === "dark" ? "#0e1118" : "#eef2f8"} />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#bg-grad)" />
      <circle cx="160" cy="90" r="80" fill="url(#glow)" />

      {category === "Industrial Switch" && (
        <g>
          {/* DIN-rail switch silhouette */}
          <rect x="50" y="60" width="220" height="60" rx="10" fill="url(#device-grad)" stroke={stroke} />
          <rect x="58" y="68" width="6" height="44" rx="2" fill={fg} />
          {/* Ports */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={80 + i * 22} y={86} width={14} height={18} rx={2} fill={fg} stroke={stroke} />
          ))}
          {/* Status LEDs */}
          <circle cx={70} cy={74} r={2.5} fill={accent} />
          <circle cx={78} cy={74} r={2.5} fill="#22c55e" />
          {/* DIN hooks */}
          <rect x="40" y="74" width="10" height="32" rx="2" fill={fg} />
          <rect x="270" y="74" width="10" height="32" rx="2" fill={fg} />
        </g>
      )}

      {category === "Industrial Router" && (
        <g>
          <rect x="60" y="55" width="200" height="70" rx="12" fill="url(#device-grad)" stroke={stroke} />
          {/* Antenna */}
          <line x1="100" y1="55" x2="100" y2="30" stroke={fg} strokeWidth="3" strokeLinecap="round" />
          <line x1="220" y1="55" x2="220" y2="30" stroke={fg} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="28" r="4" fill={accent} />
          <circle cx="220" cy="28" r="4" fill={accent} />
          {/* Ports */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={90 + i * 30} y={85} width={20} height={20} rx={2} fill={fg} stroke={stroke} />
          ))}
          <rect x="240" y="85" width="14" height="20" rx="2" fill={accent} opacity="0.85" />
          {/* Status */}
          <circle cx={75} cy={70} r={3} fill="#22c55e" />
          <circle cx={75} cy={80} r={3} fill={accent} />
        </g>
      )}

      {category === "Industrial Wireless" && (
        <g>
          {/* AP dome */}
          <ellipse cx="160" cy="120" rx="90" ry="22" fill="url(#device-grad)" stroke={stroke} />
          <path d="M 70 120 A 90 90 0 0 1 250 120" fill="url(#device-grad)" stroke={stroke} />
          {/* Signal arcs */}
          <path d="M 110 70 Q 160 30 210 70" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.85" />
          <path d="M 130 75 Q 160 45 190 75" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.6" />
          <circle cx="160" cy="85" r="3" fill={accent} />
        </g>
      )}

      {(category === "OT Security / Visibility" || category === "Ruggedized Firewall") && (
        <g>
          {/* Shield */}
          <path
            d="M 160 30 L 220 50 L 220 100 Q 220 145 160 160 Q 100 145 100 100 L 100 50 Z"
            fill="url(#device-grad)"
            stroke={stroke}
          />
          <path
            d="M 160 60 L 160 130"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 130 95 L 190 95"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}

      {category === "Management / Orchestration" && (
        <g>
          {/* Stacked cards */}
          <rect x="70" y="50" width="180" height="30" rx="6" fill="url(#device-grad)" stroke={stroke} />
          <rect x="70" y="85" width="180" height="30" rx="6" fill="url(#device-grad)" stroke={stroke} />
          <rect x="70" y="120" width="180" height="30" rx="6" fill="url(#device-grad)" stroke={stroke} />
          <circle cx="90" cy="65" r="4" fill={accent} />
          <circle cx="90" cy="100" r="4" fill="#22c55e" />
          <circle cx="90" cy="135" r="4" fill={fg} />
        </g>
      )}

      {category === "Embedded Network Module" && (
        <g>
          {/* Bare circuit board — a "chip without the body" */}
          <rect x="64" y="48" width="192" height="84" rx="8" fill="url(#device-grad)" stroke={stroke} />
          {/* Mounting holes at the corners */}
          <circle cx="76" cy="60" r="3.5" fill="none" stroke={stroke} />
          <circle cx="244" cy="60" r="3.5" fill="none" stroke={stroke} />
          <circle cx="76" cy="120" r="3.5" fill="none" stroke={stroke} />
          <circle cx="244" cy="120" r="3.5" fill="none" stroke={stroke} />
          {/* Central processor die with pin-1 marker */}
          <rect x="132" y="70" width="56" height="40" rx="4" fill={fg} stroke={stroke} />
          <circle cx="139" cy="77" r="2.5" fill={accent} />
          {/* Chip pins (left/right) */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={`l${i}`} x="123" y={74 + i * 9} width="9" height="4" rx="1" fill={fg} stroke={stroke} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect key={`r${i}`} x="188" y={74 + i * 9} width="9" height="4" rx="1" fill={fg} stroke={stroke} />
          ))}
          {/* Traces feeding the gold edge connector */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={`t${i}`} x1={108 + i * 21} y1="118" x2={108 + i * 21} y2="132" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          ))}
          {/* Gold edge connector fingers along the bottom */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={`c${i}`} x={102 + i * 21} y="132" width="13" height="8" rx="1" fill="#f5b301" opacity="0.85" />
          ))}
          {/* A passive component or two */}
          <rect x="80" y="78" width="16" height="9" rx="2" fill={fg} stroke={stroke} />
          <rect x="80" y="94" width="16" height="9" rx="2" fill={fg} stroke={stroke} />
          <circle cx="232" cy="86" r="6" fill="none" stroke={stroke} />
          <circle cx="232" cy="86" r="2" fill={accent} />
        </g>
      )}

      {/* corner code label */}
      <text x="14" y="170" fontFamily="ui-monospace, Menlo" fontSize="10" fill={tone === "dark" ? "#5b6478" : "#8a93a6"}>
        {category}
      </text>
    </svg>
  );
}
