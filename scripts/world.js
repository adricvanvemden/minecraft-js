import * as THREE from 'three';
import { WorldChunk } from './worldChunk';

export class World extends THREE.Group {
  asyncLoading = true;

  // Distance from the player at which chunks are loaded
  drawDistance = 2;

  chunkSize = { width: 16, height: 16 };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2,
    },
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunks();
    for (let x = -this.drawDistance; x < this.drawDistance; x++) {
      for (let z = -this.drawDistance; z < this.drawDistance; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.generate();
        chunk.userData = { x, z };
        this.add(chunk);
      }
    }
  }

  /**
   * Updates the visible parts of the world based on the player position
   * @param {Player} player
   */
  update(player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    const chuncksToRemove = this.getChunksToRemove(visibleChunks);

    chuncksToRemove.forEach((chunk) => {
      chunk.disposeInstances();
      this.remove(chunk);
    });

    chunksToAdd.forEach((chunk) => {
      this.generateChunk(chunk.x, chunk.z);
    });
  }

  /**
   * Returns array containing the coords of the chunks that are visible
   * @param {Player} player
   * @returns {{x: number, z: number}[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];

    const { chunk } = this.worldToChunkCoords(player.position.x, player.position.y, player.position.z);

    for (let x = chunk.x - this.drawDistance; x <= chunk.x + this.drawDistance; x++) {
      for (let z = chunk.z - this.drawDistance; z <= chunk.z + this.drawDistance; z++) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns array containing the coords of the chunks that are not loaded yet and need to be added
   * @param {{x: number, z: number}[]} visibleChunks
   * @returns {{x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    //filter out the chunks that are already loaded
    return visibleChunks.filter((chunk) => {
      const exists = this.children.map((c) => c.userData).find(({ x, z }) => x === chunk.x && z === chunk.z);
      return !exists;
    });
  }

  /**
   * Returns array containing the coords of the chunks that are loaded but not visible anymore
   * @param {{x: number, z: number}[]} visibleChunks
   * @returns {{x: number, z: number}[]}
   * */
  getChunksToRemove(visibleChunks) {
    //filter out the chunks that are not visible anymore
    return this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      return !visibleChunks.find((visibleChunk) => x === visibleChunk.x && z === visibleChunk.z);
    });
  }

  /**
   * Generates the chunk at the given coords
   * @param {number} x
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    chunk.userData = { x, z };
    this.add(chunk);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock(x, y, z) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    return chunkObj && chunkObj.loaded ? chunkObj.getBlock(block.x, block.y, block.z) : null;
  }

  /**
   * Returns the coordinates of the block at (x, y, z)
   * - chunk is the coordinates of the chunk containing the block
   * - block is the coordinates of the block within the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{chunk: {x: number, z: number}, block: {x: number, y:number, z: number}}}
   */
  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y: y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return { chunk: chunkCoords, block: blockCoords };
  }

  /**
   * Returns the WorldChunk object at given coords
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => {
      const { x, z } = chunk.userData;
      return x === chunkX && z === chunkZ;
    });
  }

  /**
   * Clears the meshes from the scene
   */
  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  /**
   * Removes the block at the given coordinates
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);
    }
  }
}