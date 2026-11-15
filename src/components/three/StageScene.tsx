"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { type Color, type Group, type InstancedMesh, MathUtils, type MeshStandardMaterial, SRGBColorSpace } from "three";
import { pointer } from "@/lib/pointer";
import { stage } from "@/lib/stage";
import { DitherEffect } from "./DitherEffect";
import { VoxelSystem } from "./VoxelSystem";

export type SceneMode = "full" | "lite";

function Voxels({ count, lite }: { count: number; lite: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const system = useRef<VoxelSystem | null>(null);

  useEffect(() => {
    if (!mesh.current) return;
    system.current = new VoxelSystem(mesh.current, count);
    return () => {
      system.current = null;
    };
  }, [count]);

  useFrame(({ camera }, dt) => {
    const sys = system.current;
    if (!sys) return;
    if (sys.shapeId !== stage.shape) sys.setShape(stage.shape);
    sys.update(Math.min(dt, 0.05), camera, pointer.active && !lite ? pointer.x : null, pointer.y, pointer.speed);
    // tanpa dither (mobile): kubusnya langsung diwarnain warna bab
    if (lite && material.current) {
      material.current.color.setRGB(stage.light.r, stage.light.g, stage.light.b, SRGBColorSpace);
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial ref={material} color="#ffffff" roughness={0.55} />
    </instancedMesh>
  );
}

/** Posisi, skala, dan rotasi keseluruhan formasi. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const kick = useRef(0);

  useFrame(({ clock, viewport }, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    const { width, height } = viewport;
    const portrait = width < height;

    // kecepatan mouse meluruh di sini (satu tempat)
    pointer.speed *= Math.exp(-d * 3.2);
    kick.current = MathUtils.damp(kick.current, pointer.speed * Math.sign(pointer.vx || 1) * 0.9, 5, d);

    // layar tegak (HP): objek selalu di tengah
    const px = portrait ? 0 : stage.pose.x;
    const py = portrait ? 0.09 : stage.pose.y;
    const ps = portrait ? Math.min(1, stage.pose.s + 0.1) : stage.pose.s;
    g.position.x = MathUtils.damp(g.position.x, px * width, 5, d);
    g.position.y = MathUtils.damp(g.position.y, py * height + Math.sin(t * 0.9) * 0.25, 5, d);
    g.scale.setScalar(MathUtils.damp(g.scale.x, (Math.min(width, height) / 44) * ps, 5, d));

    // rotasi per jenis bentuk
    const shape = stage.shape;
    let rx: number;
    let ry: number;
    if (shape === "cube") {
      rx = 0.6;
      ry = t * 0.6;
    } else if (shape === "stack") {
      rx = 0.5 + pointer.y * 0.18;
      ry = Math.PI / 4 + Math.sin(t * 0.3) * 0.45 + pointer.x * 0.5;
    } else {
      // bentuk "papan" (wajah, angka, simbol): tetep ngadep depan biar kebaca
      rx = pointer.y * 0.2 + Math.sin(t * 0.7) * 0.05;
      ry = Math.sin(t * 0.45) * 0.32 + pointer.x * 0.3;
    }
    g.rotation.x = MathUtils.damp(g.rotation.x, rx, 3, d);
    g.rotation.y = MathUtils.damp(g.rotation.y, ry + kick.current, 3, d);
  });

  return <group ref={group}>{children}</group>;
}

function Dither() {
  const effect = useMemo(() => new DitherEffect(), []);
  const dpr = useThree((s) => s.viewport.dpr);

  useEffect(() => () => effect.dispose(), [effect]);

  useFrame(() => {
    const u = effect.uniforms;
    const g = Math.min(1, pointer.speed);
    const base = Math.max(2, Math.round(2.5 * dpr));
    u.get("uGlitch")!.value = g;
    u.get("uPixel")!.value = base + Math.round(g * 3) * Math.ceil(dpr); // mouse kenceng → pixel membesar
    (u.get("uLight")!.value as Color).setRGB(stage.light.r, stage.light.g, stage.light.b, SRGBColorSpace);
    (u.get("uDark")!.value as Color).setRGB(stage.dark.r, stage.dark.g, stage.dark.b, SRGBColorSpace);
  });

  return (
    <EffectComposer multisampling={0}>
      <primitive object={effect} />
    </EffectComposer>
  );
}

/**
 * full: 4096 kubus + dither 1-bit + scanline (post-processing custom).
 * lite: 1400 kubus, tanpa post-processing (mobile). Scanline diganti overlay CSS di Stage.
 */
export default function StageScene({ mode }: { mode: SceneMode }) {
  const lite = mode === "lite";
  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 70], fov: 30, near: 1, far: 200 }}
      gl={{ antialias: lite, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <ambientLight intensity={lite ? 0.55 : 0.22} />
      <directionalLight position={[30, 50, 60]} intensity={lite ? 2.4 : 2.3} />
      <directionalLight position={[-40, -10, 30]} intensity={0.7} />
      <Rig>
        <Voxels count={lite ? 1400 : 4096} lite={lite} />
      </Rig>
      {!lite && <Dither />}
    </Canvas>
  );
}
