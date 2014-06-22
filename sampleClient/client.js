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
	console.log("Game started!");
});

socket.on('JOIN', function(data){
	console.log("Successfully joined as player #", data.playerId);
});