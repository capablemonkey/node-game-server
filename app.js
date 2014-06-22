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

function Control(name, type, values, possibleTasks) {
	that = this;
	this.name = name;
	this.type = type.name;
	this.values = values || type.values;
	this.controlId = uuid.v1();

	// bind tasks to this instance of control
	this.tasks = possibleTasks.map(function(task) {
		task.controlId = that.controlId;
		return task;
	});

	this.currentValue = null;
}

function GameState() {
	this.players = [];
	this.tasks = [];
	this.state = "PRE_GAME";
	this.controls = [];
	this.level = 0;

	this.health = 100;
	this.score = 100;

	console.log("New game state set up!");
}

function Task(text, requiredValue, timeLimit, controlId) {
	this.text = text;
	this.controlId = controlId || null;
	this.requiredValue = requiredValue;
	this.timeLimit = timeLimit;
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

GameState.prototype.endLevel = function() {
	// emit LEVEL_END
	// start next level in 5 seconds
	// set state to INTERMISSION
	return true;
};

GameState.prototype.startLevel = function() {
	// clear control and task state:
	this.controls = {};
	this.tasks = [];

	var level = this.level += 1;

	// tell all clients the level has started
	this.players.forEach(function(player) {
		player.socket.emit("LEVEL_START", {
			level: level
		});
	});

	this.state = "LEVEL_IN_PROGRESS";

	// assign controls to players and emit them
	this.assignControls();

	console.log(this.tasks);

	// assign tasks to players and emit them
	this.assignTasks();

	// end the level after some amount of time defined in LEVEL_TIME_LIMIT object
	setTimeout(this.endLevel, LEVEL_TIME_LIMIT[this.level]);
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
	var controlPool = _.shuffle(CONTROLS);

	gameState = this;

	controlPool.forEach(function(control) {
		gameState.controls[control.controlId] = control;
	});

	// TODO: somehow figure out how controls are to be split up based on types the client accepts
	this.players.forEach(function(player) {
		player.controls.push(controlPool.pop());
		player.controls.push(controlPool.pop());
	});

	this.players.forEach(function(player) {
		player.socket.emit("ASSIGN_CONTROLS", {
			controls: player.controls
		});
	});
};

GameState.prototype.assignTasks = function() {
	// shuffle and take the first 4 tasks
	// TODO: make sure chosen tasks do not act on the same controlId
	// TODO: make sure each controlId belongs to a control which belongs to a player
	// TODO: make sure task is destroyed after time limit
	this.tasks = _.cloneDeep(_.first(_.shuffle(TASKS), 4));

	tasksToEmit = _.cloneDeep(this.tasks);
	
	this.players.forEach(function(player) {
		var task = tasksToEmit.pop();
		player.socket.emit("TASK", {
			task: {
				text: task.text,
				time: task.timeLimit
			}
		});
	});
};

GameState.prototype.doAction = function(controlId, value) {
	// check that state is LEVEL_IN_PROGRESS
	if (this.state != "LEVEL_IN_PROGRESS") return false;

	// set control currentvalue
	control = this.controls[controlId];
	console.log("CLIENT SET: ", control.name, " to: ", value);
	control.currentValue = value;

	foo = _.find(this.tasks, function(task) {
		return task.controlId == controlId;
	});

	console.log(foo);

	// satisfy task if equal to required value

};

// Game config:

var PLAYERS_PER_ROOM = 4;
var STATE_BROADCAST_INTERVAL = 1000;
var LEVEL_TIME_LIMIT = {
	1: 30000,
	2: 30000,
	3: 30000,
	4: 30000,
	5: 30000,
	6: 30000
};

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


var GAME = new GameState();
var CONTROLS = [
	new Control("Megaflux power", CONTROL_TYPES.dial, ["10", "20", "30"], [
		new Task("Set Megaflux power to 10", "10", 5000),
		new Task("Set Megaflux power to 20", "20", 5000),
		new Task("Set Megaflux power to 30", "30", 5000)
		]),
	new Control("Eject waste", CONTROL_TYPES.button, null, [
		new Task("Eject Waste", "press", 5000)
		]),
	new Control("Launch nuke", CONTROL_TYPES.button, null, [
		new Task("Launch Nuke", "press", 5000),
		]),
	new Control("Flush toilet", CONTROL_TYPES.button, null, [
		]),
	new Control("Engine Power", CONTROL_TYPES.toggle, null, [
		new Task("Turn off engine", "off", 5000),
		new Task("Turn on engine", "on", 5000)
		]),
	new Control("Engage shitty music", CONTROL_TYPES.toggle, null, [
		]),
	new Control("Seatbelt indicator", CONTROL_TYPES.toggle, null, [
		]),
	new Control("Swag level", CONTROL_TYPES.slider, null, [
		]),
	new Control("Music volume", CONTROL_TYPES.slider, null, [
		])
];

TASKS = _.flatten(CONTROLS.map(function(control) {
	return control.tasks;
}));

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

  socket.on('ACTION', function(data) {
  	GAME.doAction(data.controlId, data.value);
  });

});

console.log("Ready to talk to clients!");