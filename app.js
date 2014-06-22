var staticServerHandler = require('./staticServer');
var app = require('http').createServer(staticServerHandler);
var io = require('socket.io')(app);
var _  = require('lodash');
var uuid = require('node-uuid');
var GameLogic = require('./logic.js')();
var config = require('./config.js');

var PORT = process.env.PORT || 5000;
app.listen(PORT);
console.log("Static sample client files are being served...");

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
var GAMESTATE = new GameLogic.GameState(GAME);

console.log("Game state set up");

// actual socket handling:

io.on('connection', function (socket) {
	// broadcast game state periodically:
	setInterval(function() {
		GAMESTATE.broadcastState(socket);
	}, config.STATE_BROADCAST_INTERVAL);

  socket.on('JOIN', function (data) {
    console.log('attempting to join player: ', data);
    newPlayer = GAMESTATE.addPlayer(socket, data.controlCount, data.type);
    console.log('Player #', GAMESTATE.players.length, ' joined!');
    
    // respond if successful:
    socket.emit("JOIN", {
    	playerId: newPlayer.id
    });
  });

  socket.on('GAME_START', function(data) {
  	GAMESTATE.startGame();
  });

  socket.on('GAME_RESTART', function(data) {
  	console.log("Restarting game...");
  	GAMESTATE = new GameLogic.GameState();
  });

  socket.on('ACTION', function(data) {
  	GAMESTATE.doAction(data.controlId, data.value);
  });

});

console.log("Ready to talk to clients!");