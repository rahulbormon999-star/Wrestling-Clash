# scripts/referee_ai.gd
# The "AI Referee" from the spec: neutral, rule-following pin counting.
# Later a human_referee.gd will emit the same match_won signal from a second
# player's input — match_manager won't need to know which one is active.
extends Node

signal match_won(winner: Fighter)

@export var fighter_a: Fighter
@export var fighter_b: Fighter

var _pin_count_timer := 0.0
var _counting := false
var _pinning_fighter: Fighter = null
var _pinned_fighter: Fighter = null

func _process(delta: float) -> void:
	_check_for_pin()
	if _counting:
		_run_count(delta)

func _check_for_pin() -> void:
	if _counting: return
	if fighter_a.state == Fighter.State.PINNING and fighter_b.state == Fighter.State.PINNED:
		_start_count(fighter_a, fighter_b)
	elif fighter_b.state == Fighter.State.PINNING and fighter_a.state == Fighter.State.PINNED:
		_start_count(fighter_b, fighter_a)

func _start_count(pinning: Fighter, pinned: Fighter) -> void:
	_counting = true
	_pin_count_timer = 0.0
	_pinning_fighter = pinning
	_pinned_fighter = pinned
	print("Referee: pin detected, starting count")

func _run_count(delta: float) -> void:
	if _pinning_fighter.state != Fighter.State.PINNING or _pinned_fighter.state != Fighter.State.PINNED:
		_counting = false
		print("Referee: pin broken, count stopped")
		return

	var previous_count := int(_pin_count_timer)
	_pin_count_timer += delta
	var current_count := int(_pin_count_timer)
	if current_count > previous_count and current_count <= 3:
		print("Referee: ", current_count, "!")

	if _pin_count_timer >= 3.0:
		_counting = false
		print("Referee: THREE! Match over.")
		emit_signal("match_won", _pinning_fighter)
