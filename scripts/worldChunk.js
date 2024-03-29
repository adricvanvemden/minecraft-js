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

  constructor(size, params, dataStore) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.initialiseTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateTrees(rng);
    this.generateClouds(rng);
    this.loadPlayerChanges();
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
        let height = Math.floor(scaledNoise);

        // Clamp the height to the world's height
        height = Math.max(0, Math.min(height, this.size.height - 1));

        // Fill the terrain up to the height
        for (let y = 0; y <= this.size.height; y++) {
          // Determine the block type based on the height
          if (y <= this.params.terrain.waterHeight && y <= height) {
            this.setBlockId(x, y, z, blocks.sand.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  /**
   * Pulls any changes from the data store and applies them to the data model
   */
  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          // Overwrite with value in data store if it exists
          if (this.dataStore.contains(this.position.x, this.position.z, x, y, z)) {
            const blockId = this.dataStore.get(this.position.x, this.position.z, x, y, z);
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  /**
   * Populate the world with trees
   * @param {RNG} rng
   */
  generateTrees(rng) {
    const simplex = new SimplexNoise(rng);
    const canopySize = this.params.trees.canopy.size.max;
    for (let baseX = canopySize; baseX < this.size.width - canopySize; baseX++) {
      for (let baseZ = canopySize; baseZ < this.size.width - canopySize; baseZ++) {
        const n = simplex.noise(this.position.x + baseX, this.position.z + baseZ) * 0.5 + 0.5;
        if (n < 1 - this.params.trees.frequency) continue;

        // Find the grass tile
        for (let y = this.size.height - 1; y--; y >= 0) {
          if (this.getBlock(baseX, y, baseZ).id !== blocks.grass.id) continue;

          // We found grass, move one tile up
          const baseY = y + 1;

          // Create the trunk. First, determine the trunk height
          const minH = this.params.trees.trunk.height.min;
          const maxH = this.params.trees.trunk.height.max;
          const trunkHeight = Math.round(rng.random() * (maxH - minH)) + minH;
          const topY = baseY + trunkHeight;

          // Fill in the blocks for the trunk
          for (let y = baseY; y <= topY; y++) {
            this.setBlockId(baseX, y, baseZ, blocks.tree.id);
          }

          // Create the leaves. First, determine the canopy radius R
          const minR = this.params.trees.canopy.size.min;
          const maxR = this.params.trees.canopy.size.max;
          const R = Math.round(rng.random() * (maxR - minR)) + minR;

          for (let x = -R; x <= R; x++) {
            for (let y = -R; y <= R; y++) {
              for (let z = -R; z <= R; z++) {
                // Don't creates leaves outside the canopy radius
                if (x * x + y * y + z * z > R * R) continue;
                // Don't overwrite existing blocks
                if (this.getBlock(baseX + x, topY + y, baseZ + z)?.id !== blocks.empty.id) continue;
                // Add some randomness to break up the leaves a bit
                if (rng.random() > this.params.trees.canopy.density) {
                  this.setBlockId(baseX + x, topY + y, baseZ + z, blocks.leaves.id);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Creates happy little clouds
   * @param {RNG} rng
   */
  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale
          ) *
            0.5 +
          0.5;

        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
  }

  /**
   * Generates the 3D representation of the world
   */
  generateMeshes() {
    this.clear();
    this.generateWater();

    const maxCount = this.size.width * this.size.height * this.size.width;

    // Creata lookup table where the key is the block id and the value is the block type
    const meshes = {};

    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
        mesh.name = blockType.id;
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
   * Creates a plane of water
   */
  generateWater() {
    const waterMaterial = new THREE.MeshLambertMaterial({
      color: 0x9090e0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), waterMaterial);
    waterMesh.rotateX(-Math.PI / 2);
    waterMesh.position.set(this.size.width / 2, this.params.terrain.waterHeight + 0.4, this.size.width / 2);
    waterMesh.scale.set(this.size.width, this.size.width, 1);
    waterMesh.layers.set(1);

    this.add(waterMesh);
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
   * Adds a new block at (x,y,z) of type `blockId`
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, blockId) {
    // Safety check that we aren't adding a block for one that
    // already has an instance
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
    }
  }

  /**
   * Removes the block at the given coordinates
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
    }
  }

  /**
   * Create a new instance for the block at (x,y,z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // If this block is non-empty and does not already have an instance, create a new one
    if (block && block.id !== blocks.empty.id && block.instanceId === null) {
      // Append a new instance to the end of our InstancedMesh
      const mesh = this.children.find((instanceMesh) => instanceMesh.name === block.id);
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      // Update the appropriate instanced mesh
      // re-compute the bounding sphere so raycasting works
      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /**
   * Removes the mesh instance associated with the 'block' by swapping it
   * with the last instance and decrementing the count
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block.instanceId === null) return;

    const mesh = this.children.find((InstanceMesh) => InstanceMesh.name === block.id);
    const instanceId = block.instanceId;

    // Get the matrix of the last instance
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Update the block instance id of the last instance
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Swap the last instance with the instance to be deleted
    mesh.setMatrixAt(instanceId, lastMatrix);

    // Clear the last instance
    mesh.count--;

    // Mark the instance matrix as needing update
    // and update the bounding sphere for raycasting
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Clear the block data
    this.setBlockInstanceId(x, y, z, null);
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
