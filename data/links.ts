import { Github, Mail, Rocket, BookOpen, LucideIcon } from "lucide-react";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
}

export const dummyLinks: LinkItem[] = [
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/parksieon/mylink",
    icon: Github,
  },
  {
    id: "email",
    title: "Email",
    url: "mailto:parksieon03@gmail.com",
    icon: Mail,
  },
  {
    id: "capstone",
    title: "캡스톤 프로젝트 (진행중)",
    url: "https://vatican-mind-applicant-ingredients.trycloudflare.com/",
    icon: Rocket,
  },
  {
    id: "learning-notes",
    title: "학습 정리",
    url: "/learning-notes",
    icon: BookOpen,
  },
];
