var _  = require('lodash');
var uuid = require('node-uuid');
var config = require('./config');

module.exports = function() {

	/*
	 * Game makes available all the Controls and Tasks
	 * initialized in init.js
	 */
	function Game(tasks, controls) {
		var that = this;
		this.tasks = tasks;
		this.controls = {};						// {controlId: control}

		controls.forEach(function(control) {
			that.controls[control.controlId] = control;
		});
	}

	/*
	 * GameState stores info about the current state of the game
	 */

	function GameState(game) {
		this.players = [];
		this.tasks = [];
		this.state = "PRE_GAME";
		this.assignedControls = {};
		this.level = 0;

		this.health = 100;
		this.score = 100;

		this.game = game;

		console.log("New game state set up!");
	}

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

	/*
	 *	Manages the Task list, removes tasks when they expire
	 *  and replaces them with a new task.
	 *  TODO: implement TaskManager!!!
	 */
	function TaskManager() {
		tasks = {
			0: null,
			1: null,
			2: null,
			3: null
		};
	}

	TaskManager.prototype.failTask = function(task) {
		// TODO: kill Task; remove it from tasks array

		// TODO: deduct health from gamestate

		// make a new task
		this.newTask();
	};

	TaskManager.prototype.fulfillTask = function(task) {
		// kill existing timer
		clearTimeout(task.timeoutId);

		// TODO: kill Task; remove it from this.tasks
		
		// add new task
		this.newTask();

		// TODO: increase score in gamestate
	};

	TaskManager.prototype.newTask = function() {
		newTask = _.first(_.shuffle(TASKS));

		// TODO: pick new task at random from Game.tasks
		// TODO: make sure chosen tasks do not act on the same controlId
		// TODO: make sure each controlId belongs to a control which belongs to a player

		// TODO: start timer on task, should call this.failTask after task.timeLimit time

		// TODO: emit task to client, keep track of which client

	};

	function Task(text, requiredValue, timeLimit, controlId) {
		this.text = text;
		this.controlId = controlId || null;
		this.requiredValue = requiredValue;
		this.timeLimit = timeLimit;

		this.timeoutId = null;
	}

	GameState.prototype.addPlayer = function(socket, controlCount, type) {
		var id = this.players.length + 1;
		newPlayer = new Player(socket, controlCount, type, id);
		this.players.push(newPlayer);
		return newPlayer;
	};

	GameState.prototype.startGame = function() {
		console.log("Attempting to start game...");

		if (this.players.length === config.PLAYERS_PER_ROOM && this.state == "PRE_GAME") {
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
		// TODO: emit LEVEL_END
		// TODO: start next level in 5 seconds
		// TODO: set state to INTERMISSION
		return true;
	};

	GameState.prototype.startLevel = function() {
		// clear control and task state:
		this.assignedControls = {};
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
		setTimeout(this.endLevel, config.LEVEL_TIME_LIMIT[this.level]);
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

	/*
	* Pick controls suitable for each client and emit them to the client
	*/

	GameState.prototype.assignControls = function(controls) {
		var controlPool = _.shuffle(this.game.controls);

		gameState = this;

		// TODO: somehow figure out how controls are to be split up based on types the client accepts
		// TODO: assign # of controls dynamically based on # of controls accepted per player instead of hardcoded 2
		this.players.forEach(function(player) {
			_.range(2).forEach(function(){
				var control = controlPool.pop();
				player.controls.push(control);
				gameState.assignedControls[control.controlId] = control;
			});
		});

		// tell each client about the controls they were assigned
		this.players.forEach(function(player) {
			player.socket.emit("ASSIGN_CONTROLS", {
				controls: player.controls
			});
		});

		console.log("assigned these controls", gameState.assignedControls)
	};

	GameState.prototype.assignTasks = function() {
		// TODO: when TaskManager is done implemented, this should just call TaskManager.newTask 4 times.

		// shuffle and take the first 4 tasks
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

	/*
	* Handle ACTION event from client.
	*/

	GameState.prototype.doAction = function(controlId, value) {
		// check that state is LEVEL_IN_PROGRESS
		if (this.state != "LEVEL_IN_PROGRESS") return false;

		console.log(this.assignedControls)

		// set control currentvalue
		control = this.assignedControls[controlId];
		console.log("CLIENT SET: ", control.name, " to: ", value);
		control.currentValue = value;

		foo = _.find(this.tasks, function(task) {
			return task.controlId == controlId;
		});

		console.log(foo);

		// TODO: if value is equal to the task's required value, call task.fulfillTask()

	};

	return {
		Game: Game,
		GameState: GameState,
		Task: Task,
		Player: Player,
		Control: Control,
		TaskManager: TaskManager
	};
};