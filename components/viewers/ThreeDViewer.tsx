"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { AlertTriangle } from "lucide-react";
import { isFirebaseStorageUrl } from "@/lib/url-safe";

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ThreeDViewerProps {
  url: string;
  className?: string;
}

export function ThreeDViewer({ url, className }: ThreeDViewerProps) {
  if (!isFirebaseStorageUrl(url)) {
    return (
      <div
        className={
          className ??
          "flex aspect-video w-full items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200/60"
        }
      >
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <AlertTriangle size={14} />
          안전하지 않은 파일 주소예요.
        </div>
      </div>
    );
  }
  return (
    <div
      className={
        className ??
        "aspect-video w-full overflow-hidden rounded-xl bg-foreground/[0.04] ring-1 ring-border/60"
      }
    >
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }} shadows>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <GltfModel url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
