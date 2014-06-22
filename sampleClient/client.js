var socket = io();

$("#join").on('click', function() {
	console.log('Attempting to join.');

	socket.emit("JOIN", {
		client: {
			controlCount: 4,
			type: "web"
		}
	});

});

$("#startGame").on('click', function() {
	console.log('Attempting to start game!');

	socket.emit("GAME_START", {});
});

socket.on('LEVEL_START', function(data) {
	if (data.success === true) {
		console.log("Game started!");
	}
	else if (data.success === false) {
		console.log("Someone tried to start the game, but that failed.");
	}
});

socket.on('JOIN', function(data){
	console.log("Successfully joined as player #", data.playerId);
});