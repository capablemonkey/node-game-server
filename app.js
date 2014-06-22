var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var PORT = process.env.PORT || 5000;

// Serve sampleClient static files
function handler (req, res) {
	console.log(req.url);
	var filepath = __dirname + '/sampleClient/';

	if (req.url === '/client.js') filepath += 'client.js';
	else filepath += 'index.html';

  fs.readFile(filepath,
  function (err, data) {
    if (err) {
      res.writeHead(500);
    }

    res.writeHead(200);
    res.end(data);
  });
}

app.listen(PORT);

console.log("Static sample client files are being served...");

// Game config:

var PLAYERS_PER_ROOM = 4;

// game state:

function Player(socket, controlCount, type, id) {
	this.id = id;
	this.socket = socket;				// store socket.io socket here.
	this.controlCount = controlCount;	// # of controls
	this.type = type;					// client type i.e. "oculus"
}

function GameState() {
	this.players = [];
	this.tasks = [];
	this.state = "PRE_GAME";
	this.level = 1;
}

GameState.prototype.addPlayer = function(socket, controlCount, type) {
	var id = this.players.length + 1;
	newPlayer = new Player(socket, controlCount, type, id);
	this.players.push(newPlayer);
	return newPlayer;
};

GameState.prototype.startGame = function() {
	console.log("Starting game...");
	this.players.forEach(function(player) {
		player.socket.emit("LEVEL_START", player.socket.id);
	});
};

var GAME = new GameState();

console.log("Game state set up");

// actual socket handling:

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });

  socket.on('JOIN', function (data) {
    console.log('attempting to join player: ', data);
    newPlayer = GAME.addPlayer(socket, data.controlCount, data.type);
    console.log('Player #', GAME.players.length, ' joined!');
    socket.emit("JOIN", {
    	playerId: newPlayer.id
    });
  });

  socket.on('GAME_START', function(data) {
  	if (GAME.players.length === PLAYERS_PER_ROOM) GAME.startGame();
  });

});

console.log("Ready to talk to clients!");