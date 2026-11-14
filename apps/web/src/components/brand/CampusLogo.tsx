import Link from "next/link";
import { cn } from "@/lib/utils";

interface CampusLogoProps {
  href?: string;
  variant?: "default" | "light";
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CampusLogo({
  href = "/",
  variant = "default",
  showTagline = false,
  size = "md",
  className,
}: CampusLogoProps) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 48 : 38;
  const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="campusShieldGrad" x1="8" y1="16" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#101B62" />
            <stop offset="100%" stopColor="#4328BD" />
          </linearGradient>
          <linearGradient id="campusCapGrad" x1="12" y1="4" x2="52" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#101B62" />
            <stop offset="100%" stopColor="#6038ED" />
          </linearGradient>
        </defs>
        {/* Shield / Hexagon with C */}
        <path
          d="M32 17L52 24.5V41.5C52 48.2 43.2 55 32 59C20.8 55 12 48.2 12 41.5V24.5L32 17Z"
          fill={variant === "light" ? "#1E2D87" : "url(#campusShieldGrad)"}
          stroke={variant === "light" ? "rgba(255,255,255,0.22)" : "none"}
          strokeWidth="1.5"
        />
        {/* Letter C cutout */}
        <path
          d="M39.5 32.5C38.4 30.1 35.8 28.6 32.6 28.6C27.9 28.6 24.4 32.1 24.4 36.8C24.4 41.5 27.9 45 32.6 45C36 45 38.7 43.4 39.8 40.8L44.6 42.6C42.7 47.2 38.2 50 32.5 50C24.8 50 19.2 44.5 19.2 36.8C19.2 29.1 24.8 23.6 32.5 23.6C38.1 23.6 42.5 26.3 44.4 30.6L39.5 32.5Z"
          fill="#FFFFFF"
        />
        {/* Graduation Cap */}
        <path d="M32 5L55 14L32 23L9 14L32 5Z" fill="url(#campusCapGrad)" />
        <path d="M13 15.5V26" stroke="#19B99A" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="13" cy="27.5" r="2.2" fill="#19B99A" />
      </svg>

      <span className="flex flex-col leading-none">
        <span className={cn("font-extrabold tracking-tight", textSize)}>
          <span className={variant === "light" ? "text-white" : "text-navy dark:text-white"}>
            Campus
          </span>
          <span className={variant === "light" ? "text-teal" : "text-purple"}>.com</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium tracking-wide",
              variant === "light" ? "text-white/70" : "text-muted-foreground"
            )}
          >
            Connect • Collaborate • Grow
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center focus:outline-none">
      {content}
    </Link>
  );
}
