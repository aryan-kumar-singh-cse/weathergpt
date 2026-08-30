"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";

export type WeatherCondition = "clear" | "cloudy" | "rainy";

type Props = {
  lat: number;
  lng: number;
  weatherCondition: WeatherCondition;
};

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function EarthMesh({ lat, lng, weatherCondition }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const earthMap = useTexture("/textures/earth-night.jpg");

  const cloudOpacity =
    weatherCondition === "rainy" ? 0.85 : weatherCondition === "cloudy" ? 0.5 : 0.15;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  const markerPos = latLngToVector3(lat, lng, 1.02);

  return (
    <group ref={groupRef}>
      {/* Base Earth Sphere with Night Lights Texture */}
      <Sphere args={[1, 64, 64]}>
        <meshStandardMaterial map={earthMap} roughness={0.7} metalness={0.1} />
      </Sphere>

      {/* Dynamic Cloud Atmosphere Sphere */}
      <Sphere args={[1.02, 64, 64]}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={cloudOpacity}
          depthWrite={false}
        />
      </Sphere>

      {/* Orange GPS/Location Marker Pin */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
}

function FallbackEarth({ lat, lng, weatherCondition }: Props) {
  const markerPos = latLngToVector3(lat, lng, 1.02);
  return (
    <group>
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial color="#1e293b" wireframe />
      </Sphere>
      <mesh position={markerPos}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
}

export default function WeatherGlobe({ lat, lng, weatherCondition }: Props) {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDpr([1, 1]);
    }
  }, []);

  return (
    <Canvas camera={{ position: [0, 0.3, 3], fov: 45 }} dpr={dpr}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />
      <Suspense fallback={<FallbackEarth lat={lat} lng={lng} weatherCondition={weatherCondition} />}>
        <EarthMesh lat={lat} lng={lng} weatherCondition={weatherCondition} />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}
