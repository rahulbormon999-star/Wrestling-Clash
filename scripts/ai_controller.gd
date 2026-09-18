# scripts/ai_controller.gd
# Attach to a Fighter with is_player_controlled = false. Decides on an
# interval rather than every frame — simple to reason about and tune.
class_name AIController
extends Node

@export var fighter: Fighter
@export var decision_interval: float = 1.2

var _timer := 0.0

func _process(delta: float) -> void:
	if fighter == null or fighter.opponent == null: return
	if fighter.state == Fighter.State.KO: return

	_timer += delta
	if _timer >= decision_interval:
		_timer = 0.0
		_decide()

func _decide() -> void:
	var opp := fighter.opponent
	var distance := fighter.global_position.distance_to(opp.global_position)

	if opp.state == Fighter.State.GROUNDED and distance < 1.5:
		fighter.attempt_pin()
		return

	if opp.health < 20.0 and distance < 1.5:
		fighter.kick()
		return

	if distance > 1.5:
		_move_towards(opp.global_position)
	else:
		var roll := randf()
		if roll < 0.4:
			fighter.punch()
		elif roll < 0.7:
			fighter.kick()
		else:
			fighter.grab()
			await fighter.get_tree().create_timer(0.6).timeout
			if fighter.state == Fighter.State.GRAPPLING:
				fighter.throw_opponent()

func _move_towards(target: Vector3) -> void:
	var dir := (target - fighter.global_position)
	dir.y = 0
	dir = dir.normalized()
	fighter.velocity.x = dir.x * fighter.move_speed
	fighter.velocity.z = dir.z * fighter.move_speed
	fighter.state = Fighter.State.MOVING
	fighter.look_at(fighter.global_position + dir, Vector3.UP)
