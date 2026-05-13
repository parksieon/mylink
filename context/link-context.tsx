"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { LucideIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { seedLinks } from "@/data/links";
import { getIcon } from "@/lib/icon-map";
import { useAuth } from "@/context/auth-context";

export interface UserLink {
  id: string;
  title: string;
  url: string;
  iconName: string;
  icon: LucideIcon;
}

interface LinkContextType {
  links: UserLink[];
  loading: boolean;
  addLink: (title: string, url: string) => Promise<void>;
  updateLink: (id: string, title: string, url: string) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
}

const LinkContext = createContext<LinkContextType | null>(null);

function userLinksRef(uid: string) {
  return collection(db, "users", uid, "links");
}

function userLinkDoc(uid: string, id: string) {
  return doc(db, "users", uid, "links", id);
}

export function LinkProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const uid = user.uid;
    const linksRef = userLinksRef(uid);
    const linksQuery = query(linksRef, orderBy("createdAt", "asc"));

    // First-run seed: 사용자 컬렉션이 비어있으면 기본 링크 자동 삽입
    (async () => {
      try {
        const snap = await getDocs(linksRef);
        if (snap.empty) {
          for (let i = 0; i < seedLinks.length; i++) {
            const seed = seedLinks[i];
            await setDoc(userLinkDoc(uid, seed.id), {
              title: seed.title,
              url: seed.url,
              iconName: seed.iconName,
              createdAt: Date.now() + i,
            });
          }
        }
      } catch (err) {
        console.error("Firestore seed failed:", err);
      }
    })();

    setLoading(true);
    const unsubscribe = onSnapshot(
      linksQuery,
      (snapshot) => {
        const items: UserLink[] = snapshot.docs.map((d) => {
          const data = d.data();
          const iconName = (data.iconName as string) || "Link";
          return {
            id: d.id,
            title: data.title as string,
            url: data.url as string,
            iconName,
            icon: getIcon(iconName),
          };
        });
        setLinks(items);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore subscribe failed:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const addLink = async (title: string, url: string) => {
    if (!user) return;
    await addDoc(userLinksRef(user.uid), {
      title,
      url,
      iconName: "Link",
      createdAt: Date.now(),
    });
  };

  const updateLink = async (id: string, title: string, url: string) => {
    if (!user) return;
    await updateDoc(userLinkDoc(user.uid, id), { title, url });
  };

  const deleteLink = async (id: string) => {
    if (!user) return;
    await deleteDoc(userLinkDoc(user.uid, id));
  };

  return (
    <LinkContext.Provider
      value={{ links, loading, addLink, updateLink, deleteLink }}
    >
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
