# scripts/match_manager.gd
# Owns match lifecycle: spawn fighters, wire up AI + referee, declare winner.
extends Node3D

@export var fighter_a_color := Color(0.8, 0.2, 0.2)
@export var fighter_b_color := Color(0.2, 0.4, 0.9)

var fighter_a: Fighter
var fighter_b: Fighter
var match_over := false

func start_match() -> void:
	fighter_a = _spawn_fighter("Player", true, Vector3(-2, 1, 0), fighter_a_color)
	fighter_b = _spawn_fighter("AI Opponent", false, Vector3(2, 1, 0), fighter_b_color)
	fighter_a.opponent = fighter_b
	fighter_b.opponent = fighter_a

	var ai := AIController.new()
	ai.fighter = fighter_b
	add_child(ai)

	var ref := preload("res://scripts/referee_ai.gd").new()
	ref.fighter_a = fighter_a
	ref.fighter_b = fighter_b
	ref.match_won.connect(_on_match_won)
	add_child(ref)

func _spawn_fighter(name_: String, player_controlled: bool, pos: Vector3, color: Color) -> Fighter:
	var f := Fighter.new()
	f.fighter_name = name_
	f.is_player_controlled = player_controlled
	f.body_color = color
	f.position = pos
	add_child(f)
	return f

func _on_match_won(winner: Fighter) -> void:
	if match_over: return
	match_over = true
	print("MATCH OVER — Winner: ", winner.fighter_name)
