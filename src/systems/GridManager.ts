import * as THREE from 'three';

export enum RowType {
  GRASS = 0,
  ROAD = 1,
}

export class GridManager {
  private scene: THREE.Scene;
  private chunkSize: number = 20;
  private visibleChunks: Map<number, THREE.Group> = new Map();
  private gridSpacing: number = 1;
  private rowTypes: Map<number, RowType> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateInitialChunks();
  }

  public setRowType(z: number, type: RowType): void {
    this.rowTypes.set(z, type);
  }

  public getRowType(z: number): RowType {
    return this.rowTypes.get(z) || RowType.GRASS;
  }

  private generateInitialChunks(): void {
    for (let i = 0; i < 3; i++) {
      this.generateChunk(i);
    }
  }

  private generateChunk(chunkIndex: number): void {
    if (this.visibleChunks.has(chunkIndex)) return;

    const chunk = new THREE.Group();
    const startZ = chunkIndex * this.chunkSize;

    for (let z = 0; z < this.chunkSize; z++) {
      const rowZ = startZ + z;
      this.createRow(chunk, rowZ);
    }

    this.visibleChunks.set(chunkIndex, chunk);
    this.scene.add(chunk);
  }

  private createRow(parent: THREE.Group, z: number): void {
    const rowWidth = 9;
    const halfWidth = Math.floor(rowWidth / 2);

    const rowType = this.getRowType(z);

    for (let x = -halfWidth; x <= halfWidth; x++) {
      const tile = this.createGroundTile(x, z, rowType);
      parent.add(tile);
    }
  }

  private createGroundTile(x: number, z: number, rowType: RowType): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      this.gridSpacing * 0.95,
      0.2,
      this.gridSpacing * 0.95
    );

    let color: number;

    switch (rowType) {
      case RowType.ROAD:
        // Dark gray for roads
        color = (x + z) % 2 === 0 ? 0x404040 : 0x383838;
        break;
      case RowType.GRASS:
      default:
        // Green for grass
        color = (x + z) % 2 === 0 ? 0x90ee90 : 0x7ccd7c;
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
    });

    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(x * this.gridSpacing, -0.1, z * this.gridSpacing);
    tile.receiveShadow = true;

    return tile;
  }

  public updateChunks(playerZ: number): void {
    const currentChunk = Math.floor(playerZ / this.chunkSize);

    // Generate chunks ahead
    for (let i = currentChunk; i <= currentChunk + 2; i++) {
      if (!this.visibleChunks.has(i)) {
        this.generateChunk(i);
      }
    }

    // Regenerate visible chunks if row types changed
    for (let i = currentChunk - 1; i <= currentChunk + 2; i++) {
      if (this.visibleChunks.has(i)) {
        const existingChunk = this.visibleChunks.get(i)!;
        // Clear and regenerate
        existingChunk.clear();
        const startZ = i * this.chunkSize;
        for (let z = 0; z < this.chunkSize; z++) {
          const rowZ = startZ + z;
          this.createRow(existingChunk, rowZ);
        }
      }
    }

    // Remove chunks far behind
    const chunksToRemove: number[] = [];
    this.visibleChunks.forEach((_chunk, index) => {
      if (index < currentChunk - 2) {
        chunksToRemove.push(index);
      }
    });

    chunksToRemove.forEach((index) => {
      const chunk = this.visibleChunks.get(index);
      if (chunk) {
        this.scene.remove(chunk);
        chunk.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        this.visibleChunks.delete(index);
      }
    });
  }

  public worldToGrid(worldPos: THREE.Vector3): { x: number; z: number } {
    return {
      x: Math.round(worldPos.x / this.gridSpacing),
      z: Math.round(worldPos.z / this.gridSpacing),
    };
  }

  public gridToWorld(gridPos: { x: number; z: number }): THREE.Vector3 {
    return new THREE.Vector3(
      gridPos.x * this.gridSpacing,
      0,
      gridPos.z * this.gridSpacing
    );
  }
}
