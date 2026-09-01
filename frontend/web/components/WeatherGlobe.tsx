"use client";

import React, { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";

export type WeatherCondition = "clear" | "cloudy" | "rainy";

type Props = {
  lat: number;
  lng: number;
  weatherCondition: WeatherCondition;
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

// Atmospheric Glow Shader (Fresnel Rayleigh effect)
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
      gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
  `,
};

function PhotorealisticEarth({ lat, lng, weatherCondition }: Props) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Load NASA Blue Marble textures
  const [dayMap, nightMap, cloudsMap] = useTexture([
    "/textures/earth-blue-marble.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-clouds.png",
  ]);

  const cloudOpacity = useMemo(() => {
    if (weatherCondition === "rainy") return 0.65;
    if (weatherCondition === "cloudy") return 0.45;
    return 0.28;
  }, [weatherCondition]);

  // Compute target Euler rotation angles for Google Earth-style location focus
  const { targetRotX, targetRotY } = useMemo(() => {
    // Convert lat/lng to sphere orientation angles aligned with camera (+Z view with horizon tilt)
    const radLat = (lat * Math.PI) / 180;
    const radLng = (lng * Math.PI) / 180;

    // Y rotation aligns longitude facing camera
    const rotY = -radLng - Math.PI / 2;
    // X rotation aligns latitude with slight tilt for optimal view above lower UI cards
    const rotX = Math.max(-0.6, Math.min(0.8, radLat * 0.65));

    return { targetRotX: rotX, targetRotY: rotY };
  }, [lat, lng]);

  useFrame((state, delta) => {
    if (earthGroupRef.current) {
      // Smoothly interpolate Earth rotation to target lat/lng like Google Earth navigation
      earthGroupRef.current.rotation.y = THREE.MathUtils.damp(
        earthGroupRef.current.rotation.y,
        targetRotY,
        3.5,
        delta
      );
      earthGroupRef.current.rotation.x = THREE.MathUtils.damp(
        earthGroupRef.current.rotation.x,
        targetRotX,
        3.5,
        delta
      );
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.005;
    }

    // Pulsing target beacon animation
    if (pulseRingRef.current) {
      const elapsed = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(elapsed * 4) * 0.35;
      pulseRingRef.current.scale.set(scale, scale, scale);
    }
  });

  const earthRadius = 2.45;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.025);

  // Positioned slightly in -Y axis ([0, -2.45, 0]) to make room for expanding forecast panel
  return (
    <group position={[0, -2.45, 0]}>
      {/* Atmosphere Outer Glow Halo */}
      <Sphere args={[earthRadius * 1.06, 64, 64]}>
        <shaderMaterial
          vertexShader={AtmosphereShader.vertexShader}
          fragmentShader={AtmosphereShader.fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </Sphere>

      <group ref={earthGroupRef}>
        {/* Main Blue Marble Earth Surface */}
        <Sphere args={[earthRadius, 64, 64]}>
          <meshStandardMaterial
            map={dayMap}
            roughness={0.65}
            metalness={0.15}
            bumpScale={0.05}
          />
        </Sphere>

        {/* Atmospheric Cloud Layer */}
        <Sphere ref={cloudsRef} args={[earthRadius + 0.015, 64, 64]}>
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={cloudOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Sphere>

        {/* Location Pin Marker with Google Earth-style Glowing Target Radar */}
        <group position={markerPos}>
          {/* Core Pinpoint Dot */}
          <mesh>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>

          {/* Inner Golden Ring */}
          <mesh>
            <ringGeometry args={[0.045, 0.07, 32]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>

          {/* Outer Pulsing Wave Ring */}
          <mesh ref={pulseRingRef}>
            <ringGeometry args={[0.08, 0.11, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FallbackHorizonEarth({ lat, lng }: Props) {
  const earthRadius = 2.45;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.02);
  return (
    <group position={[0, -2.45, 0]}>
      <Sphere args={[earthRadius, 32, 32]}>
        <meshStandardMaterial color="#0f2b48" roughness={0.7} />
      </Sphere>
      <mesh position={markerPos}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
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
    <Canvas
      camera={{ position: [0, 0.45, 3.4], fov: 45 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 4, 3]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#38bdf8" />

      <Suspense fallback={<FallbackHorizonEarth lat={lat} lng={lng} weatherCondition={weatherCondition} />}>
        <PhotorealisticEarth lat={lat} lng={lng} weatherCondition={weatherCondition} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}
