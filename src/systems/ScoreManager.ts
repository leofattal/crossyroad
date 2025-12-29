export class ScoreManager {
  private distance: number = 0;
  private coins: number = 0;
  private bonusPoints: number = 0;
  private multiplier: number = 1.0;
  private basePointsPerRow: number = 10;

  constructor() {}

  public addDistance(rows: number): void {
    this.distance += rows;
    this.updateMultiplier();
  }

  public addCoins(amount: number): void {
    this.coins += amount;
  }

  public addBonus(points: number): void {
    this.bonusPoints += points;
  }

  private updateMultiplier(): void {
    // Multiplier increases by 0.1x every 50m (5 rows = 1m as per PRD)
    const distanceInMeters = this.distance / 5;
    this.multiplier = Math.min(
      1.0 + Math.floor(distanceInMeters / 50) * 0.1,
      3.0 // Cap at 3x
    );
  }

  public getDistanceScore(): number {
    return this.distance * this.basePointsPerRow * this.multiplier;
  }

  public getTotalScore(): number {
    return Math.floor(this.getDistanceScore() + this.coins + this.bonusPoints);
  }

  public getDistance(): number {
    return this.distance;
  }

  public getCoins(): number {
    return this.coins;
  }

  public getMultiplier(): number {
    return this.multiplier;
  }

  public reset(): void {
    this.distance = 0;
    this.coins = 0;
    this.bonusPoints = 0;
    this.multiplier = 1.0;
  }
}
