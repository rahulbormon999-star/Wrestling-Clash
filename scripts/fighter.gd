# scripts/fighter.gd
# One script drives every fighter — player or AI — so combat rules stay
# identical no matter who controls the body. Phase 1 uses a capsule as the
# visual (built in code, no editor needed) — real character models come later
# without changing this state-machine logic.
class_name Fighter
extends CharacterBody3D

enum State {
	IDLE, MOVING, ATTACKING, GRAPPLING, GRAPPLED,
	GROUNDED, PINNING, PINNED, RECOVERING, KO
}

@export var fighter_name: String = "Fighter"
@export var is_player_controlled: bool = false
@export var move_speed: float = 4.0
@export var body_color: Color = Color(0.8, 0.2, 0.2)

var health: float = 100.0
var state: State = State.IDLE
var opponent: Fighter = null

const GRAVITY := 20.0
const PIN_BREAK_HEALTH_THRESHOLD := 10.0  # spec: pin escape much harder below 10% strength

var _regen_timer := 0.0

func _ready() -> void:
	_build_visuals()

func _build_visuals() -> void:
	var capsule_shape := CapsuleShape3D.new()
	capsule_shape.radius = 0.4
	capsule_shape.height = 1.8
	var collision := CollisionShape3D.new()
	collision.shape = capsule_shape
	add_child(collision)

	var mesh := CapsuleMesh.new()
	mesh.radius = 0.4
	mesh.height = 1.8
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = body_color
	mesh_instance.material_override = material
	add_child(mesh_instance)

func _physics_process(delta: float) -> void:
	_apply_gravity(delta)
	_regenerate_health(delta)

	if is_player_controlled and state in [State.IDLE, State.MOVING]:
		_handle_player_movement()

	move_and_slide()

func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= GRAVITY * delta

func _regenerate_health(delta: float) -> void:
	# Spec: 1% per 3 seconds normally, 1% per 2 seconds once at 0%. No regen
	# while actively attacking/grappling.
	if state in [State.ATTACKING, State.GRAPPLING]:
		return
	_regen_timer += delta
	var interval := 2.0 if health <= 0.0 else 3.0
	if _regen_timer >= interval:
		_regen_timer = 0.0
		health = min(100.0, health + 1.0)

func _handle_player_movement() -> void:
	var input_dir := Vector3.ZERO
	if Input.is_action_pressed("move_forward"): input_dir.z -= 1
	if Input.is_action_pressed("move_back"): input_dir.z += 1
	if Input.is_action_pressed("move_left"): input_dir.x -= 1
	if Input.is_action_pressed("move_right"): input_dir.x += 1

	if input_dir.length() > 0:
		input_dir = input_dir.normalized()
		velocity.x = input_dir.x * move_speed
		velocity.z = input_dir.z * move_speed
		state = State.MOVING
		look_at(global_position + input_dir, Vector3.UP)
	else:
		velocity.x = 0
		velocity.z = 0
		state = State.IDLE

# --- Combat actions -------------------------------------------------

func punch() -> void:
	if state == State.KO or state == State.PINNED: return
	state = State.ATTACKING
	_try_hit(8.0, 0.9)
	await get_tree().create_timer(0.4).timeout
	if state == State.ATTACKING: state = State.IDLE

func kick() -> void:
	if state == State.KO or state == State.PINNED: return
	state = State.ATTACKING
	_try_hit(12.0, 1.1)
	await get_tree().create_timer(0.5).timeout
	if state == State.ATTACKING: state = State.IDLE

func grab() -> void:
	if state == State.KO or state == State.PINNED: return
	if opponent == null: return
	if global_position.distance_to(opponent.global_position) < 1.5:
		state = State.GRAPPLING
		opponent.state = State.GRAPPLED

func throw_opponent() -> void:
	if state != State.GRAPPLING or opponent == null: return
	opponent.take_damage(15.0)
	opponent.state = State.GROUNDED
	state = State.IDLE

func attempt_pin() -> void:
	if opponent == null: return
	if opponent.state == State.GROUNDED and global_position.distance_to(opponent.global_position) < 1.5:
		state = State.PINNING
		opponent.state = State.PINNED

func break_pin() -> void:
	# Called repeatedly (e.g. mashing a button) by the pinned fighter.
	if state != State.PINNED: return
	var escape_chance := 0.5 if health > PIN_BREAK_HEALTH_THRESHOLD else 0.12
	if randf() < escape_chance:
		state = State.IDLE
		if opponent: opponent.state = State.IDLE

func _try_hit(damage: float, hit_range: float) -> void:
	if opponent == null: return
	if global_position.distance_to(opponent.global_position) <= hit_range:
		opponent.take_damage(damage)

func take_damage(amount: float) -> void:
	if state == State.KO: return
	# Slight extra vulnerability once already very weak, echoing the spec's
	# "low health = weaker defense" idea.
	var multiplier := 1.3 if health < 10.0 else 1.0
	health = max(0.0, health - amount * multiplier)
	if health <= 0.0:
		state = State.KO
