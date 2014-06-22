_ = require('lodash');

module.exports = function(GameLogic, config){
		
	CONTROL_TYPES = config.CONTROL_TYPES;

	var CONTROLS = [
		new GameLogic.Control("Megaflux power", CONTROL_TYPES.dial, ["10", "20", "30"], [
			new GameLogic.Task("Set Megaflux power to 10", "10", 5000),
			new GameLogic.Task("Set Megaflux power to 20", "20", 5000),
			new GameLogic.Task("Set Megaflux power to 30", "30", 5000)
			]),
		new GameLogic.Control("Eject waste", CONTROL_TYPES.button, null, [
			new GameLogic.Task("Eject Waste", "press", 5000)
			]),
		new GameLogic.Control("Launch nuke", CONTROL_TYPES.button, null, [
			new GameLogic.Task("Launch Nuke", "press", 5000),
			]),
		new GameLogic.Control("Flush toilet", CONTROL_TYPES.button, null, [
			]),
		new GameLogic.Control("Engine Power", CONTROL_TYPES.toggle, null, [
			new GameLogic.Task("Turn off engine", "off", 5000),
			new GameLogic.Task("Turn on engine", "on", 5000)
			]),
		new GameLogic.Control("Engage shitty music", CONTROL_TYPES.toggle, null, [
			]),
		new GameLogic.Control("Seatbelt indicator", CONTROL_TYPES.toggle, null, [
			]),
		new GameLogic.Control("Swag level", CONTROL_TYPES.slider, null, [
			]),
		new GameLogic.Control("Music volume", CONTROL_TYPES.slider, null, [
			])
	];

	TASKS = _.flatten(CONTROLS.map(function(control) {
		return control.tasks;
	}));

	var GAME = new GameLogic.Game(TASKS, CONTROLS);
	
	return new GameLogic.GameState(GAME);
}