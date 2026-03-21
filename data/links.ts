import { Instagram, Youtube, BookOpen, Github, Briefcase, LucideIcon } from 'lucide-react';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
}

export const dummyLinks: LinkItem[] = [
  {
    id: '1',
    title: 'Instagram',
    url: 'https://instagram.com',
    icon: Instagram,
  },
  {
    id: '2',
    title: 'YouTube',
    url: 'https://youtube.com',
    icon: Youtube,
  },
  {
    id: '3',
    title: 'Blog',
    url: 'https://blog.example.com',
    icon: BookOpen,
  },
  {
    id: '4',
    title: 'GitHub',
    url: 'https://github.com',
    icon: Github,
  },
  {
    id: '5',
    title: 'Portfolio',
    url: 'https://portfolio.example.com',
    icon: Briefcase,
  },
];
