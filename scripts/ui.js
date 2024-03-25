import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { blocks, resources } from './blocks';

export function createUI(scene, world, player, physics) {
  const gui = new GUI();

  const sceneFolder = gui.addFolder('Scene');
  sceneFolder.add(scene.fog, 'near', 1, 100).name('Fog Near');
  sceneFolder.add(scene.fog, 'far', 1, 100).name('Fog Far');

  const playerFolder = gui.addFolder('Player');
  playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed');
  playerFolder.add(player, 'jumpSpeed', 1, 10).name('Jump Speed');
  playerFolder.add(player.boundsHelper, 'visible').name('Show Player Bounds');
  playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');

  const physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(physics.helpers, 'visible').name('Visualize Collisions');
  physicsFolder.add(physics, 'simulationRate', 10, 1000).name('Sim Rate');

  const terrainFolder = gui.addFolder('Terrain');
  terrainFolder.add(world, 'asyncLoading').name('Async Loading');
  terrainFolder.add(world, 'drawDistance', 1, 12, 1).name('Draw Distance');
  terrainFolder.add(world.params, 'seed', 1, 10000).name('Seed');
  terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
  terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude');
  terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset');

  const cloudFolder = gui.addFolder('clouds');
  cloudFolder.add(world.params.clouds, 'density', 0, 1, 0.1).name('Density');
  cloudFolder.add(world.params.clouds, 'scale', 0, 100).name('Scale');

  const treesFolder = gui.addFolder('Trees');
  treesFolder.add(world.params.trees, 'frequency', 0, 0.1).name('Frequency');
  treesFolder.add(world.params.trees.trunk.height, 'min', 0, 10, 1).name('Min Trunk Height');
  treesFolder.add(world.params.trees.trunk.height, 'max', 0, 10, 1).name('Max Trunk Height');
  treesFolder.add(world.params.trees.canopy.size, 'min', 0, 10, 1).name('Min Canopy Size');
  treesFolder.add(world.params.trees.canopy.size, 'max', 0, 10, 1).name('Max Canopy Size');
  treesFolder.add(world.params.trees.canopy, 'density', 0, 1).name('Canopy Density');

  const resourcesFolder = gui.addFolder('Resources');

  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity');

    const scaleFolder = resourceFolder.addFolder('Scale');
    scaleFolder.add(resource.scale, 'x', 10, 100).name('X Scale');
    scaleFolder.add(resource.scale, 'y', 10, 100).name('Y Scale');
    scaleFolder.add(resource.scale, 'z', 10, 100).name('Z Scale');
  });

  gui.onChange(() => world.generate());
  // gui.add(world, 'generate');
}
