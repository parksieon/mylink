import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getProfileByUsername } from "@/lib/user";
import { uploadAsset, deleteAssetFile, deleteAllNodeFiles } from "@/lib/assets";

export const MAX_DEPTH = 3;
export const ORDER_GAP = 1024;

export type NodeKind =
  | "folder"
  | "article"
  | "link"
  | "html"
  | "3d"
  | "pdf";

export type Visibility = "public" | "private";

export type CardColor =
  | "default"
  | "blue"
  | "purple"
  | "pink"
  | "amber"
  | "emerald"
  | "rose"
  | "sky";

export interface Node {
  id: string;
  kind: NodeKind;
  name: string;
  parentId: string | null;
  ancestorIds: string[];
  path: string[];
  slug: string;
  depth: number;
  order: number;
  visibility: Visibility;
  effectiveVisibility: Visibility;
  iconName?: string;
  cardColor?: CardColor;
  createdAt: number;
  updatedAt: number;
  // folder
  bgImageURL?: string;
  bgImagePath?: string;
  // article
  content?: unknown;
  // link
  url?: string;
  clickCount?: number;
  // asset (html/3d/pdf)
  fileURL?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
}

export type Result<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

const ok = <T = undefined>(value?: T): Result<T> => ({
  ok: true,
  value: value as T,
});
const fail = (reason: string): Result<never> => ({ ok: false, reason });

function explainFirestoreError(label: string, err: unknown): string {
  const code = (err as { code?: string })?.code;
  const message = (err as Error)?.message ?? String(err);
  console.error(`${label} failed:`, err);
  if (code === "permission-denied") {
    return "권한 거부 — Firebase 콘솔에 새 firestore.rules 가 publish 되어있는지 확인해주세요.";
  }
  return `${label} 실패: ${message}`;
}

export function userNodesRef(uid: string) {
  return collection(db, "users", uid, "nodes");
}
export function userNodeDoc(uid: string, id: string) {
  return doc(db, "users", uid, "nodes", id);
}

function slugify(name: string): string {
  return encodeURIComponent(name.trim());
}

function computeEffective(
  kind: NodeKind,
  own: Visibility,
  parentEffective: Visibility
): Visibility {
  if (kind !== "folder") return parentEffective;
  if (own === "private" || parentEffective === "private") return "private";
  return "public";
}

async function getNode(uid: string, id: string): Promise<Node | null> {
  const snap = await getDoc(userNodeDoc(uid, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Node, "id">) };
}

async function getSiblings(
  uid: string,
  parentId: string | null
): Promise<Node[]> {
  const q = query(userNodesRef(uid), where("parentId", "==", parentId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Node, "id">) }))
    .sort((a, b) => a.order - b.order);
}

async function getDescendants(
  uid: string,
  ancestorId: string
): Promise<Node[]> {
  const q = query(
    userNodesRef(uid),
    where("ancestorIds", "array-contains", ancestorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Node, "id">),
  }));
}

async function resolveParent(uid: string, parentId: string | null) {
  if (parentId === null) {
    return {
      ok: true as const,
      depth: -1,
      effective: "public" as Visibility,
      path: [] as string[],
      ancestorIds: [] as string[],
    };
  }
  const parent = await getNode(uid, parentId);
  if (!parent) return { ok: false as const, reason: "상위 폴더를 찾을 수 없어요" };
  if (parent.kind !== "folder")
    return { ok: false as const, reason: "폴더 안에만 만들 수 있어요" };
  return {
    ok: true as const,
    depth: parent.depth,
    effective: parent.effectiveVisibility,
    path: parent.path,
    ancestorIds: parent.ancestorIds,
  };
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "이름을 입력해주세요";
  if (trimmed.length > 60) return "이름은 60자 이하로 입력해주세요";
  if (trimmed.includes("/")) return "이름에 / 는 사용할 수 없어요";
  return null;
}

async function createNodeInternal(opts: {
  uid: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  extra: Partial<Node>;
}): Promise<Result<{ id: string; node: Node }>> {
  const nameError = validateName(opts.name);
  if (nameError) return fail(nameError);

  const parent = await resolveParent(opts.uid, opts.parentId);
  if (!parent.ok) return fail(parent.reason);

  const newDepth = parent.depth + 1;
  if (newDepth > MAX_DEPTH)
    return fail(`최대 ${MAX_DEPTH + 1}단계까지만 만들 수 있어요`);

  const siblings = await getSiblings(opts.uid, opts.parentId);
  const trimmed = opts.name.trim();
  if (siblings.some((s) => s.kind === opts.kind && s.name === trimmed)) {
    return fail("같은 이름이 이미 있어요");
  }
  const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order), 0);

  const now = Date.now();
  const visibility: Visibility = "private";
  const effective = computeEffective(opts.kind, visibility, parent.effective);

  const data: Omit<Node, "id"> = {
    kind: opts.kind,
    name: trimmed,
    parentId: opts.parentId,
    ancestorIds:
      opts.parentId === null
        ? []
        : [...parent.ancestorIds, opts.parentId],
    path: [...parent.path, trimmed],
    slug: slugify(trimmed),
    depth: newDepth,
    order: maxOrder + ORDER_GAP,
    visibility,
    effectiveVisibility: effective,
    createdAt: now,
    updatedAt: now,
    ...opts.extra,
  };

  try {
    const ref = await addDoc(userNodesRef(opts.uid), data);
    return ok({ id: ref.id, node: { id: ref.id, ...data } as Node });
  } catch (err) {
    console.error("addDoc failed:", err);
    const code = (err as { code?: string })?.code;
    if (code === "permission-denied") {
      return fail(
        "권한 거부 — Firebase 콘솔에 새 firestore.rules 가 publish 되어있는지 확인해주세요."
      );
    }
    return fail(
      `저장 실패: ${(err as Error)?.message ?? "알 수 없는 오류"}`
    );
  }
}

export async function createFolder(
  uid: string,
  parentId: string | null,
  name: string
): Promise<Result<{ id: string }>> {
  const r = await createNodeInternal({
    uid,
    parentId,
    name,
    kind: "folder",
    extra: {},
  });
  if (!r.ok) return r;
  return ok({ id: r.value.id });
}

export async function createArticle(
  uid: string,
  parentId: string | null,
  name: string
): Promise<Result<{ id: string }>> {
  const r = await createNodeInternal({
    uid,
    parentId,
    name,
    kind: "article",
    extra: { content: null },
  });
  if (!r.ok) return r;
  return ok({ id: r.value.id });
}

export async function createLink(
  uid: string,
  parentId: string | null,
  name: string,
  url: string
): Promise<Result<{ id: string }>> {
  if (!url.trim()) return fail("주소를 입력해주세요");
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return fail("http:// 또는 https:// 주소여야 해요");
    }
  } catch {
    return fail("올바른 주소를 입력해주세요");
  }
  const r = await createNodeInternal({
    uid,
    parentId,
    name,
    kind: "link",
    extra: { url: url.trim(), clickCount: 0 },
  });
  if (!r.ok) return r;
  return ok({ id: r.value.id });
}

export async function createAssetLeaf(
  uid: string,
  parentId: string | null,
  name: string,
  kind: "html" | "3d" | "pdf",
  file: File
): Promise<Result<{ id: string }>> {
  const r = await createNodeInternal({
    uid,
    parentId,
    name,
    kind,
    extra: {
      mimeType: file.type,
      fileSize: file.size,
    },
  });
  if (!r.ok) return r;
  const nodeId = r.value.id;

  const storagePath = `users/${uid}/files/${nodeId}/${file.name}`;
  const upload = await uploadAsset(uid, file, storagePath);
  if (!upload.ok) {
    try {
      await deleteDoc(userNodeDoc(uid, nodeId));
    } catch {}
    return fail(upload.reason);
  }

  await updateDoc(userNodeDoc(uid, nodeId), {
    fileURL: upload.value.downloadURL,
    filePath: storagePath,
  });
  await updateDoc(doc(db, "users", uid), {
    usedBytes: increment(file.size),
  });

  return ok({ id: nodeId });
}

export async function uploadFolderBg(
  uid: string,
  folderId: string,
  file: File
): Promise<Result> {
  const node = await getNode(uid, folderId);
  if (!node) return fail("폴더를 찾을 수 없어요");
  if (node.kind !== "folder") return fail("폴더에만 배경을 지정할 수 있어요");

  if (node.bgImagePath) {
    await deleteAssetFile(node.bgImagePath);
  }

  const storagePath = `users/${uid}/files/${folderId}/bg-${file.name}`;
  const upload = await uploadAsset(uid, file, storagePath);
  if (!upload.ok) return fail(upload.reason);

  const sizeDelta = file.size - (node.bgImagePath ? 0 : 0);
  await updateDoc(userNodeDoc(uid, folderId), {
    bgImageURL: upload.value.downloadURL,
    bgImagePath: storagePath,
    updatedAt: Date.now(),
  });
  if (sizeDelta > 0) {
    await updateDoc(doc(db, "users", uid), {
      usedBytes: increment(sizeDelta),
    });
  }
  return ok();
}

export async function removeFolderBg(
  uid: string,
  folderId: string
): Promise<Result> {
  const node = await getNode(uid, folderId);
  if (!node) return fail("폴더를 찾을 수 없어요");
  if (!node.bgImagePath) return ok();
  await deleteAssetFile(node.bgImagePath);
  await updateDoc(userNodeDoc(uid, folderId), {
    bgImageURL: null,
    bgImagePath: null,
    updatedAt: Date.now(),
  });
  return ok();
}

export async function renameNode(
  uid: string,
  id: string,
  newName: string
): Promise<Result> {
  const nameError = validateName(newName);
  if (nameError) return fail(nameError);
  const trimmed = newName.trim();

  const node = await getNode(uid, id);
  if (!node) return fail("노드를 찾을 수 없어요");
  if (node.name === trimmed) return ok();

  const siblings = await getSiblings(uid, node.parentId);
  if (
    siblings.some(
      (s) => s.id !== id && s.kind === node.kind && s.name === trimmed
    )
  ) {
    return fail("같은 이름이 이미 있어요");
  }

  const descendants =
    node.kind === "folder" ? await getDescendants(uid, id) : [];
  const batch = writeBatch(db);
  const now = Date.now();
  const newPath = [...node.path.slice(0, -1), trimmed];

  batch.update(userNodeDoc(uid, id), {
    name: trimmed,
    slug: slugify(trimmed),
    path: newPath,
    updatedAt: now,
  });
  for (const d of descendants) {
    const dPath = [...d.path];
    dPath[node.depth] = trimmed;
    batch.update(userNodeDoc(uid, d.id), { path: dPath, updatedAt: now });
  }
  try {
    await batch.commit();
  } catch (err) {
    return fail(explainFirestoreError("renameNode", err));
  }
  return ok();
}

export async function reorderNode(
  uid: string,
  id: string,
  direction: "up" | "down"
): Promise<Result> {
  const node = await getNode(uid, id);
  if (!node) return fail("노드를 찾을 수 없어요");
  const siblings = await getSiblings(uid, node.parentId);
  const idx = siblings.findIndex((s) => s.id === id);
  if (idx === -1) return fail("노드를 찾을 수 없어요");
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return ok();
  const other = siblings[swapIdx];
  const now = Date.now();
  const batch = writeBatch(db);
  batch.update(userNodeDoc(uid, id), { order: other.order, updatedAt: now });
  batch.update(userNodeDoc(uid, other.id), {
    order: node.order,
    updatedAt: now,
  });
  try {
    await batch.commit();
  } catch (err) {
    return fail(explainFirestoreError("reorderNode", err));
  }
  return ok();
}

export async function moveNode(
  uid: string,
  id: string,
  newParentId: string | null
): Promise<Result> {
  const node = await getNode(uid, id);
  if (!node) return fail("노드를 찾을 수 없어요");
  if (node.parentId === newParentId) return ok();
  if (id === newParentId) return fail("자기 자신을 부모로 지정할 수 없어요");

  const parent = await resolveParent(uid, newParentId);
  if (!parent.ok) return fail(parent.reason);
  if (newParentId !== null) {
    const pn = await getNode(uid, newParentId);
    if (pn?.ancestorIds.includes(id))
      return fail("자기 하위로는 이동할 수 없어요");
  }

  const descendants =
    node.kind === "folder" ? await getDescendants(uid, id) : [];
  const newDepth = parent.depth + 1;
  const depthDelta = newDepth - node.depth;
  const maxDescDepth = descendants.reduce(
    (m, d) => Math.max(m, d.depth),
    node.depth
  );
  if (maxDescDepth + depthDelta > MAX_DEPTH) {
    return fail("이동하면 최대 깊이를 초과해요");
  }

  const siblings = await getSiblings(uid, newParentId);
  if (
    siblings.some(
      (s) => s.id !== id && s.kind === node.kind && s.name === node.name
    )
  ) {
    return fail("이동할 곳에 같은 이름이 이미 있어요");
  }
  const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order), 0);

  const newAncestors =
    newParentId === null ? [] : [...parent.ancestorIds, newParentId];
  const newPath = [...parent.path, node.name];
  const newEffective = computeEffective(
    node.kind,
    node.visibility,
    parent.effective
  );

  const batch = writeBatch(db);
  const now = Date.now();
  batch.update(userNodeDoc(uid, id), {
    parentId: newParentId,
    ancestorIds: newAncestors,
    path: newPath,
    depth: newDepth,
    order: maxOrder + ORDER_GAP,
    effectiveVisibility: newEffective,
    updatedAt: now,
  });

  type NS = {
    effective: Visibility;
    depth: number;
    path: string[];
    ancestorIds: string[];
  };
  const states = new Map<string, NS>();
  states.set(id, {
    effective: newEffective,
    depth: newDepth,
    path: newPath,
    ancestorIds: newAncestors,
  });
  const sortedDesc = descendants.slice().sort((a, b) => a.depth - b.depth);
  for (const d of sortedDesc) {
    const ps = states.get(d.parentId!);
    if (!ps) continue;
    const newD: NS = {
      effective: computeEffective(d.kind, d.visibility, ps.effective),
      depth: ps.depth + 1,
      path: [...ps.path, d.name],
      ancestorIds: [...ps.ancestorIds, d.parentId!],
    };
    states.set(d.id, newD);
    batch.update(userNodeDoc(uid, d.id), {
      ancestorIds: newD.ancestorIds,
      path: newD.path,
      depth: newD.depth,
      effectiveVisibility: newD.effective,
      updatedAt: now,
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    return fail(explainFirestoreError("moveNode", err));
  }
  return ok();
}

export async function deleteNode(uid: string, id: string): Promise<Result> {
  const node = await getNode(uid, id);
  if (!node) return fail("노드를 찾을 수 없어요");
  const descendants =
    node.kind === "folder" ? await getDescendants(uid, id) : [];
  const all = [node, ...descendants];

  let totalSize = 0;
  for (const n of all) {
    // 노드 하위의 모든 파일(article 임베드 이미지·leaf asset·폴더 배경) 통째 삭제
    const cleaned = await deleteAllNodeFiles(uid, n.id);
    totalSize += cleaned;
  }

  const batch = writeBatch(db);
  for (const n of all) batch.delete(userNodeDoc(uid, n.id));
  if (totalSize > 0) {
    batch.update(doc(db, "users", uid), {
      usedBytes: increment(-totalSize),
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    return fail(explainFirestoreError("deleteNode", err));
  }
  return ok();
}

export async function setNodeVisibility(
  uid: string,
  nodeId: string,
  visibility: Visibility
): Promise<Result> {
  const node = await getNode(uid, nodeId);
  if (!node) return fail("노드를 찾을 수 없어요");
  if (node.kind !== "folder")
    return fail("폴더만 공개 설정을 변경할 수 있어요");

  let parentEffective: Visibility = "public";
  if (node.parentId !== null) {
    const parent = await getNode(uid, node.parentId);
    if (parent) parentEffective = parent.effectiveVisibility;
  }
  const newEffective = computeEffective(
    "folder",
    visibility,
    parentEffective
  );

  const descendants = await getDescendants(uid, nodeId);
  const batch = writeBatch(db);
  const now = Date.now();
  batch.update(userNodeDoc(uid, nodeId), {
    visibility,
    effectiveVisibility: newEffective,
    updatedAt: now,
  });

  const states = new Map<string, { effective: Visibility }>();
  states.set(nodeId, { effective: newEffective });
  const sortedDesc = descendants.slice().sort((a, b) => a.depth - b.depth);
  for (const d of sortedDesc) {
    const ps = states.get(d.parentId!);
    if (!ps) continue;
    const dEffective = computeEffective(d.kind, d.visibility, ps.effective);
    states.set(d.id, { effective: dEffective });
    batch.update(userNodeDoc(uid, d.id), {
      effectiveVisibility: dEffective,
      updatedAt: now,
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    return fail(explainFirestoreError("setNodeVisibility", err));
  }
  return ok();
}

export async function updateNodeStyle(
  uid: string,
  nodeId: string,
  style: { iconName?: string; cardColor?: CardColor }
): Promise<Result> {
  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (style.iconName !== undefined) patch.iconName = style.iconName;
  if (style.cardColor !== undefined) patch.cardColor = style.cardColor;
  try {
    await updateDoc(userNodeDoc(uid, nodeId), patch);
    return ok();
  } catch (err) {
    console.error("updateNodeStyle failed:", err);
    return fail("스타일 저장에 실패했어요");
  }
}

export async function saveArticleContent(
  uid: string,
  nodeId: string,
  content: unknown
): Promise<void> {
  await updateDoc(userNodeDoc(uid, nodeId), {
    content,
    updatedAt: Date.now(),
  });
}

export async function updateLinkUrl(
  uid: string,
  nodeId: string,
  url: string
): Promise<Result> {
  if (!url.trim()) return fail("주소를 입력해주세요");
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return fail("http:// 또는 https:// 주소여야 해요");
    }
  } catch {
    return fail("올바른 주소를 입력해주세요");
  }
  try {
    await updateDoc(userNodeDoc(uid, nodeId), {
      url: url.trim(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    return fail(explainFirestoreError("updateLinkUrl", err));
  }
  return ok();
}

export async function incrementLinkClick(
  uid: string,
  nodeId: string
): Promise<void> {
  try {
    await updateDoc(userNodeDoc(uid, nodeId), {
      clickCount: increment(1),
    });
  } catch (err) {
    console.error("incrementLinkClick failed:", err);
  }
}

// 공개 페이지에서 쓰는 트리 fetch — Firestore 룰 통과를 위해 effectiveVisibility=="public" 필터 필수
export async function getNodeTreeByUsername(
  username: string
): Promise<{ uid: string; nodes: Node[] } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  try {
    const q = query(
      userNodesRef(profile.uid),
      where("effectiveVisibility", "==", "public")
    );
    const snap = await getDocs(q);
    const nodes = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Node, "id">) }))
      .sort((a, b) => a.order - b.order);
    return { uid: profile.uid, nodes };
  } catch (err) {
    console.error("getNodeTreeByUsername failed:", err);
    return { uid: profile.uid, nodes: [] };
  }
}

// 공개 페이지 라우팅용 — path로 노드 찾기. public만 (비로그인이 private 못 보게)
export async function getNodeByPath(
  uid: string,
  path: string[]
): Promise<Node | null> {
  if (path.length === 0) return null;
  try {
    const q = query(
      userNodesRef(uid),
      where("path", "==", path),
      where("effectiveVisibility", "==", "public")
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<Node, "id">) };
  } catch (err) {
    console.error("getNodeByPath failed:", err);
    return null;
  }
}
