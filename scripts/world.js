import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './rng';
import { blocks } from './blocks';

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial();

export class World extends THREE.Group {
    /**
     * @type {{
     *  id: number
     *  instanceId: number
     * }[][][]}
    */
    data = [];

    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 0.5,
            offset: 0.2
        }
    };



    constructor(size = { width: 64, height: 32 }) {
        super();
        this.size = size;
    }

    generate() {
        this.initialiseTerrain();
        this.generateTerrain();
        this.generateMeshes();
    }

    /**
     * Initialising the world terrain data
    */
    initialiseTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = []
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
     * Generates the world terrain data
    */
    generateTerrain() {
        const rng = new RNG(this.params.seed);
        const simplexNoise = new SimplexNoise(rng);

        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {

                // Compute the noise value for the current (x, z) coordinates
                const value = simplexNoise.noise(x / this.params.terrain.scale, z / this.params.terrain.scale);

                // Scale the noise based on the magnitude and offset
                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;

                // Compute the height of the terrain at (x, z) based on the scaled noise
                let height = Math.floor(this.size.height * scaledNoise);

                // Clamp the height to the world's height
                height = Math.max(0, Math.min(height, this.size.height - 1));

                // Fill the terrain up to the height
                for (let y = 0; y <= this.size.height; y++) {

                    // Determine the block type based on the height
                    if (y < height) {
                        this.setBlockId(x, y, z, blocks.dirt.id)
                    } else if (y === height) {
                        this.setBlockId(x, y, z, blocks.grass.id)
                    } else {
                        this.setBlockId(x, y, z, blocks.empty.id)
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
        const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
        mesh.count = 0;

        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id;
                    const blockType = Object.values(blocks).find(block => block.id === blockId);
                    const instanceId = mesh.count;

                    if (blockId !== blocks.empty.id && !this.isBlockObscured(x, y, z)) {
                        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
                        mesh.setMatrixAt(instanceId, matrix);
                        mesh.setColorAt(instanceId, new THREE.Color(blockType.color));
                        this.setBlockInstanceId(x, y, z, instanceId);
                        mesh.count++;
                    }
                }
            }
        }
        this.add(mesh)
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
        if (x >= 0 && x < this.size.width &&
            y >= 0 && y < this.size.height &&
            z >= 0 && z < this.size.width) {
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
            [ -1, 0, 0], // right
            [0, 0, 1], // forward
            [0, 0, -1] // back
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
}