import { cn } from "@/lib/cn";

// Verdara nine-petal Petal Seal — the system's signature ornament. Recolors
// via currentColor. Three sizes: bullet (16), signature (28), watermark (320).
// Geometry extracted from Verdara html/preview.html (viewBox 0 0 396.07 390.9).
const PATHS = [
  "M197.03,153.86l-19.13-128.39c-1.99-13.34,7.25-25.47,19.4-25.47h0c12.18,0,21.43,12.2,19.39,25.57l-19.65,128.29Z",
  "M167.12,165.59l-97.18-86.05c-10.1-8.94-10.82-24.18-1.51-31.98h0c9.33-7.83,24.26-4.43,31.29,7.13l67.41,110.91Z",
  "M151.75,193.8l-129.76-3.45c-13.48-.36-23.83-11.57-21.72-23.53h0c2.12-12,15.74-18.99,28.55-14.65l122.93,41.63Z",
  "M158.1,225.29l-101.62,80.76c-10.56,8.39-25.69,6.45-31.76-4.07h0c-6.09-10.55-.15-24.66,12.45-29.57l120.93-47.13Z",
  "M183.22,245.33l-25.93,127.19c-2.69,13.21-15.53,21.46-26.94,17.3h0c-11.45-4.17-15.97-18.8-9.47-30.66l62.34-113.83Z",
  "M215.33,244.54l61.89,114.1c6.43,11.85,1.9,26.42-9.52,30.57h0c-11.45,4.17-24.31-4.14-26.96-17.4l-25.41-127.27Z",
  "M239.43,223.29l120.75,47.62c12.54,4.95,18.43,19.02,12.36,29.54h0c-6.09,10.55-21.28,12.46-31.84,4l-101.28-81.16Z",
  "M244.23,191.52l123.11-41.14c12.79-4.27,26.35,2.72,28.45,14.68h0c2.12,12-8.3,23.23-21.81,23.53l-129.75,2.92Z",
  "M227.48,164.1l67.87-110.65c7.05-11.5,21.93-14.85,31.24-7.04h0c9.33,7.83,8.58,23.12-1.59,32.05l-97.52,85.64Z",
];

const SIZES = {
  bullet: "h-4 w-4",
  signature: "h-7 w-7",
  medium: "h-16 w-16",
  watermark: "pointer-events-none absolute -bottom-10 -right-10 h-80 w-80 opacity-10",
} as const;

export function PetalSeal({
  size = "signature",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 leading-none text-current", SIZES[size], className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 396.07 390.9"
        fill="currentColor"
        className="block h-full w-full"
      >
        {PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}
