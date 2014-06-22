var staticServerHandler = require('./staticServer');
var app = require('http').createServer(staticServerHandler);
var io = require('socket.io')(app);
var _  = require('lodash');
var uuid = require('node-uuid');
var GameLogic = require('./logic.js')();
var config = require('./config.js');
var init = require('./init.js');

var PORT = process.env.PORT || 5000;
app.listen(PORT);
console.log("Static sample client files are being served...");

var GAMESTATE = init(GameLogic, config);

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