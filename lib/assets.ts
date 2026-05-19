import {
  ref as storageRef,
  uploadBytes,
  deleteObject,
  getDownloadURL,
  listAll,
  getMetadata,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  getQuotaInfo,
  isOwnerUid,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/quota";

export type UploadResult =
  | { ok: true; value: { downloadURL: string } }
  | { ok: false; reason: string };

export async function uploadAsset(
  uid: string,
  file: File,
  storagePath: string
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: "파일 크기는 100MB 이하만 가능해요" };
  }
  if (!isOwnerUid(uid)) {
    const q = await getQuotaInfo(uid);
    if (q.usedBytes + file.size > q.quotaBytes) {
      const mb = Math.round(q.quotaBytes / 1024 / 1024);
      return {
        ok: false,
        reason: `용량 한도(${mb}MB)를 초과해요. 증설은 메일로 요청해 주세요.`,
      };
    }
  }
  try {
    const ref = storageRef(storage, storagePath);
    await uploadBytes(ref, file, { contentType: file.type });
    const downloadURL = await getDownloadURL(ref);
    return { ok: true, value: { downloadURL } };
  } catch (err) {
    console.error("uploadAsset failed:", err);
    return { ok: false, reason: "업로드 중 오류가 발생했어요" };
  }
}

export async function deleteAssetFile(storagePath: string): Promise<void> {
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch (err) {
    console.error("deleteAssetFile failed:", err);
  }
}

// 노드 하위의 모든 파일 청소 (article 임베드 이미지 등). 삭제한 총 바이트를 반환.
export async function deleteAllNodeFiles(
  uid: string,
  nodeId: string
): Promise<number> {
  try {
    const prefixRef = storageRef(storage, `users/${uid}/files/${nodeId}`);
    const result = await listAll(prefixRef);
    let totalSize = 0;
    for (const itemRef of result.items) {
      try {
        const meta = await getMetadata(itemRef);
        totalSize += meta.size ?? 0;
        await deleteObject(itemRef);
      } catch (err) {
        console.error("deleteAllNodeFiles item failed:", itemRef.fullPath, err);
      }
    }
    return totalSize;
  } catch (err) {
    console.error("deleteAllNodeFiles listAll failed:", err);
    return 0;
  }
}
