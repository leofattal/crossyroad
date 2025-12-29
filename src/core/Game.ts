import * as THREE from 'three';
import { Player } from '@/entities/Player';
import { GridManager, RowType } from '@/systems/GridManager';
import { ObstacleManager } from '@/systems/ObstacleManager';
import { InputManager } from '@/systems/InputManager';
import { ScoreManager } from '@/systems/ScoreManager';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: Player;
  private gridManager: GridManager;
  private obstacleManager: ObstacleManager;
  private inputManager: InputManager;
  private scoreManager: ScoreManager;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private gameApp: any; // Reference to the main app

  constructor(gameApp?: any) {
    this.gameApp = gameApp;
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50); // Add fog for depth

    // Setup camera (isometric view as per PRD)
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.setupCamera();

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Setup lighting
    this.setupLighting();

    // Initialize game systems
    this.gridManager = new GridManager(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene, this.gridManager);
    this.scoreManager = new ScoreManager();
    this.inputManager = new InputManager();

    // Create player
    this.player = new Player(this.scene, { x: 0, y: 0, z: 0 });

    // Sync row types from obstacle manager to grid manager
    this.syncRowTypes();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Setup input handlers
    this.setupInputHandlers();
  }

  private syncRowTypes(): void {
    // Sync initial rows
    for (let z = 0; z < 30; z++) {
      const obstacleRowType = this.obstacleManager.getRowType(z);
      let gridRowType: RowType;

      switch (obstacleRowType) {
        case 0: gridRowType = RowType.GRASS; break;
        case 1: gridRowType = RowType.ROAD; break;
        default: gridRowType = RowType.GRASS;
      }

      this.gridManager.setRowType(z, gridRowType);
    }
  }

  private setupCamera(): void {
    // Better isometric view - higher and further back for better visibility
    this.camera.position.set(0, 12, 8);
    this.camera.lookAt(0, 0, 2);
  }

  private setupLighting(): void {
    // Brighter ambient light for a cheerful look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffee, 1.0);
    directionalLight.position.set(8, 20, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    // Subtle fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-5, 10, -5);
    this.scene.add(fillLight);
  }

  private setupInputHandlers(): void {
    this.inputManager.on('forward', () => this.movePlayer(0, 1));
    this.inputManager.on('pause', () => this.togglePause());
  }

  private movePlayer(_dx: number, dz: number): void {
    if (!this.isRunning || this.player.isJumping()) return;

    // Player stays at x=0, only moves forward
    const newPosition = {
      x: 0,
      z: this.player.gridPosition.z + dz,
    };

    // Don't allow backward past start
    if (newPosition.z < 0) return;

    // Check collision BEFORE moving
    const collisionResult = this.obstacleManager.checkCollision(newPosition);

    if (collisionResult.collision) {
      // Hit a car or fell in water - game over!
      this.handlePlayerDeath();
      return;
    }

    // Attempt to move (always at x=0)
    const moved = this.player.move(0, dz);

    if (moved) {
      // Update score based on forward movement
      if (dz > 0) {
        this.scoreManager.addDistance(1);
      }

      // Update camera to follow player
      this.updateCamera();

      // Generate new rows as player progresses
      this.obstacleManager.updateObstacles(this.player.gridPosition.z);

      // Sync new row types to grid
      const obstacleRowType = this.obstacleManager.getRowType(this.player.gridPosition.z + 20);
      let gridRowType: RowType;
      switch (obstacleRowType) {
        case 0: gridRowType = RowType.GRASS; break;
        case 1: gridRowType = RowType.ROAD; break;
        default: gridRowType = RowType.GRASS;
      }
      this.gridManager.setRowType(this.player.gridPosition.z + 20, gridRowType);

      this.gridManager.updateChunks(this.player.gridPosition.z);
    }
  }

  private updateCamera(): void {
    // Camera follows player smoothly
    const targetX = this.player.gridPosition.x;
    const targetZ = this.player.gridPosition.z;

    // Smooth camera movement with lerp
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetZ + 8 - this.camera.position.z) * 0.1;

    // Look slightly ahead of the player
    const lookAtX = targetX;
    const lookAtZ = targetZ + 2;
    this.camera.lookAt(lookAtX, 0, lookAtZ);
  }

  private togglePause(): void {
    this.isRunning = !this.isRunning;
    // TODO: Show pause menu
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private gameLoop = (): void => {
    requestAnimationFrame(this.gameLoop);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.isRunning) {
      // Update game systems
      this.player.update(deltaTime);
      this.obstacleManager.update(deltaTime);

      // Check for collision with vehicles (continuous check)
      if (!this.player.isJumping()) {
        if (this.obstacleManager.checkPlayerCollision(this.player.gridPosition)) {
          this.handlePlayerDeath();
        }
      }
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  private handlePlayerDeath(): void {
    if (!this.isRunning) return; // Already dead

    this.isRunning = false;

    const finalScore = this.scoreManager.getTotalScore();
    const finalDistance = this.scoreManager.getDistance();

    console.log('Game Over! Score:', finalScore);
    console.log('Distance:', finalDistance);

    // Show death screen after a brief delay
    setTimeout(() => {
      if (this.gameApp) {
        this.gameApp.showDeathScreen(finalScore, finalDistance);
      }
    }, 500);
  }

  public getScore(): number {
    return this.scoreManager.getTotalScore();
  }

  public getDistance(): number {
    return this.scoreManager.getDistance();
  }

  public dispose(): void {
    // Stop the game loop
    this.isRunning = false;

    // Dispose of all game objects
    if (this.player) {
      this.player.dispose();
    }

    // Clear the scene
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    }

    // Dispose renderer and remove canvas
    if (this.renderer && this.renderer.domElement) {
      const canvas = this.renderer.domElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.renderer.dispose();
    }

    // Dispose input manager
    if (this.inputManager) {
      this.inputManager.dispose();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}
