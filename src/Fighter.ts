// src/Fighter.ts
// Each fighter starts as a code-built block figure (visible fallback), and
// setVisualModel() swaps in a real character model + its animations once
// one loads successfully — the block rig hides itself at that point. The
// invisible capsule `mesh` stays the position/collision anchor either way.
import {
  Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, TransformNode, AnimationGroup,
} from '@babylonjs/core';

export enum FighterState {
  IDLE, MOVING, ATTACKING, GRAPPLING, GRAPPLED,
  GROUNDED, PINNING, PINNED, RECOVERING, KO,
}

export interface MoveVector { x: number; y: number; }

interface Rig {
  rightArmPivot: TransformNode;
  leftArmPivot: TransformNode;
  rightLegPivot: TransformNode;
  leftLegPivot: TransformNode;
}

export class Fighter {
  public mesh: Mesh; // invisible capsule — position/collision anchor only
  public health = 100;
  public state: FighterState = FighterState.IDLE;
  public opponent: Fighter | null = null;
  public isPlayerControlled: boolean;
  public moveSpeed = 4;
  public onHit: ((amount: number) => void) | null = null;

  private material: StandardMaterial;
  private rig: Rig;
  private rigMeshes: Mesh[] = [];
  private animationGroups: AnimationGroup[] = [];
  private currentAnim: AnimationGroup | null = null;

  private regenTimer = 0;
  private readonly PIN_BREAK_HEALTH_THRESHOLD = 10;

  private attackType: 'punch' | 'kick' | null = null;
  private attackTimer = 0;
  private attackDuration = 0;
  private walkCycle = 0;

  constructor(name: string, scene: Scene, position: Vector3, color: Color3, isPlayerControlled: boolean) {
    this.isPlayerControlled = isPlayerControlled;

    this.mesh = MeshBuilder.CreateCapsule(name, { height: 1.8, radius: 0.4 }, scene);
    this.mesh.position = position;
    this.mesh.isVisible = false;

    this.material = new StandardMaterial(name + 'Mat', scene);
    this.material.diffuseColor = color;

    this.rig = this.buildRig(name, scene);
  }

  private buildRig(name: string, scene: Scene): Rig {
    const root = new TransformNode(name + 'RigRoot', scene);
    root.parent = this.mesh;
    root.position.set(0, -0.9, 0);

    const torso = MeshBuilder.CreateBox(name + 'Torso', { width: 0.5, height: 0.7, depth: 0.3 }, scene);
    torso.parent = root;
    torso.position.set(0, 0.9, 0);
    torso.material = this.material;
    this.rigMeshes.push(torso);

    const head = MeshBuilder.CreateSphere(name + 'Head', { diameter: 0.36 }, scene);
    head.parent = root;
    head.position.set(0, 1.45, 0);
    head.material = this.material;
    this.rigMeshes.push(head);

    const makeLimb = (limbName: string, height: number, diameter: number, pivotPos: Vector3): TransformNode => {
      const pivot = new TransformNode(limbName + 'Pivot', scene);
      pivot.parent = root;
      pivot.position.copyFrom(pivotPos);
      const limbMesh = MeshBuilder.CreateCylinder(limbName, { height, diameter }, scene);
      limbMesh.parent = pivot;
      limbMesh.position.set(0, -height / 2, 0);
      limbMesh.material = this.material;
      this.rigMeshes.push(limbMesh);
      return pivot;
    };

    const rightArmPivot = makeLimb(name + 'RightArm', 0.55, 0.14, new Vector3(0.34, 1.2, 0));
    const leftArmPivot = makeLimb(name + 'LeftArm', 0.55, 0.14, new Vector3(-0.34, 1.2, 0));
    const rightLegPivot = makeLimb(name + 'RightLeg', 0.85, 0.2, new Vector3(0.15, 0.85, 0));
    const leftLegPivot = makeLimb(name + 'LeftLeg', 0.85, 0.2, new Vector3(-0.15, 0.85, 0));

    return { rightArmPivot, leftArmPivot, rightLegPivot, leftLegPivot };
  }

  // Call this once a real model has loaded — hides the block rig, attaches
  // the model, and starts playing its "idle" clip if one is found.
  setVisualModel(root: TransformNode, animationGroups: AnimationGroup[] = [], scaleFactor: number = 1): void {
    for (const m of this.rigMeshes) m.isVisible = false;

    root.parent = this.mesh;
    root.position.set(0, -0.9, 0);
    root.scaling.set(scaleFactor, scaleFactor, scaleFactor);

    this.animationGroups = animationGroups;
    for (const g of this.animationGroups) g.stop();
    this.playAnimByKeyword('idle');
  }

  private playAnimByKeyword(keyword: string, loop: boolean = true): boolean {
    const group = this.animationGroups.find(g => g.name.toLowerCase().includes(keyword));
    if (!group) return false;
    if (this.currentAnim === group) return true;
    this.currentAnim?.stop();
    group.play(loop);
    this.currentAnim = group;
    return true;
  }

  update(deltaSeconds: number, moveVector?: MoveVector): void {
    this.regenerateHealth(deltaSeconds);
    if (this.isPlayerControlled && moveVector && (this.state === FighterState.IDLE || this.state === FighterState.MOVING)) {
      this.handleMovement(moveVector, deltaSeconds);
    }
    this.updateAttackAnimation(deltaSeconds);
    this.updateWalkAnimation(deltaSeconds);

    if (this.animationGroups.length > 0) {
      if (this.state === FighterState.MOVING) this.playAnimByKeyword('walk');
      else if (this.state === FighterState.IDLE) this.playAnimByKeyword('idle');
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

  private updateWalkAnimation(deltaSeconds: number): void {
    if (this.state !== FighterState.MOVING) {
      this.rig.leftLegPivot.rotation.x *= 0.8;
      this.rig.rightLegPivot.rotation.x *= 0.8;
      if (this.attackType === null) {
        this.rig.leftArmPivot.rotation.x *= 0.8;
        this.rig.rightArmPivot.rotation.x *= 0.8;
      }
      return;
    }
    this.walkCycle += deltaSeconds * 8;
    const swing = Math.sin(this.walkCycle) * 0.5;
    this.rig.rightLegPivot.rotation.x = swing;
    this.rig.leftLegPivot.rotation.x = -swing;
    if (this.attackType === null) {
      this.rig.rightArmPivot.rotation.x = -swing * 0.6;
      this.rig.leftArmPivot.rotation.x = swing * 0.6;
    }
  }

  private updateAttackAnimation(deltaSeconds: number): void {
    if (!this.attackType) return;
    this.attackTimer += deltaSeconds;
    const progress = Math.min(1, this.attackTimer / this.attackDuration);
    const swing = Math.sin(progress * Math.PI);

    if (this.attackType === 'punch') {
      this.rig.rightArmPivot.rotation.x = -swing * (Math.PI / 2);
    } else if (this.attackType === 'kick') {
      this.rig.rightLegPivot.rotation.x = -swing * (Math.PI / 2.2);
    }

    if (progress >= 1) {
      this.attackType = null;
      this.rig.rightArmPivot.rotation.x = 0;
      this.rig.rightLegPivot.rotation.x = 0;
    }
  }

  punch(): void {
    if (this.state === FighterState.KO || this.state === FighterState.PINNED) return;
    this.state = FighterState.ATTACKING;
    this.attackType = 'punch';
    this.attackTimer = 0;
    this.attackDuration = 0.4;
    if (this.animationGroups.length > 0) {
      if (!this.playAnimByKeyword('punch', false)) this.playAnimByKeyword('attack', false);
    }
    this.tryHit(8, 1.2);
    setTimeout(() => { if (this.state === FighterState.ATTACKING) this.state = FighterState.IDLE; }, 400);
  }

  kick(): void {
    if (this.state === FighterState.KO || this.state === FighterState.PINNED) return;
    this.state = FighterState.ATTACKING;
    this.attackType = 'kick';
    this.attackTimer = 0;
    this.attackDuration = 0.5;
    if (this.animationGroups.length > 0) {
      if (!this.playAnimByKeyword('kick', false)) this.playAnimByKeyword('attack', false);
    }
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
    const actualDamage = Math.min(this.health, amount * multiplier);
    this.health = Math.max(0, this.health - amount * multiplier);
    this.flashHit();
    this.onHit?.(Math.round(actualDamage));
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
