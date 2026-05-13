import {
  Github,
  Mail,
  Rocket,
  BookOpen,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Github,
  Mail,
  Rocket,
  BookOpen,
  Link: LinkIcon,
  Instagram,
  Youtube,
  Twitter,
  Globe,
};

export function getIcon(name: string | undefined): LucideIcon {
  if (!name) return LinkIcon;
  return iconMap[name] ?? LinkIcon;
}
