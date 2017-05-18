var helpers = require('./helpers');
var util = require('./util');
var execution = require('./execution');
var constants = require('./constants');

// card actions by internal CardID
module.exports = {

	// The Coin
	GAME_005: function(socket, parts)
	{
		player = helpers.getPlayerBySocket(socket, false);

		if(player.mana < 10)
			player.mana++;

		socket.emit('terminal', '[[;lightblue;]You gain one mana (this turn)]\n');

		return true;

	},

	// Arcane Missiles
	EX1_277: function(socket, parts)
	{
		console.log("Playing arcane missiles");

		var game = helpers.getGameBySocket(socket);
		var player = helpers.getPlayerBySocket(socket, false);
		var opponent = helpers.getPlayerBySocket(socket, true);
		var enemyboard = helpers.getBoardBySocket(socket, true);

		var opponentsocket = helpers.getOppositePlayerSocket(socket);

		socket.emit('terminal', '[[;lightblue;] Your fingers glow a soft blue...\n\n');
		opponentsocket.emit('terminal', '[[;lightblue;] Your opponent\'s fingers glow a soft blue...\n\n');
		

		util.doMultipleThingsSlowly(function() {

			if(enemyboard.length == 0)
			{
				socket.emit('terminal', '[[;lightblue;] Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;] Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				
				execution.damagePlayer(game, opponent, 1);
				return;
			}

			var targetindex = util.RandomInt(0, enemyboard.length); // all cards + opponent

			if(targetindex == enemyboard.length)
			{
				socket.emit('terminal', '[[;lightblue;] Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;] Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				execution.damagePlayer(game, opponent, 1);
				return;
			}
			else
			{
				socket.emit('terminal', '[[;lightblue;] Your arcane missiles deal 1 damage to '+ enemyboard[targetindex]['name'] +'\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;] Your opponent\'s arcane missiles deal 1 damage to your '+ enemyboard[targetindex]['name'] + ']\n\n');

				execution.damageCard(game, enemyboard[targetindex], 1);
				return;
			}

		}, 500, 3 + player.spellpower);

		return true;
	},

	// Fireball
	CS2_029: function(socket, parts)
	{

	}

}