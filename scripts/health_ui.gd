# scripts/health_ui.gd
# Per spec: your own health is exact, opponent's is only a rough visual read.
extends CanvasLayer

var match_manager: Node
var _player_bar: ProgressBar
var _opponent_label: Label

func _ready() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	var player_label := Label.new()
	player_label.text = "You"
	player_label.position = Vector2(20, 0)
	root.add_child(player_label)

	_player_bar = ProgressBar.new()
	_player_bar.min_value = 0
	_player_bar.max_value = 100
	_player_bar.value = 100
	_player_bar.position = Vector2(20, 20)
	_player_bar.size = Vector2(200, 24)
	root.add_child(_player_bar)

	_opponent_label = Label.new()
	_opponent_label.text = "Opponent: ???"
	_opponent_label.position = Vector2(20, 60)
	root.add_child(_opponent_label)

func _process(_delta: float) -> void:
	if match_manager == null or match_manager.fighter_a == null: return
	_player_bar.value = match_manager.fighter_a.health
	_opponent_label.text = "Opponent: " + _condition_text(match_manager.fighter_b.health)

func _condition_text(health: float) -> String:
	if health > 70: return "Looking strong"
	if health > 40: return "Getting tired"
	if health > 10: return "Badly hurt"
	return "About to fall"
