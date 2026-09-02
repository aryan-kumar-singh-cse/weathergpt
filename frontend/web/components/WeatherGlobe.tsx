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
  const elapsedTimeRef = useRef(0);

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

    // Concentric Radar Ripple Wave Animations (tangent on surface)
    elapsedTimeRef.current += delta;
    const elapsed = elapsedTimeRef.current;
    if (rippleRing1Ref.current) {
      const phase1 = (elapsed * 2.0) % 1;
      const scale1 = 0.6 + phase1 * 0.8;
      rippleRing1Ref.current.scale.set(scale1, scale1, scale1);
      (rippleRing1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - phase1));
    }
    if (rippleRing2Ref.current) {
      const phase2 = ((elapsed * 2.0) + 0.5) % 1;
      const scale2 = 0.6 + phase2 * 0.8;
      rippleRing2Ref.current.scale.set(scale2, scale2, scale2);
      (rippleRing2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - phase2));
    }
  });

  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.005);

  // Calculate surface normal quaternion so pin & rings lie perfectly tangent to the curved Earth
  const markerNormal = markerPos.clone().normalize();
  const markerQuaternion = useMemo(() => {
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), markerNormal);
  }, [markerNormal]);

  return (
    <group
      position={[0, 0, 0]}
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
            roughness={0.75}
            metalness={0.08}
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

        {/* Perfectly Tangent & Upright Google Earth 3D Pin Marker */}
        <group position={markerPos} quaternion={markerQuaternion}>
          {/* Surface Concentric Radar Ripple 1 (lying flat on sphere surface) */}
          <mesh ref={rippleRing1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[0.04, 0.08, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>

          {/* Surface Concentric Radar Ripple 2 (lying flat on sphere surface) */}
          <mesh ref={rippleRing2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[0.07, 0.12, 32]} />
            <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>

          {/* Surface Ground Target Disc (flush on ground) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
            <circleGeometry args={[0.032, 32]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>

          {/* Sleek Vertical Tapered Pin Needle */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.004, 0.009, 0.14, 16]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Glowing Golden Pinhead Sphere (Clickable) */}
          <mesh
            position={[0, 0.15, 0]}
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
            <sphereGeometry args={[0.038, 24, 24]} />
            <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FallbackHorizonEarth({ lat, lng }: Props) {
  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.01);
  return (
    <group position={[0, 0, 0]}>
      <Sphere args={[earthRadius, 32, 32]}>
        <meshStandardMaterial color="#0f2b48" roughness={0.7} />
      </Sphere>
      <mesh position={markerPos}>
        <sphereGeometry args={[0.035, 16, 16]} />
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
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth < 768) {
        setDpr([1, 1]);
      }
    }
  }, []);

  // Frame the Earth nicely: on desktop offset slightly right [0.5, 0.1, 4.4] so left dashboard card doesn't occlude it
  const cameraPos: [number, number, number] = isDesktop ? [0.45, 0.1, 4.5] : [0, 0.2, 4.5];

  return (
    <Canvas
      camera={{ position: cameraPos, fov: 44 }}
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
