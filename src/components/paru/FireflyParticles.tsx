import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireflyParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function FireflyParticles({ intensity = 'light' }: FireflyParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 400, speed: 0.3, opacity: 0.9, size: 0.15 };
      case 'heavy':
        return { count: 1200, speed: 0.5, opacity: 0.95, size: 0.18 };
      default:
        return { count: 700, speed: 0.4, opacity: 0.92, size: 0.16 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Store particle data
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const driftAmplitudes = new Float32Array(particleCount);
    const blinkPhases = new Float32Array(particleCount);
    const blinkSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area - fireflies prefer mid-heights
      positions[i3] = (Math.random() - 0.5) * 80; // x
      positions[i3 + 1] = 0.5 + Math.random() * 8; // y (0.5-8.5 height, prefer lower areas)
      positions[i3 + 2] = (Math.random() - 0.5) * 80; // z

      // Color variation - yellow to green fireflies
      const colorVariant = Math.random();
      if (colorVariant < 0.5) {
        // Warm yellow-green
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.2 + Math.random() * 0.2;
      } else if (colorVariant < 0.8) {
        // Bright green
        colors[i3] = 0.4 + Math.random() * 0.2;
        colors[i3 + 1] = 0.95 + Math.random() * 0.05;
        colors[i3 + 2] = 0.3 + Math.random() * 0.2;
      } else {
        // Pale yellow
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.5 + Math.random() * 0.2;
      }

      // Random drift parameters - fireflies have erratic movement
      driftOffsets[i] = Math.random() * Math.PI * 2;
      driftAmplitudes[i] = 0.3 + Math.random() * 0.5;

      // Blinking parameters
      blinkPhases[i] = Math.random() * Math.PI * 2;
      blinkSpeeds[i] = 0.5 + Math.random() * 2.0; // Different blink rates
    }

    return { positions, colors, driftOffsets, driftAmplitudes, blinkPhases, blinkSpeeds };
  }, [particleCount]);

  // Create a custom shader material for blinking effect
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: config.size,
      vertexColors: true,
      transparent: true,
      opacity: config.opacity,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [config.size, config.opacity]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Fireflies have erratic, wandering movement
      const wanderX = Math.sin(timeRef.current * 0.5 + particleData.driftOffsets[i]) *
                      Math.cos(timeRef.current * 0.3 + particleData.driftOffsets[i] * 0.7) *
                      particleData.driftAmplitudes[i] * delta * config.speed;
      const wanderY = Math.sin(timeRef.current * 0.4 + particleData.driftOffsets[i] * 1.3) *
                      particleData.driftAmplitudes[i] * 0.3 * delta * config.speed;
      const wanderZ = Math.cos(timeRef.current * 0.6 + particleData.driftOffsets[i] * 0.5) *
                      Math.sin(timeRef.current * 0.25 + particleData.driftOffsets[i]) *
                      particleData.driftAmplitudes[i] * delta * config.speed;

      positions[i3] += wanderX;
      positions[i3 + 1] += wanderY;
      positions[i3 + 2] += wanderZ;

      // Keep fireflies in preferred height range (0.5-10)
      if (positions[i3 + 1] > 10) {
        positions[i3 + 1] = 10;
      } else if (positions[i3 + 1] < 0.5) {
        positions[i3 + 1] = 0.5;
      }

      // Wrap around horizontally
      if (positions[i3] > 40) positions[i3] = -40;
      if (positions[i3] < -40) positions[i3] = 40;
      if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
      if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;

      // Blinking effect - modulate color brightness
      const blinkValue = (Math.sin(timeRef.current * particleData.blinkSpeeds[i] + particleData.blinkPhases[i]) + 1) * 0.5;
      const brightness = 0.3 + blinkValue * 0.7; // Range from 0.3 to 1.0

      // Apply blink to colors (store original colors and modulate)
      const baseR = particleData.colors[i3];
      const baseG = particleData.colors[i3 + 1];
      const baseB = particleData.colors[i3 + 2];

      colors[i3] = baseR * brightness;
      colors[i3 + 1] = baseG * brightness;
      colors[i3 + 2] = baseB * brightness;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particleData.colors}
          itemSize={3}
        />
      </bufferGeometry>
    </points>
  );
}
