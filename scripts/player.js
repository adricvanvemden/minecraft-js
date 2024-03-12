import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    height = 1.75;
    radius = 0.5;
    maxSpeed = 5;
    jumpSpeed = 10;
    onGround = false

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraHelper = new THREE.CameraHelper(this.camera);
    controls = new PointerLockControls(this.camera, document.body);

    velocity = new THREE.Vector3();
    _worldVelocity = new THREE.Vector3()
    input = new THREE.Vector3();

    constructor(scene) {
        this.keyState = {};
        this.position.set(32, 10, 32);
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
        this.boundsHelper.position.copy(this.camera.position);
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
     * Applies a change in velocity 'dv' that is specified in the world frame
     * @param {THREE.Vector3} dv 
     */
    applyWorldDeltaVelocity(dv) {
        dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
        this.velocity.add(dv);
    }



    onKeyDown(event) {
        this.keyState[event.code] = true;
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
        if (this.keyState['KeyW']) this.input.z = this.maxSpeed;
        else if (this.keyState['KeyS']) this.input.z = -this.maxSpeed;
        else this.input.z = 0;

        if (this.keyState['KeyA']) this.input.x = -this.maxSpeed;
        else if (this.keyState['KeyD']) this.input.x = this.maxSpeed;
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