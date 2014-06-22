var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var _  = require('lodash');
var uuid = require('node-uuid');

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

// Game logic:

function Player(socket, controlCount, type, id) {
	this.id = id;
	this.socket = socket;								// store socket.io socket here.
	this.controlCount = controlCount;		// # of controls expecting
	this.type = type;										// client type i.e. "oculus"
	this.controls = [];									// store actual controls here
}

function Control(name, type, values) {
	this.name = name;
	this.type = type.name;
	this.values = values || type.values;
	this.controlId = uuid.v1();
}

function GameState() {
	this.players = [];
	this.tasks = [];
	this.state = "PRE_GAME";
	this.level = 1;

	this.health = 100;
	this.score = 100;

	console.log("New game state set up!");
}

GameState.prototype.addPlayer = function(socket, controlCount, type) {
	var id = this.players.length + 1;
	newPlayer = new Player(socket, controlCount, type, id);
	this.players.push(newPlayer);
	return newPlayer;
};

GameState.prototype.startGame = function() {
	console.log("Attempting to start game...");

	if (this.players.length === PLAYERS_PER_ROOM && this.state == "PRE_GAME") {
		console.log("Game starting...");
		this.players.forEach(function(player) {
			player.socket.emit("GAME_START", {
				success: true
			});
		});

		// set status:
		this.state = "GAME_STARTED";
		// proceed to next step
		this.startLevel();
	} 

	else {
		console.log("Couldn't start game. Not enough players or game already started.");
		this.players.forEach(function(player) {
			player.socket.emit("GAME_START", {
				success: false
			});
		});
	}
};

GameState.prototype.startLevel = function() {
	var level = this.level;

	this.players.forEach(function(player) {
		player.socket.emit("LEVEL_START", {
			level: level
		});
	});

	this.assignControls();
};

GameState.prototype.broadcastState = function(socket) {
	socket.emit('GAME_STATE', {
		state: {
			health: this.health,
			score: this.score,
			players: this.players.length,
			status: this.state
		}
	});
};

GameState.prototype.assignControls = function() {
	var CONTROL_POOL = _.shuffle(CONTROLS);

	// TODO: somehow figure out how controls are to be split up based on types the client accepts
	this.players.forEach(function(player) {
		player.controls.push(CONTROL_POOL.pop());
		player.controls.push(CONTROL_POOL.pop());
	});

	this.players.forEach(function(player) {
		player.socket.emit("ASSIGN_CONTROLS", {
			controls: player.controls
		});
	});
};



// Game config:

var PLAYERS_PER_ROOM = 4;
var STATE_BROADCAST_INTERVAL = 1000;

// control types and their default values
var CONTROL_TYPES = {
	'toggle': {
		name: "toggle",
		values: ["on", "off"]
	},
	'dial': {
		name: 'dial',
		values: ["1", "2", "3", "4", "5"]
	},
	'button': {
		name: 'button',
		values: ['press']
	},
	'slider': {
		name: 'slider',
		values: ["1", "2", "3", "4", "5"]
	},
	'shake': {
		name: 'shake',
		values: ['shake']
	},
	'flip': {
		name: 'flip',
		values: ['flip']
	}
};

var CONTROLS = [
	new Control("Megaflux power", CONTROL_TYPES.dial, ["10", "20", "30"]),
	new Control("Eject waste", CONTROL_TYPES.button),
	new Control("Launch nuke", CONTROL_TYPES.button),
	new Control("Flush toilet", CONTROL_TYPES.button),
	new Control("Engine Power", CONTROL_TYPES.toggle),
	new Control("Engage shitty music", CONTROL_TYPES.toggle),
	new Control("Seatbelt indicator", CONTROL_TYPES.toggle),
	new Control("Swag level", CONTROL_TYPES.slider),
	new Control("Music volume", CONTROL_TYPES.slider)
];

var GAME = new GameState();

console.log("Game state set up");

// actual socket handling:

io.on('connection', function (socket) {
	// broadcast game state periodically:
	setInterval(function() {
		GAME.broadcastState(socket);
	}, STATE_BROADCAST_INTERVAL);

  socket.on('JOIN', function (data) {
    console.log('attempting to join player: ', data);
    newPlayer = GAME.addPlayer(socket, data.controlCount, data.type);
    console.log('Player #', GAME.players.length, ' joined!');
    
    // respond if successful:
    socket.emit("JOIN", {
    	playerId: newPlayer.id
    });
  });

  socket.on('GAME_START', function(data) {
  	GAME.startGame();
  });

  socket.on('GAME_RESTART', function(data) {
  	console.log("Restarting game...");
  	GAME = new GameState();
  });

});

console.log("Ready to talk to clients!");