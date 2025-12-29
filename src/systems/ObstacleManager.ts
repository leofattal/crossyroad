import * as THREE from 'three';
import { GridManager } from './GridManager';

export interface GridPosition {
  x: number;
  z: number;
}

enum RowType {
  GRASS,
  ROAD,
}

interface RowData {
  type: RowType;
  z: number;
  direction?: number; // -1 for left, 1 for right
}

interface Vehicle {
  mesh: THREE.Group;
  gridX: number;
  gridZ: number;
  speed: number;
  direction: number;
  length: number;
}

export class ObstacleManager {
  private scene: THREE.Scene;
  private rows: Map<number, RowData> = new Map();
  private vehicles: Vehicle[] = [];
  private lastGeneratedRow: number = 0;

  constructor(scene: THREE.Scene, _gridManager: GridManager) {
    this.scene = scene;

    // Generate initial rows
    for (let z = 0; z < 30; z++) {
      this.generateRow(z);
    }
  }

  private generateRow(z: number): void {
    if (this.rows.has(z)) return;

    let type: RowType;

    // First few rows are always grass (tutorial zone)
    if (z < 3) {
      type = RowType.GRASS;
    } else {
      // 50% chance of road
      type = Math.random() < 0.5 ? RowType.GRASS : RowType.ROAD;
    }

    const direction = Math.random() < 0.5 ? -1 : 1;
    this.rows.set(z, { type, z, direction });

    // Spawn obstacles based on type
    if (type === RowType.ROAD) {
      this.spawnVehiclesOnRow(z, direction);
    }

    this.lastGeneratedRow = Math.max(this.lastGeneratedRow, z);
  }

  private spawnVehiclesOnRow(z: number, direction: number): void {
    // Spawn 2-4 vehicles per row with better spacing
    const numVehicles = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numVehicles; i++) {
      // Better spacing - ensure gaps for player to pass through
      const spacing = 20 / numVehicles;
      const offset = Math.random() * 2 - 1; // Small random offset
      const startX = direction > 0
        ? -12 - (i * spacing) + offset
        : 12 + (i * spacing) + offset;

      // Varied speeds for more dynamic gameplay
      const speed = 1.2 + Math.random() * 2.0; // 1.2 to 3.2 units per second

      // More variety in vehicle types
      const rand = Math.random();
      let vehicleType: string;
      if (rand < 0.5) {
        vehicleType = 'car';
      } else if (rand < 0.8) {
        vehicleType = 'truck';
      } else {
        vehicleType = 'fast';
      }

      const length = vehicleType === 'car' ? 1.6 : vehicleType === 'truck' ? 2.4 : 1.4;

      const vehicle: Vehicle = {
        mesh: this.createVehicleMesh(vehicleType, direction),
        gridX: startX,
        gridZ: z,
        speed,
        direction,
        length,
      };

      vehicle.mesh.position.set(startX, 0.3, z);
      this.scene.add(vehicle.mesh);
      this.vehicles.push(vehicle);
    }
  }

  private createVehicleMesh(type: string, direction: number): THREE.Group {
    const group = new THREE.Group();

    let length: number, width: number, height: number;

    if (type === 'car') {
      length = 1.6;
      width = 0.8;
      height = 0.6;
    } else if (type === 'truck') {
      length = 2.4;
      width = 0.9;
      height = 0.8;
    } else {
      // Fast car - sporty and smaller
      length = 1.4;
      width = 0.7;
      height = 0.5;
    }

    // Car body with more vibrant colors
    const bodyGeometry = new THREE.BoxGeometry(width, height, length);
    const colors = [
      0xff3333, // Bright red
      0x3366ff, // Bright blue
      0x33ff33, // Bright green
      0xffcc00, // Orange-yellow
      0xff33ff, // Magenta
      0x00ffff, // Cyan
      0xff6633, // Orange
      0x9933ff, // Purple
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      metalness: 0.3,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Windshield/cabin
    const cabinGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.7, length * 0.45);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: type === 'fast' ? 0x111111 : 0x333333,
      flatShading: true,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = height * 0.65;
    cabin.position.z = type === 'truck' ? -length * 0.05 : length * 0.1;
    group.add(cabin);

    // Wheels
    const wheelGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      flatShading: true,
    });

    const wheelPositions = [
      [-width * 0.5, -height * 0.35, length * 0.35],
      [width * 0.5, -height * 0.35, length * 0.35],
      [-width * 0.5, -height * 0.35, -length * 0.35],
      [width * 0.5, -height * 0.35, -length * 0.35],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    // Rotate to face perpendicular to the road (traveling left/right)
    // 90 degrees rotation so cars move sideways across the grid
    if (direction > 0) {
      // Moving right
      group.rotation.y = Math.PI / 2;
    } else {
      // Moving left
      group.rotation.y = -Math.PI / 2;
    }

    return group;
  }

  public updateObstacles(playerZ: number): void {
    // Generate rows ahead of player
    const endRow = Math.floor(playerZ) + 30;
    for (let z = this.lastGeneratedRow + 1; z <= endRow; z++) {
      this.generateRow(z);
    }

    // Clean up rows far behind player
    const minRow = Math.floor(playerZ) - 20;
    const rowsToRemove: number[] = [];

    this.rows.forEach((_row, z) => {
      if (z < minRow) {
        rowsToRemove.push(z);
      }
    });

    rowsToRemove.forEach(z => this.rows.delete(z));
  }

  public update(deltaTime: number): void {
    // Update vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      vehicle.gridX += vehicle.direction * vehicle.speed * deltaTime;
      vehicle.mesh.position.x = vehicle.gridX;

      // Remove vehicles that are too far off screen
      if (Math.abs(vehicle.gridX) > 20) {
        this.scene.remove(vehicle.mesh);
        vehicle.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        this.vehicles.splice(i, 1);
      }
    }
  }

  public checkCollision(position: GridPosition): { collision: boolean; onLog: boolean; logVelocity?: number } {
    const row = this.rows.get(position.z);
    if (!row) return { collision: false, onLog: false };

    if (row.type === RowType.ROAD) {
      // Check collision with vehicles
      for (const vehicle of this.vehicles) {
        if (Math.abs(vehicle.gridZ - position.z) < 0.5) {
          const halfLength = vehicle.length / 2;
          // Check if player at x=0 collides with vehicle
          if (position.x >= vehicle.gridX - halfLength - 0.4 &&
              position.x <= vehicle.gridX + halfLength + 0.4) {
            return { collision: true, onLog: false };
          }
        }
      }
    }

    return { collision: false, onLog: false };
  }

  public checkPlayerCollision(position: GridPosition): boolean {
    const result = this.checkCollision(position);
    return result.collision;
  }

  public getRowType(z: number): number {
    const row = this.rows.get(z);
    return row ? row.type : RowType.GRASS;
  }

  public isOnLog(_position: GridPosition): { onLog: boolean; velocity: number } {
    return { onLog: false, velocity: 0 };
  }
}
