import type { CardColor } from "@/lib/nodes";

export interface CardColorStyle {
  bg: string;
  ring: string;
  iconBg: string;
  iconText: string;
  swatch: string;
  hover: string;
}

export const cardColors: Record<CardColor, CardColorStyle> = {
  default: {
    bg: "bg-card",
    ring: "ring-border/60",
    iconBg: "bg-foreground/[0.04]",
    iconText: "text-foreground/60",
    swatch: "bg-foreground/10",
    hover: "hover:ring-border",
  },
  blue: {
    bg: "bg-blue-50/70 dark:bg-blue-950/30",
    ring: "ring-blue-200/60 dark:ring-blue-900/60",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconText: "text-blue-600 dark:text-blue-300",
    swatch: "bg-blue-500",
    hover: "hover:ring-blue-300 dark:hover:ring-blue-800",
  },
  purple: {
    bg: "bg-purple-50/70 dark:bg-purple-950/30",
    ring: "ring-purple-200/60 dark:ring-purple-900/60",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconText: "text-purple-600 dark:text-purple-300",
    swatch: "bg-purple-500",
    hover: "hover:ring-purple-300 dark:hover:ring-purple-800",
  },
  pink: {
    bg: "bg-pink-50/70 dark:bg-pink-950/30",
    ring: "ring-pink-200/60 dark:ring-pink-900/60",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    iconText: "text-pink-600 dark:text-pink-300",
    swatch: "bg-pink-500",
    hover: "hover:ring-pink-300 dark:hover:ring-pink-800",
  },
  amber: {
    bg: "bg-amber-50/70 dark:bg-amber-950/30",
    ring: "ring-amber-200/60 dark:ring-amber-900/60",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconText: "text-amber-600 dark:text-amber-300",
    swatch: "bg-amber-500",
    hover: "hover:ring-amber-300 dark:hover:ring-amber-800",
  },
  emerald: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    ring: "ring-emerald-200/60 dark:ring-emerald-900/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconText: "text-emerald-600 dark:text-emerald-300",
    swatch: "bg-emerald-500",
    hover: "hover:ring-emerald-300 dark:hover:ring-emerald-800",
  },
  rose: {
    bg: "bg-rose-50/70 dark:bg-rose-950/30",
    ring: "ring-rose-200/60 dark:ring-rose-900/60",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconText: "text-rose-600 dark:text-rose-300",
    swatch: "bg-rose-500",
    hover: "hover:ring-rose-300 dark:hover:ring-rose-800",
  },
  sky: {
    bg: "bg-sky-50/70 dark:bg-sky-950/30",
    ring: "ring-sky-200/60 dark:ring-sky-900/60",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconText: "text-sky-600 dark:text-sky-300",
    swatch: "bg-sky-500",
    hover: "hover:ring-sky-300 dark:hover:ring-sky-800",
  },
};

export const cardColorList: CardColor[] = [
  "default",
  "blue",
  "purple",
  "pink",
  "amber",
  "emerald",
  "rose",
  "sky",
];

export function getCardColor(color: CardColor | undefined): CardColorStyle {
  return cardColors[color ?? "default"];
}
