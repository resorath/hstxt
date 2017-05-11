var helpers = require('./helpers');

// card actions by internal CardID
module.exports = {

	// The Coin
	GAME_005: function(socket, parts)
	{
		player = helpers.getPlayerBySocket(socket, false);

		if(player.mana < 10)
			player.mana++;

		socket.emit('terminal', '[[;lightblue;black]You gain one mana (this turn)]\n');

	}

}