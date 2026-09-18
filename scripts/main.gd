# scripts/main.gd
# Builds the entire Phase 1 scene from code — floor, light, camera, match
# manager, HUD, touch controls — no manual scene editing needed.
extends Node3D

func _ready() -> void:
	_build_arena()
	_build_lighting()
	_build_camera()

	var match_manager := preload("res://scripts/match_manager.gd").new()
	add_child(match_manager)
	match_manager.start_match()

	var hud := preload("res://scripts/health_ui.gd").new()
	hud.match_manager = match_manager
	add_child(hud)

	var controls := preload("res://scripts/touch_controls.gd").new()
	controls.match_manager = match_manager
	add_child(controls)

func _build_arena() -> void:
	var floor_body := StaticBody3D.new()
	var floor_shape := CollisionShape3D.new()
	var box_shape := BoxShape3D.new()
	box_shape.size = Vector3(12, 1, 12)
	floor_shape.shape = box_shape
	floor_body.add_child(floor_shape)

	var floor_mesh := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = Vector3(12, 1, 12)
	floor_mesh.mesh = box_mesh
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.6, 0.1, 0.1)
	floor_mesh.material_override = mat
	floor_body.add_child(floor_mesh)
	floor_body.position = Vector3(0, -0.5, 0)
	add_child(floor_body)

func _build_lighting() -> void:
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, 30, 0)
	add_child(light)

	var env_node := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color(0.05, 0.05, 0.08)
	env_node.environment = environment
	add_child(env_node)

func _build_camera() -> void:
	var camera := Camera3D.new()
	camera.position = Vector3(0, 6, 9)
	camera.look_at(Vector3.ZERO, Vector3.UP)
	add_child(camera)
	camera.current = true
