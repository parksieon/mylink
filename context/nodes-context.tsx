"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
  userNodesRef,
  type Node,
  type Result,
  type Visibility,
  type CardColor,
  createFolder,
  createArticle,
  createLink,
  createAssetLeaf,
  uploadFolderBg,
  removeFolderBg,
  renameNode,
  reorderNode,
  moveNode,
  deleteNode,
  setNodeVisibility,
  updateNodeStyle,
  saveArticleContent,
  updateLinkUrl,
} from "@/lib/nodes";
import { DEFAULT_QUOTA_BYTES, isOwnerUid } from "@/lib/quota";

interface NodesContextType {
  nodes: Node[];
  loading: boolean;
  activeNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;
  usedBytes: number;
  quotaBytes: number;
  isOwner: boolean;

  createFolder: (parentId: string | null, name: string) => Promise<Result<{ id: string }>>;
  createArticle: (parentId: string | null, name: string) => Promise<Result<{ id: string }>>;
  createLink: (parentId: string | null, name: string, url: string) => Promise<Result<{ id: string }>>;
  createAsset: (parentId: string | null, name: string, kind: "html" | "3d" | "pdf", file: File) => Promise<Result<{ id: string }>>;

  rename: (id: string, name: string) => Promise<Result>;
  reorder: (id: string, dir: "up" | "down") => Promise<Result>;
  move: (id: string, newParentId: string | null) => Promise<Result>;
  remove: (id: string) => Promise<Result>;
  setVisibility: (id: string, v: Visibility) => Promise<Result>;
  updateStyle: (id: string, style: { iconName?: string; cardColor?: CardColor }) => Promise<Result>;
  saveArticle: (id: string, content: unknown) => Promise<void>;
  updateUrl: (id: string, url: string) => Promise<Result>;
  setFolderBg: (id: string, file: File) => Promise<Result>;
  clearFolderBg: (id: string) => Promise<Result>;
}

const NodesContext = createContext<NodesContextType | null>(null);

const notAuthed: Result = { ok: false, reason: "로그인이 필요해요" };
const notAuthedTyped = <T,>(): Result<T> => ({ ok: false, reason: "로그인이 필요해요" });

export function NodesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [quotaBytes, setQuotaBytes] = useState<number>(DEFAULT_QUOTA_BYTES);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNodes([]);
      setLoading(false);
      return;
    }
    const uid = user.uid;
    setLoading(true);
    const unsub = onSnapshot(
      userNodesRef(uid),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Node, "id">) }))
          .sort((a, b) => a.order - b.order);
        setNodes(items);
        setLoading(false);
      },
      (err) => {
        console.error("nodes subscribe failed:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    if (isOwnerUid(user.uid)) {
      setQuotaBytes(Number.POSITIVE_INFINITY);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      setQuotaBytes((data?.quotaBytes as number) ?? DEFAULT_QUOTA_BYTES);
    });
    return () => unsub();
  }, [user]);

  const usedBytes = useMemo(
    () =>
      nodes.reduce(
        (sum, n) => sum + (n.fileSize ?? 0),
        0
      ),
    [nodes]
  );

  const value: NodesContextType = {
    nodes,
    loading,
    activeNodeId,
    setActiveNodeId,
    usedBytes,
    quotaBytes,
    isOwner: !!user && isOwnerUid(user.uid),

    createFolder: (parentId, name) =>
      user ? createFolder(user.uid, parentId, name) : Promise.resolve(notAuthedTyped<{ id: string }>()),
    createArticle: (parentId, name) =>
      user ? createArticle(user.uid, parentId, name) : Promise.resolve(notAuthedTyped<{ id: string }>()),
    createLink: (parentId, name, url) =>
      user ? createLink(user.uid, parentId, name, url) : Promise.resolve(notAuthedTyped<{ id: string }>()),
    createAsset: (parentId, name, kind, file) =>
      user
        ? createAssetLeaf(user.uid, parentId, name, kind, file)
        : Promise.resolve(notAuthedTyped<{ id: string }>()),

    rename: (id, name) =>
      user ? renameNode(user.uid, id, name) : Promise.resolve(notAuthed),
    reorder: (id, dir) =>
      user ? reorderNode(user.uid, id, dir) : Promise.resolve(notAuthed),
    move: (id, newParentId) =>
      user ? moveNode(user.uid, id, newParentId) : Promise.resolve(notAuthed),
    remove: (id) =>
      user ? deleteNode(user.uid, id) : Promise.resolve(notAuthed),
    setVisibility: (id, v) =>
      user ? setNodeVisibility(user.uid, id, v) : Promise.resolve(notAuthed),
    updateStyle: (id, style) =>
      user ? updateNodeStyle(user.uid, id, style) : Promise.resolve(notAuthed),
    saveArticle: async (id, content) => {
      if (!user) return;
      await saveArticleContent(user.uid, id, content);
    },
    updateUrl: (id, url) =>
      user ? updateLinkUrl(user.uid, id, url) : Promise.resolve(notAuthed),
    setFolderBg: (id, file) =>
      user ? uploadFolderBg(user.uid, id, file) : Promise.resolve(notAuthed),
    clearFolderBg: (id) =>
      user ? removeFolderBg(user.uid, id) : Promise.resolve(notAuthed),
  };

  return <NodesContext.Provider value={value}>{children}</NodesContext.Provider>;
}

export function useNodes() {
  const ctx = useContext(NodesContext);
  if (!ctx) throw new Error("useNodes must be used within NodesProvider");
  return ctx;
}
