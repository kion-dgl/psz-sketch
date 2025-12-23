import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShadowWispParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function ShadowWispParticles({ intensity = 'light' }: ShadowWispParticlesProps) {
  const wispsRef = useRef<THREE.Points>(null);
  const orbsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const wispConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 400, speed: 0.3, opacity: 0.4, size: 0.18 };
      case 'heavy':
        return { count: 1200, speed: 0.5, opacity: 0.6, size: 0.25 };
      default:
        return { count: 700, speed: 0.4, opacity: 0.5, size: 0.2 };
    }
  }, [intensity]);

  const orbConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 60, opacity: 0.7, size: 0.12 };
      case 'heavy':
        return { count: 150, opacity: 0.85, size: 0.15 };
      default:
        return { count: 100, opacity: 0.8, size: 0.13 };
    }
  }, [intensity]);

  // Shadow wisp data - dark floating tendrils
  const wispData = useMemo(() => {
    const count = wispConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftOffsets = new Float32Array(count);
    const driftAmplitudes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Dark purple/black shadow colors
      const colorVariant = Math.random();
      if (colorVariant < 0.5) {
        // Deep purple shadow
        colors[i3] = 0.15 + Math.random() * 0.1;
        colors[i3 + 1] = 0.05 + Math.random() * 0.08;
        colors[i3 + 2] = 0.2 + Math.random() * 0.15;
      } else if (colorVariant < 0.8) {
        // Dark blue-black
        colors[i3] = 0.05 + Math.random() * 0.08;
        colors[i3 + 1] = 0.08 + Math.random() * 0.08;
        colors[i3 + 2] = 0.15 + Math.random() * 0.1;
      } else {
        // Pure dark
        const darkness = 0.05 + Math.random() * 0.1;
        colors[i3] = darkness;
        colors[i3 + 1] = darkness;
        colors[i3 + 2] = darkness + 0.02;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      driftAmplitudes[i] = 0.2 + Math.random() * 0.4;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    return { positions, colors, driftOffsets, driftAmplitudes, speeds };
  }, [wispConfig.count]);

  // Glowing orbs data - mystical shrine lights
  const orbData = useMemo(() => {
    const count = orbConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const pulsePhases = new Float32Array(count);
    const pulseSpeeds = new Float32Array(count);
    const orbitOffsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = 1 + Math.random() * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Ethereal colors - pale purple, ghostly blue, dim gold
      const colorVariant = Math.random();
      if (colorVariant < 0.4) {
        // Pale purple glow
        colors[i3] = 0.5 + Math.random() * 0.2;
        colors[i3 + 1] = 0.3 + Math.random() * 0.15;
        colors[i3 + 2] = 0.7 + Math.random() * 0.2;
      } else if (colorVariant < 0.7) {
        // Ghostly blue
        colors[i3] = 0.3 + Math.random() * 0.15;
        colors[i3 + 1] = 0.4 + Math.random() * 0.2;
        colors[i3 + 2] = 0.6 + Math.random() * 0.25;
      } else {
        // Dim gold/amber (shrine candles)
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.5 + Math.random() * 0.2;
        colors[i3 + 2] = 0.2 + Math.random() * 0.15;
      }

      pulsePhases[i] = Math.random() * Math.PI * 2;
      pulseSpeeds[i] = 0.5 + Math.random() * 1.5;
      orbitOffsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, pulsePhases, pulseSpeeds, orbitOffsets };
  }, [orbConfig.count]);

  useFrame((state, delta) => {
    timeRef.current += delta;

    // Animate shadow wisps - slow drifting motion
    if (wispsRef.current) {
      const positions = wispsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < wispConfig.count; i++) {
        const i3 = i * 3;

        // Slow sinuous movement
        const driftX = Math.sin(timeRef.current * 0.2 + wispData.driftOffsets[i]) *
                       Math.cos(timeRef.current * 0.15 + wispData.driftOffsets[i] * 0.7) *
                       wispData.driftAmplitudes[i] * delta * wispConfig.speed;
        const driftY = Math.sin(timeRef.current * 0.1 + wispData.driftOffsets[i] * 1.3) *
                       wispData.driftAmplitudes[i] * 0.3 * delta * wispConfig.speed;
        const driftZ = Math.cos(timeRef.current * 0.18 + wispData.driftOffsets[i] * 0.5) *
                       wispData.driftAmplitudes[i] * delta * wispConfig.speed;

        positions[i3] += driftX;
        positions[i3 + 1] += driftY;
        positions[i3 + 2] += driftZ;

        // Keep in bounds
        if (positions[i3 + 1] > 18) positions[i3 + 1] = 18;
        if (positions[i3 + 1] < 0.3) positions[i3 + 1] = 0.3;

        // Wrap around
        if (positions[i3] > 40) positions[i3] = -40;
        if (positions[i3] < -40) positions[i3] = 40;
        if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
        if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;
      }

      wispsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate glowing orbs - gentle floating with pulse
    if (orbsRef.current) {
      const positions = orbsRef.current.geometry.attributes.position.array as Float32Array;
      const colors = orbsRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < orbConfig.count; i++) {
        const i3 = i * 3;

        // Gentle orbital motion
        const orbitRadius = 0.02;
        const orbitX = Math.sin(timeRef.current * 0.3 + orbData.orbitOffsets[i]) * orbitRadius;
        const orbitY = Math.sin(timeRef.current * 0.2 + orbData.orbitOffsets[i] * 1.5) * orbitRadius * 0.5;
        const orbitZ = Math.cos(timeRef.current * 0.25 + orbData.orbitOffsets[i]) * orbitRadius;

        positions[i3] += orbitX;
        positions[i3 + 1] += orbitY;
        positions[i3 + 2] += orbitZ;

        // Pulse effect on colors
        const pulseValue = (Math.sin(timeRef.current * orbData.pulseSpeeds[i] + orbData.pulsePhases[i]) + 1) * 0.5;
        const brightness = 0.5 + pulseValue * 0.5;

        colors[i3] = orbData.colors[i3] * brightness;
        colors[i3 + 1] = orbData.colors[i3 + 1] * brightness;
        colors[i3 + 2] = orbData.colors[i3 + 2] * brightness;

        // Keep in bounds
        if (positions[i3 + 1] > 15) positions[i3 + 1] = 15;
        if (positions[i3 + 1] < 0.5) positions[i3 + 1] = 0.5;
      }

      orbsRef.current.geometry.attributes.position.needsUpdate = true;
      orbsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Shadow wisps - dark floating particles */}
      <points ref={wispsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={wispConfig.count}
            array={wispData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={wispConfig.count}
            array={wispData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={wispConfig.size}
          vertexColors
          transparent
          opacity={wispConfig.opacity}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Glowing orbs - mystical shrine lights */}
      <points ref={orbsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={orbConfig.count}
            array={orbData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={orbConfig.count}
            array={orbData.colors.slice()}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={orbConfig.size}
          vertexColors
          transparent
          opacity={orbConfig.opacity}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}
