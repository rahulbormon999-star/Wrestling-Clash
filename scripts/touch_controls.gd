# scripts/touch_controls.gd
# On-screen buttons for Android — D-pad + action buttons. Movement drives
# the same "move_forward" etc. actions fighter.gd already checks, so the
# exact same movement code works with touch, keyboard, or (later) a proper
# virtual joystick.
extends CanvasLayer

var match_manager: Node

func _ready() -> void:
	for action in ["move_forward", "move_back", "move_left", "move_right"]:
		if not InputMap.has_action(action):
			InputMap.add_action(action)

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(root)

	_add_dpad(root)
	_add_action_button(root, "Punch", Vector2(-320, -260), func(): _player().punch())
	_add_action_button(root, "Kick", Vector2(-320, -200), func(): _player().kick())
	_add_action_button(root, "Grab", Vector2(-320, -140), func(): _player().grab())
	_add_action_button(root, "Throw", Vector2(-220, -260), func(): _player().throw_opponent())
	_add_action_button(root, "Pin", Vector2(-220, -200), func(): _player().attempt_pin())
	_add_action_button(root, "Break", Vector2(-220, -140), func(): _player().break_pin())

func _player() -> Fighter:
	return match_manager.fighter_a

func _add_action_button(root: Control, label: String, offset: Vector2, on_press: Callable) -> void:
	var btn := Button.new()
	btn.text = label
	btn.custom_minimum_size = Vector2(90, 50)
	btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	btn.position = offset
	btn.pressed.connect(on_press)
	root.add_child(btn)

func _add_dpad(root: Control) -> void:
	var directions := {
		"move_forward": Vector2(-140, -300),
		"move_back": Vector2(-140, -220),
		"move_left": Vector2(-200, -260),
		"move_right": Vector2(-80, -260),
	}
	for action in directions.keys():
		var btn := Button.new()
		btn.text = action.replace("move_", "").capitalize()
		btn.custom_minimum_size = Vector2(60, 60)
		btn.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
		btn.position = directions[action]
		btn.button_down.connect(func(): Input.action_press(action))
		btn.button_up.connect(func(): Input.action_release(action))
		root.add_child(btn)
