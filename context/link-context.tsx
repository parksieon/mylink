"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { dummyLinks, LinkItem } from "@/data/links";
import { Link as LinkIcon, LucideIcon } from "lucide-react";

export interface UserLink {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
}

interface LinkContextType {
  links: UserLink[];
  addLink: (title: string, url: string) => void;
  updateLink: (id: string, title: string, url: string) => void;
  deleteLink: (id: string) => void;
}

const LinkContext = createContext<LinkContextType | null>(null);

export function LinkProvider({ children }: { children: ReactNode }) {
  const [links, setLinks] = useState<UserLink[]>(
    dummyLinks.map((link: LinkItem) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon,
    }))
  );

  const addLink = (title: string, url: string) => {
    const newLink: UserLink = {
      id: crypto.randomUUID(),
      title,
      url,
      icon: LinkIcon,
    };
    setLinks((prev) => [...prev, newLink]);
  };

  const updateLink = (id: string, title: string, url: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, title, url } : link
      )
    );
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  return (
    <LinkContext.Provider value={{ links, addLink, updateLink, deleteLink }}>
      {children}
    </LinkContext.Provider>
  );
}

export function useLinkContext() {
  const context = useContext(LinkContext);
  if (!context) {
    throw new Error("useLinkContext must be used within LinkProvider");
  }
  return context;
}
