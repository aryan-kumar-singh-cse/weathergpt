"use client";

import React, { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";

export type WeatherCondition = "clear" | "cloudy" | "rainy";

type Props = {
  lat: number;
  lng: number;
  weatherCondition: WeatherCondition;
  cityName?: string;
  onSelectLocation?: () => void;
};

// Convert Lat/Lng to 3D Cartesian coordinates on sphere
function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function PhotorealisticEarth({ lat, lng, weatherCondition, onSelectLocation }: Props) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const rippleRing1Ref = useRef<THREE.Mesh>(null);
  const rippleRing2Ref = useRef<THREE.Mesh>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const flyToTimeRemainingRef = useRef(0);
  const prevCoordsRef = useRef({ lat, lng });

  // Load NASA Blue Marble textures
  const [dayMap, nightMap, cloudsMap] = useTexture([
    "/textures/earth-blue-marble.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-clouds.png",
  ]);

  // Ensure seamless texture filtering and wrapping
  useMemo(() => {
    dayMap.wrapS = THREE.RepeatWrapping;
    dayMap.wrapT = THREE.ClampToEdgeWrapping;
    cloudsMap.wrapS = THREE.RepeatWrapping;
    cloudsMap.wrapT = THREE.ClampToEdgeWrapping;
  }, [dayMap, cloudsMap]);

  const cloudOpacity = useMemo(() => {
    if (weatherCondition === "rainy") return 0.55;
    if (weatherCondition === "cloudy") return 0.40;
    return 0.22;
  }, [weatherCondition]);

  // Target Euler rotation angles: exactly align (lat, lng) to face camera (+Z axis)
  const { targetRotX, targetRotY } = useMemo(() => {
    const radLat = (lat * Math.PI) / 180;
    const radLng = (lng * Math.PI) / 180;

    // Y rotation aligns longitude to face camera (+Z)
    const rotY = -radLng - Math.PI / 2;
    // X rotation tilts latitude to center in front of camera
    const rotX = radLat - 0.12;

    return { targetRotX: rotX, targetRotY: rotY };
  }, [lat, lng]);

  // Trigger Google Earth fly-to transition whenever coords change
  useEffect(() => {
    if (prevCoordsRef.current.lat !== lat || prevCoordsRef.current.lng !== lng) {
      flyToTimeRemainingRef.current = 2.0; // 2s smooth fly-to transition
      prevCoordsRef.current = { lat, lng };
    }
  }, [lat, lng]);

  useFrame((state, delta) => {
    if (earthGroupRef.current) {
      if (flyToTimeRemainingRef.current > 0 && !isDraggingRef.current) {
        // 1. Active Fly-To Navigation Easing (Google Earth style)
        flyToTimeRemainingRef.current -= delta;
        earthGroupRef.current.rotation.y = THREE.MathUtils.damp(
          earthGroupRef.current.rotation.y,
          targetRotY,
          3.8,
          delta
        );
        earthGroupRef.current.rotation.x = THREE.MathUtils.damp(
          earthGroupRef.current.rotation.x,
          targetRotX,
          3.8,
          delta
        );
      } else if (!isDraggingRef.current) {
        // 2. Continuous Ambient Background Rotation (keeps spinning smoothly!)
        earthGroupRef.current.rotation.y += delta * 0.015;
      }
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.018;
    }

    // Concentric Radar Ripple Wave Animations
    const elapsed = state.clock.getElapsedTime();
    if (rippleRing1Ref.current) {
      const phase1 = (elapsed * 2.2) % 1;
      const scale1 = 0.8 + phase1 * 1.0;
      rippleRing1Ref.current.scale.set(scale1, scale1, scale1);
      (rippleRing1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - phase1));
    }
    if (rippleRing2Ref.current) {
      const phase2 = ((elapsed * 2.2) + 0.5) % 1;
      const scale2 = 0.8 + phase2 * 1.0;
      rippleRing2Ref.current.scale.set(scale2, scale2, scale2);
      (rippleRing2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - phase2));
    }
  });

  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.02);

  // Laser beacon beam direction
  const beamDir = markerPos.clone().normalize();
  const beamHeight = 0.25;
  const beamCenter = markerPos.clone().add(beamDir.clone().multiplyScalar(beamHeight / 2));
  const beamQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamDir);

  return (
    <group
      position={[0, -0.1, 0]}
      onPointerDown={(e) => {
        isDraggingRef.current = true;
        prevPointerRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        isDraggingRef.current = false;
      }}
      onPointerLeave={() => {
        isDraggingRef.current = false;
      }}
      onPointerMove={(e) => {
        if (isDraggingRef.current && earthGroupRef.current) {
          const deltaX = e.clientX - prevPointerRef.current.x;
          const deltaY = e.clientY - prevPointerRef.current.y;
          prevPointerRef.current = { x: e.clientX, y: e.clientY };
          flyToTimeRemainingRef.current = 0; // User manual drag takes priority
          earthGroupRef.current.rotation.y += deltaX * 0.006;
          earthGroupRef.current.rotation.x += deltaY * 0.006;
        }
      }}
    >
      <group ref={earthGroupRef}>
        {/* Main Blue Marble Earth Surface */}
        <Sphere args={[earthRadius, 64, 64]}>
          <meshStandardMaterial
            map={dayMap}
            roughness={0.7}
            metalness={0.1}
            bumpScale={0.05}
          />
        </Sphere>

        {/* Atmospheric Cloud Layer */}
        <Sphere ref={cloudsRef} args={[earthRadius + 0.012, 64, 64]}>
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={cloudOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Sphere>

        {/* Vertical Holographic Atmospheric Laser Light Beam */}
        <mesh position={beamCenter} quaternion={beamQuaternion}>
          <cylinderGeometry args={[0.005, 0.015, beamHeight, 16]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>

        {/* Location Pin Marker & Interactive District Map Trigger */}
        <group position={markerPos}>
          {/* Outer Concentric Holographic Radar Wave 1 */}
          <mesh ref={rippleRing1Ref}>
            <ringGeometry args={[0.06, 0.11, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>

          {/* Outer Concentric Holographic Radar Wave 2 */}
          <mesh ref={rippleRing2Ref}>
            <ringGeometry args={[0.10, 0.15, 32]} />
            <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>

          {/* Inner Golden Target Ring */}
          <mesh>
            <ringGeometry args={[0.03, 0.055, 32]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>

          {/* Core Glowing Pinpoint Sphere */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelectLocation?.();
            }}
            onPointerOver={() => {
              if (typeof document !== "undefined") document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              if (typeof document !== "undefined") document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.045, 24, 24]} />
            <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FallbackHorizonEarth({ lat, lng }: Props) {
  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.02);
  return (
    <group position={[0, -0.1, 0]}>
      <Sphere args={[earthRadius, 32, 32]}>
        <meshStandardMaterial color="#0f2b48" roughness={0.7} />
      </Sphere>
      <mesh position={markerPos}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}

export default function WeatherGlobe({
  lat,
  lng,
  weatherCondition,
  cityName,
  onSelectLocation,
}: Props) {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDpr([1, 1]);
    }
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.3, 4.5], fov: 45 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 4, 3]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.8} color="#38bdf8" />

      <Suspense fallback={<FallbackHorizonEarth lat={lat} lng={lng} weatherCondition={weatherCondition} />}>
        <PhotorealisticEarth
          lat={lat}
          lng={lng}
          weatherCondition={weatherCondition}
          cityName={cityName}
          onSelectLocation={onSelectLocation}
        />
      </Suspense>
    </Canvas>
  );
}
