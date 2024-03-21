import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './rng';
import { blocks, resources } from './blocks';

const geometry = new THREE.BoxGeometry();

export class WorldChunk extends THREE.Group {
  /**
   * @type {{
   *  id: number
   *  instanceId: number
   * }[][][]}
   */
  data = [];

  constructor(size, params) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.initialiseTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();
    this.loaded = true;
  }

  /**
   * Initialising the world terrain data
   */
  initialiseTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({ id: blocks.empty.id, instanceId: null });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /**
   * Generates the world resources
   */
  generateResources(rng) {
    const simplexNoise = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplexNoise.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  /**
   * Generates the world terrain data
   */
  generateTerrain(rng) {
    const simplexNoise = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // Compute the noise value for the current (x, z) coordinates
        const value = simplexNoise.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        // Scale the noise based on the magnitude and offset
        const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;

        // Compute the height of the terrain at (x, z) based on the scaled noise
        let height = Math.floor(this.size.height * scaledNoise);

        // Clamp the height to the world's height
        height = Math.max(0, Math.min(height, this.size.height - 1));

        // Fill the terrain up to the height
        for (let y = 0; y <= this.size.height; y++) {
          // Determine the block type based on the height
          if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  /**
   * Generates the 3D representation of the world
   */
  generateMeshes() {
    this.clear();

    const maxCount = this.size.width * this.size.height * this.size.width;

    // Creata lookup table where the key is the block id and the value is the block type
    const meshes = {};

    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
        mesh.name = blockType.name;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;

          if (blockId === blocks.empty.id) continue;

          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }
    this.add(...Object.values(meshes));
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number}}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * Sets the block instance id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (x >= 0 && x < this.size.width && y >= 0 && y < this.size.height && z >= 0 && z < this.size.width) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns true if this block is completely hidden by other blocks
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  isBlockObscured(x, y, z) {
    const directions = [
      [0, 1, 0], // up
      [0, -1, 0], // down
      [1, 0, 0], // left
      [-1, 0, 0], // right
      [0, 0, 1], // forward
      [0, 0, -1], // back
    ];

    for (let i = 0; i < directions.length; i++) {
      const [dx, dy, dz] = directions[i];
      const block = this.getBlock(x + dx, y + dy, z + dz)?.id ?? blocks.empty.id;
      if (block === blocks.empty.id) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clears the meshes from the scene
   */
  disposeInstances() {
    this.traverse((child) => {
      if (child.dispose) {
        child.dispose();
      }
    });
    this.clear();
  }
}
