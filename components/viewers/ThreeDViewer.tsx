"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ThreeDViewerProps {
  url: string;
  className?: string;
}

export function ThreeDViewer({ url, className }: ThreeDViewerProps) {
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
