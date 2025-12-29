import * as THREE from 'three';

export interface GridPosition {
  x: number;
  z: number;
}

export class Player {
  public mesh: THREE.Group;
  public gridPosition: GridPosition & { y: number };
  private scene: THREE.Scene;
  private isMoving: boolean = false;
  private targetPosition: THREE.Vector3;
  private jumpProgress: number = 0;
  private jumpDuration: number = 0.2; // 200ms as per PRD
  private jumpHeight: number = 1.2;

  constructor(scene: THREE.Scene, startPos: { x: number; y: number; z: number }) {
    this.scene = scene;
    this.gridPosition = { ...startPos };
    this.targetPosition = new THREE.Vector3(startPos.x, startPos.y, startPos.z);

    // Create chicken character
    this.mesh = this.createChickenMesh();
    this.mesh.position.set(startPos.x, startPos.y, startPos.z);
    this.scene.add(this.mesh);
  }

  private createChickenMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body (white, slightly elongated)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      metalness: 0.1,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.35;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (white, smaller cube on top)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.95;
    head.castShadow = true;
    group.add(head);

    // Beak (orange/yellow, small cone-like shape)
    const beakGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      flatShading: true,
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.95, 0.35);
    group.add(beak);

    // Comb on top (red)
    const combGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const combMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      flatShading: true,
    });
    const comb = new THREE.Mesh(combGeometry, combMaterial);
    comb.position.set(0, 1.3, 0);
    group.add(comb);

    // Eyes (two small black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      flatShading: true,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.0, 0.22);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.0, 0.22);
    group.add(rightEye);

    // Legs (orange, thin rectangles)
    const legGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      flatShading: true,
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
  }

  public move(dx: number, dz: number): boolean {
    if (this.isMoving) return false; // Can't move while already moving

    // Update grid position
    this.gridPosition.x += dx;
    this.gridPosition.z += dz;

    // Set target for smooth animation
    this.targetPosition.set(
      this.gridPosition.x,
      this.gridPosition.y,
      this.gridPosition.z
    );

    this.isMoving = true;
    this.jumpProgress = 0;

    return true; // Movement initiated
  }

  public update(deltaTime: number): void {
    if (this.isMoving) {
      // Update jump progress
      this.jumpProgress += deltaTime / this.jumpDuration;

      if (this.jumpProgress >= 1.0) {
        // Jump complete
        this.mesh.position.set(
          this.targetPosition.x,
          this.gridPosition.y,
          this.targetPosition.z
        );
        this.isMoving = false;
        this.jumpProgress = 1.0;
      } else {
        // Smooth jump animation using easing
        const t = this.jumpProgress;

        // Linear movement in X and Z
        this.mesh.position.x = THREE.MathUtils.lerp(
          this.mesh.position.x,
          this.targetPosition.x,
          t * 5 * deltaTime
        );

        this.mesh.position.z = THREE.MathUtils.lerp(
          this.mesh.position.z,
          this.targetPosition.z,
          t * 5 * deltaTime
        );

        // Parabolic arc for jump (Y axis)
        const jumpArc = Math.sin(t * Math.PI);
        this.mesh.position.y = this.gridPosition.y + jumpArc * this.jumpHeight;

        // Slight tilt forward during jump
        this.mesh.rotation.x = Math.sin(t * Math.PI) * 0.3;
      }
    } else {
      // Idle animation - subtle bobbing
      const time = Date.now() * 0.001;
      this.mesh.position.y = this.gridPosition.y + Math.sin(time * 3) * 0.03;
      this.mesh.rotation.x = 0;
    }
  }

  public isJumping(): boolean {
    return this.isMoving;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.gridPosition = { x, y, z };
    this.targetPosition.set(x, y, z);
    this.mesh.position.set(x, y, z);
    this.isMoving = false;
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
