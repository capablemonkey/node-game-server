node-game-server
================

This is a server for an attempted clone of the popular mobile game [Spaceteam](http://www.sleepingbeastgames.com/spaceteam/).  It uses `sockets.io` to receive instructions from game clients and push instructions and game state information.  Keeps track of game state, and implements game logic.

A sample client implemented in JS is included to demonstrate the commands and protocol supported by the server.

This Spaceteam clone, Spaceteem, had originally hoped to integrate an Oculus Rift, a Google Glass, 4 Pebble smartwatches, tablets, a Chromebook, a PS3 controller, a Sphereo, and a Magic Mouse to take Spaceteam to a new level.  Conceived at a hackathon, we gave up on building the clients needed at 5AM due to severe mental exhaustion.  But, the server is mostly implemented.

Interface
=========
Server sends / client receives
------------------------------
ASSIGN_CONTROLS

	{
		controls: [
	{
	type: “toggle”,
	name: “Shitty music”,
	values: [“on”, “off”],
	controlId: “abx123”
	},
	{
	type: “button”,
	name: “Button Label”,
	controlId: “abx123”
	},
	…
	]
	}

TASK
	{
		task: {
			“text”: “Move nipple left”,
			“time”: 5000				// int, miliseconds
		}
	}

LEVEL_START
	{
		level: 1
	}

LEVEL_END
	{
		level: 1
	}

GAME_STATE
	{
		state: {
			“health”: 100,
			“score”: 100,
			“players”: 4,
			“status”: “PRE_GAME”
		}
	}

Client sends / server receives

JOIN
Client sends:

	{
		client: {
			controlCount: 4,
			type: “pebble”,
			accepts: [“button”, “shake”, “flip”, “slider”]
		}
	}

Server responds:
	{
		playerId: 3
	}

GAME_START
Client sends:
	{
		// empty
	}

Server responds: 
	{
		success: false		// or true, if successfully started
	}

ACTION
	{
		action: {
			controlId: “abx123”,
			type: “type”,
			value: “on”
		}
	}

Controls
========
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
		name: ‘Button Label’,
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

Game State
==========
status:
- PRE_GAME
- GAME_STARTED
- LEVEL_IN_PROGRESS
- INTERMISSION
health
score
players

Protocol
========
1. Client establishes connection with server.  Server begins to send GAME_STATE every 1 second.
2. Client sends JOIN to server to join game.   Server acknowledges.
3. One client sends GAME_START when players are ready.
4. If 4 players joined, game will start.  Server sends LEVEL_START.
5. Server sends ASSIGN_CONTROLS to clients.
6. Server sends a TASK to client.
7. Client will set any subsequent tasks received as the “current” task.
8. Client sends ACTION to server when input is given
9. Server continues to send GAME_STATE to client.
10. Client will display state to user (health of ship, etc.)
11. Server sends LEVEL_END to clients when level ends.
