// src/Fighter.ts
// One class drives every fighter — player or AI. A capsule is always
// created as the invisible "collider" (position/hit-detection anchor);
// setVisualModel() attaches a real character on top of it once one loads.
import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, TransformNode } from '@babylonjs/core';

export enum FighterState {
  IDLE, MOVING, ATTACKING, GRAPPLING, GRAPPLED,
  GROUNDED, PINNING, PINNED, RECOVERING, KO,
}

export interface MoveVector { x: number; y: number; }

export class Fighter {
  public mesh: Mesh;
  public health = 100;
  public state: FighterState = FighterState.IDLE;
  public opponent: Fighter | null = null;
  public isPlayerControlled: boolean;
  public moveSpeed = 4;
  public onHit: (() => void) | null = null;

  private material: StandardMaterial;
  private regenTimer = 0;
  private readonly PIN_BREAK_HEALTH_THRESHOLD = 10;

  constructor(name: string, scene: Scene, position: Vector3, color: Color3, isPlayerControlled: boolean) {
    this.isPlayerControlled = isPlayerControlled;
    this.mesh = MeshBuilder.CreateCapsule(name, { height: 1.8, radius: 0.4 }, scene);
    this.mesh.position = position;
    this.material = new StandardMaterial(name + 'Mat', scene);
    this.material.diffuseColor = color;
    this.mesh.material = this.material;
  }

  setVisualModel(root: TransformNode, scaleFactor: number = 0.01): void {
    this.mesh.isVisible = false;
    root.parent = this.mesh;
    root.position.set(0, -0.9, 0);
    root.scaling.set(scaleFactor, scaleFactor, scaleFactor);
  }

  update(deltaSeconds: number, moveVector?: MoveVector): void {
    this.regenerateHealth(deltaSeconds);
    if (this.isPlayerControlled && moveVector && (this.state === FighterState.IDLE || this.state === FighterState.MOVING)) {
      this.handleMovement(moveVector, deltaSeconds);
    }
  }

  private regenerateHealth(deltaSeconds: number): void {
    if (this.state === FighterState.ATTACKING || this.state === FighterState.GRAPPLING) return;
    this.regenTimer += deltaSeconds;
    const interval = this.health <= 0 ? 2 : 3;
    if (this.regenTimer >= interval) {
      this.regenTimer = 0;
      this.health = Math.min(100, this.health + 1);
    }
  }

  private handleMovement(moveVector: MoveVector, deltaSeconds: number): void {
    const raw = new Vector3(moveVector.x, 0, -moveVector.y);
    const magnitude = Math.min(raw.length(), 1);
    if (magnitude > 0.05) {
      const dir = raw.normalize();
      this.mesh.position.addInPlace(dir.scale(this.moveSpeed * magnitude * deltaSeconds));
      this.state = FighterState.MOVING;
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      this.state = FighterState.IDLE;
    }
  }

  punch(): void {
    if (this.state === FighterState.KO || this.state === FighterState.PINNED) return;
    this.state = FighterState.ATTACKING;
    this.tryHit(8, 1.2);
    setTimeout(() => { if (this.state === FighterState.ATTACKING) this.state = FighterState.IDLE; }, 400);
  }

  kick(): void {
    if (this.state === FighterState.KO || this.state === FighterState.PINNED) return;
    this.state = FighterState.ATTACKING;
    this.tryHit(12, 1.4);
    setTimeout(() => { if (this.state === FighterState.ATTACKING) this.state = FighterState.IDLE; }, 500);
  }

  grab(): void {
    if (this.state === FighterState.KO || this.state === FighterState.PINNED) return;
    if (!this.opponent) return;
    if (this.distanceToOpponent() < 1.8) {
      this.state = FighterState.GRAPPLING;
      this.opponent.state = FighterState.GRAPPLED;
    }
  }

  throwOpponent(): void {
    if (this.state !== FighterState.GRAPPLING || !this.opponent) return;
    this.opponent.takeDamage(15);
    this.opponent.state = FighterState.GROUNDED;
    this.state = FighterState.IDLE;
  }

  attemptPin(): void {
    if (!this.opponent) return;
    if (this.opponent.state === FighterState.GROUNDED && this.distanceToOpponent() < 1.8) {
      this.state = FighterState.PINNING;
      this.opponent.state = FighterState.PINNED;
    }
  }

  breakPin(): void {
    if (this.state !== FighterState.PINNED) return;
    const escapeChance = this.health > this.PIN_BREAK_HEALTH_THRESHOLD ? 0.5 : 0.12;
    if (Math.random() < escapeChance) {
      this.state = FighterState.IDLE;
      if (this.opponent) this.opponent.state = FighterState.IDLE;
    }
  }

  private tryHit(damage: number, range: number): void {
    if (!this.opponent) return;
    if (this.distanceToOpponent() <= range) this.opponent.takeDamage(damage);
  }

  takeDamage(amount: number): void {
    if (this.state === FighterState.KO) return;
    const multiplier = this.health < 10 ? 1.3 : 1.0;
    this.health = Math.max(0, this.health - amount * multiplier);
    this.flashHit();
    this.onHit?.();
    if (this.health <= 0) this.state = FighterState.KO;
  }

  private flashHit(): void {
    this.material.emissiveColor = new Color3(1, 1, 1);
    setTimeout(() => { this.material.emissiveColor = new Color3(0, 0, 0); }, 120);
  }

  private distanceToOpponent(): number {
    if (!this.opponent) return Infinity;
    return Vector3.Distance(this.mesh.position, this.opponent.mesh.position);
  }
}
