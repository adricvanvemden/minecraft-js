import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { blocks } from './blocks';

const CENTER_SCREEN = new THREE.Vector2();
export class Player {
  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;
  jumpSpeed = 10;
  onGround = false;

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);

  velocity = new THREE.Vector3();
  _worldVelocity = new THREE.Vector3();
  input = new THREE.Vector3();

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords = null;
  activeBlockid = blocks.empty.id;

  constructor(scene) {
    this.keyState = {};
    this.position.set(32, 32, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 32),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    scene.add(this.boundsHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    // Helper used to highlight the currently active block
    const selectionMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 });
    const selectionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
  }

  /**
   * Updates the state of the player
   * @param {Number} dt
   */
  applyInputs(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;
    }

    document.getElementById('info-player-position').innerHTML = this.toString();
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * Returns the current world position of the player
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this._worldVelocity.copy(this.velocity);
    this._worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this._worldVelocity;
  }

  /**
   * Updates the state of the player
   * @param {World} world
   */
  updatePlayer(world) {
    this.updateBoundsHelper();
    this.updateRaycaster(world);
  }

  /**
   * Updates the raycaster used for block selection
   *  @param {World} world
   */
  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get the position of the chunk that the intersected block belongs to
      const chunck = intersection.object.parent;

      // Get tranform matrix of the intersected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      // Extract the block position from the matrix and set it as the selected coords
      this.selectedCoords = chunck.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        // If we are adding a block, move it 1 block over in the direction
        // of where the ray intersected the cube
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  onKeyDown(event) {
    this.keyState[event.code] = true;

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        this.activeBlockId = Number(event.key);
        console.log(`activeBlockId = ${event.key}`);
        break;
    }
  }

  onKeyUp(event) {
    this.keyState[event.code] = false;

    switch (event.code) {
      case 'F2':
        if (this.controls.isLocked) {
          console.log('unlocking controls');
          this.controls.unlock();
          document.getElementById('info-how-to').style.display = 'block';
        } else {
          console.log('locking controls');
          this.controls.lock();
          document.getElementById('info-how-to').style.display = 'none';
        }
        break;
    }
  }

  update() {
    let speed = this.maxSpeed;

    if (this.keyState['ShiftLeft'] || this.keyState['ShiftRight']) {
      speed *= 2;
    }

    if (this.keyState['KeyW']) this.input.z = speed;
    else if (this.keyState['KeyS']) this.input.z = -speed;
    else this.input.z = 0;

    if (this.keyState['KeyA']) this.input.x = -speed;
    else if (this.keyState['KeyD']) this.input.x = speed;
    else this.input.x = 0;

    if (this.keyState['KeyR'] && !this.repeat) {
      this.position.set(32, 10, 32);
      this.velocity.set(0, 0, 0);
    }

    if (this.keyState['Space'] && this.onGround) {
      this.velocity.y += this.jumpSpeed;
    }
  }

  /**
   * Returns player position in a readable string form
   * @returns {string}
   */
  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}