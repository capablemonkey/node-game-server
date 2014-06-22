var socket = io();

$("#join").on('click', function() {
	console.log('Attempting to join.');

	socket.emit("JOIN", {
		client: {
			controlCount: 2,
			type: "web",
			accepts: ["button", "slider", "toggle", "dial"]
		}
	});

});

$("#startGame").on('click', function() {
	console.log('Attempting to start game!');

	socket.emit("GAME_START", {});
});

$("#restartGame").on('click', function() {
	console.log('Restarting game!');

	socket.emit("GAME_RESTART", {});
});

socket.on('GAME_START', function(data) {
	if (data.success === true) {
		console.log("Game started!");
	}
	else if (data.success === false) {
		console.log("Someone tried to start the game, but that failed.");
	}
});

socket.on('LEVEL_START', function(data) {
	console.log("Level #", data.level ," started!");
});

socket.on('JOIN', function(data){
	console.log("Successfully joined as player #", data.playerId);
});

socket.on('GAME_STATE', function(data) {
	console.log(data);
});

socket.on('ASSIGN_CONTROLS', function(data) {
	console.log("You are assigned these controls: ", data.controls);
})