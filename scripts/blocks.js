import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(url) {
    const texture = textureLoader.load(`/minecraft-js/${url}`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

const textures = {
  dirt: loadTexture('textures/blocks/dirt.png'),
  grass: loadTexture('textures/blocks/grass.png'),
  grassSide: loadTexture('textures/blocks/grass_side.png'),
  stone: loadTexture('textures/blocks/stone.png'),
  coalOre: loadTexture('textures/blocks/coal_ore.png'),
  ironOre: loadTexture('textures/blocks/iron_ore.png'),
  leaves: loadTexture('textures/blocks/leaves.png'),
  treeSide: loadTexture('textures/blocks/tree_side.png'),
  treeTop: loadTexture('textures/blocks/tree_top.png'),
  sand: loadTexture('textures/blocks/sand.png'),
};

export const blocks = {
  empty: {
    id: 0,
    name: 'Empty',
  },
  grass: {
    id: 1,
    name: 'Grass',
    color: 0x559020,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Left
      new THREE.MeshLambertMaterial({ map: textures.grass }), // Top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // Bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Front
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // Back
    ],
  },
  dirt: {
    id: 2,
    name: 'Dirt',
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }), // all sides
  },
  stone: {
    id: 3,
    name: 'Stone',
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
  },
  coalOre: {
    id: 4,
    name: 'Coal Ore',
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
  },
  ironOre: {
    id: 5,
    name: 'Iron Ore',
    color: 0x909000,
    scale: { x: 60, y: 60, z: 60 },
    scarcity: 0.9,
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
  },
  leaves: {
    id: 6,
    name: 'Leaves',
    color: 0x559020,
    material: new THREE.MeshLambertMaterial({ map: textures.leaves }),
  },
  tree: {
    id: 7,
    name: 'Tree',
    color: 0x805020,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Right
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Left
      new THREE.MeshLambertMaterial({ map: textures.treeTop }), // Top
      new THREE.MeshLambertMaterial({ map: textures.treeTop }), // Bottom
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Front
      new THREE.MeshLambertMaterial({ map: textures.treeSide }), // Back
    ],
  },
  sand: {
    id: 8,
    name: 'Sand',
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.sand }), // all sides
  },
  cloud: {
    id: 9,
    name: 'Cloud',
    color: 0xffffff,
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
};

export const resources = [
    blocks.stone,
    blocks.coalOre,
    blocks.ironOre
]