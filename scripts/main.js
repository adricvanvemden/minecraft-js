
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world.js';
import { createUI } from './ui.js';
import { Player } from './player.js';
import { Physics } from './physics.js';
import { blocks } from './blocks';

const stats = new Stats();
document.body.appendChild(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const fov = 75;
const orbitcamera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight);
orbitcamera.position.set(32, 16, 32);

const controls = new OrbitControls(orbitcamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// Scene setup
const scene = new THREE.Scene();

scene.fog = new THREE.Fog(0x80a0e0, 50, 100);
const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene);

const physics = new Physics(scene);

const sun = new THREE.DirectionalLight();

function setupLights() {
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0005;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(sun);
  scene.add(sun.target);

  // const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHelper);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
}

/**
 * Event handler for 'mousedown' event
 * @param {MouseEvent} event
 */
function onMouseDown(event) {
  if (player.controls.isLocked && player.selectedCoords) {
    if (player.activeBlockId !== blocks.empty.id) {
      world.addBlock(player.selectedCoords.x, player.selectedCoords.y, player.selectedCoords.z, player.activeBlockId);
    } else {
      world.removeBlock(player.selectedCoords.x, player.selectedCoords.y, player.selectedCoords.z);
    }
  }
}
document.addEventListener('mousedown', onMouseDown);

// Render loop
let previousTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  if (player.controls.isLocked) {
    player.updatePlayer(world);
    physics.update(dt, player, world);
    world.update(player);

    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);
  }

  renderer.render(scene, player.controls.isLocked ? player.camera : orbitcamera);
  stats.update();

  previousTime = currentTime;
}

window.addEventListener('resize', () => {
  orbitcamera.aspect = window.innerWidth / window.innerHeight;
  orbitcamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

createUI(scene, world, player, physics);
setupLights();
animate();