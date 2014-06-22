module.exports = {
	PLAYERS_PER_ROOM: 4,
	STATE_BROADCAST_INTERVAL: 1000,
	LEVEL_TIME_LIMIT: {
		1: 30000,
		2: 30000,
		3: 30000,
		4: 30000,
		5: 30000,
		6: 30000
	},

	// control types and their default values
	CONTROL_TYPES: {
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
	}
};

