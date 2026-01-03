/**
 * Material Conversion Utility
 *
 * NOTE: This utility is currently NOT USED because converting MeshBasicMaterial
 * to lit materials (MeshLambertMaterial/MeshStandardMaterial) causes texture
 * rendering issues with the GLB models in this project.
 *
 * The day/night effects are instead achieved through:
 * - Fog color and density changes
 * - Background color changes
 * - Particle effects (weather)
 *
 * This file is kept for future reference if a solution is found.
 */

import * as THREE from 'three';

export interface MaterialConversionOptions {
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
}

const defaultOptions: MaterialConversionOptions = {
  roughness: 0.85,
  metalness: 0.0,
  envMapIntensity: 0.3,
};

/**
 * EXPERIMENTAL: Convert MeshBasicMaterial to MeshLambertMaterial
 * WARNING: This currently causes black textures and is not used.
 */
export function convertToLitMaterials(
  scene: THREE.Object3D,
  _options: MaterialConversionOptions = {}
): void {
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      const convertedMaterials = materials.map((mat) => {
        if ((mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
          const basicMat = mat as THREE.MeshBasicMaterial;

          if (basicMat.map) {
            basicMat.map.colorSpace = THREE.SRGBColorSpace;
            basicMat.map.needsUpdate = true;
          }

          const lambertMat = new THREE.MeshLambertMaterial({
            map: basicMat.map,
            color: basicMat.color.clone(),
            transparent: basicMat.transparent,
            opacity: basicMat.opacity,
            alphaTest: basicMat.alphaTest,
            side: basicMat.side,
            vertexColors: basicMat.vertexColors,
          });

          lambertMat.name = basicMat.name;
          return lambertMat;
        }
        return mat;
      });

      mesh.material = Array.isArray(mesh.material) ? convertedMaterials : convertedMaterials[0];
    }
  });
}

/**
 * Apply a tint/color filter to all materials in a scene
 * Useful for day/night color grading without full lighting
 */
export function applyColorTint(
  scene: THREE.Object3D,
  tintColor: THREE.Color,
  intensity: number = 0.3
): void {
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        if ((mat as any).color) {
          (mat as any).color.lerp(tintColor, intensity);
        }
      });
    }
  });
}
