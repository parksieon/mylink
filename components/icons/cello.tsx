import { SVGProps } from "react";

export function Cello({
  size = 24,
  strokeWidth = 1.6,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Scroll (peg head) */}
      <path d="M11 2.5a1.5 1.5 0 1 1 2 0v1h-2z" />
      {/* Neck */}
      <path d="M12 3.5v6.5" />
      {/* Bridge / nut line */}
      <path d="M10.5 10h3" />
      {/* Body — figure-8: upper bout, waist, lower bout */}
      <path d="M12 10c-2.6 0-4 1.4-4 2.8 0 .9.4 1.4.9 1.9-1.2.6-1.9 2-1.9 3.5 0 2.1 1.7 3.8 5 3.8s5-1.7 5-3.8c0-1.5-.7-2.9-1.9-3.5.5-.5.9-1 .9-1.9 0-1.4-1.4-2.8-4-2.8z" />
      {/* F-holes */}
      <path d="M10 15.5v2" />
      <path d="M14 15.5v2" />
      {/* Endpin */}
      <path d="M12 22v.5" />
    </svg>
  );
}
