import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, useTexture, Html } from "@react-three/drei";
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

function PhotorealisticEarth({ lat, lng, weatherCondition, cityName, onSelectLocation }: Props) {
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

  const cloudOpacity = useMemo(() => {
    if (weatherCondition === "rainy") return 0.65;
    if (weatherCondition === "cloudy") return 0.45;
    return 0.28;
  }, [weatherCondition]);

  // Target Euler rotation angles: exactly align (lat, lng) to face camera (+Z axis)
  const { targetRotX, targetRotY } = useMemo(() => {
    const radLat = (lat * Math.PI) / 180;
    const radLng = (lng * Math.PI) / 180;

    // Y rotation aligns longitude to face camera (+Z)
    const rotY = -radLng - Math.PI / 2;
    // X rotation tilts latitude to center in front of camera
    const rotX = radLat - 0.15;

    return { targetRotX: rotX, targetRotY: rotY };
  }, [lat, lng]);

  // Trigger Google Earth fly-to transition whenever coords change
  useEffect(() => {
    if (prevCoordsRef.current.lat !== lat || prevCoordsRef.current.lng !== lng) {
      flyToTimeRemainingRef.current = 2.2; // 2.2s smooth fly-to transition
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
      const scale1 = 0.8 + phase1 * 0.9;
      rippleRing1Ref.current.scale.set(scale1, scale1, scale1);
      (rippleRing1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - phase1));
    }
    if (rippleRing2Ref.current) {
      const phase2 = ((elapsed * 2.2) + 0.5) % 1;
      const scale2 = 0.8 + phase2 * 0.9;
      rippleRing2Ref.current.scale.set(scale2, scale2, scale2);
      (rippleRing2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - phase2));
    }
  });

  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.03);

  // Laser beacon beam direction
  const beamDir = markerPos.clone().normalize();
  const beamHeight = 0.28;
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
      {/* Atmosphere Outer Glow Halo */}
      <Sphere args={[earthRadius * 1.05, 64, 64]}>
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

        {/* Vertical Holographic Atmospheric Laser Light Beam */}
        <mesh position={beamCenter} quaternion={beamQuaternion}>
          <cylinderGeometry args={[0.006, 0.016, beamHeight, 16]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* Location Pin Marker & Interactive District Map Trigger */}
        <group position={markerPos}>
          {/* Outer Concentric Holographic Radar Wave 1 */}
          <mesh ref={rippleRing1Ref}>
            <ringGeometry args={[0.07, 0.12, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>

          {/* Outer Concentric Holographic Radar Wave 2 */}
          <mesh ref={rippleRing2Ref}>
            <ringGeometry args={[0.11, 0.16, 32]} />
            <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>

          {/* Inner Golden Target Ring */}
          <mesh>
            <ringGeometry args={[0.035, 0.065, 32]} />
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
            <sphereGeometry args={[0.05, 24, 24]} />
            <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>

          {/* Sleek 3D Floating District Overview Badge */}
          <Html position={[0, 0.2, 0]} center distanceFactor={7}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectLocation?.();
              }}
              title="Click to view full District Satellite & Radar Map"
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-yellow-400/70 shadow-[0_0_25px_rgba(250,204,21,0.5)] text-white font-sans text-xs hover:scale-105 hover:border-yellow-300 hover:bg-black transition-all duration-200 select-none whitespace-nowrap animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-yellow-300 text-[11px] leading-tight font-heading">
                  {cityName || "Active District"}
                </span>
                <span className="text-[9px] text-cyan-300 font-sans tracking-wide">
                  🗺️ Tap for District Map
                </span>
              </div>
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

function FallbackHorizonEarth({ lat, lng }: Props) {
  const earthRadius = 2.05;
  const markerPos = latLngToVector3(lat, lng, earthRadius + 0.03);
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
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 4, 3]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.7} color="#38bdf8" />

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
