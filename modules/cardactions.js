var helpers = require('./helpers');
var util = require('./util');
var execution = require('./execution');
var constants = require('./constants');

// card actions by internal CardID
module.exports = {

	// The Coin
	GAME_005: function(socket, target, parts)
	{
		player = helpers.getPlayerBySocket(socket, false);

		if(player.mana < 10)
			player.mana++;

		socket.emit('terminal', '[[;lightblue;]You gain one mana (this turn)]\n');

		return true;

	},

	// Arcane Missiles
	EX1_277: function(socket, target, parts)
	{
		console.log("Playing arcane missiles");

		var game = helpers.getGameBySocket(socket);
		var player = helpers.getPlayerBySocket(socket, false);
		var opponent = helpers.getPlayerBySocket(socket, true);
		var enemyboard = helpers.getBoardBySocket(socket, true);

		var opponentsocket = helpers.getOppositePlayerSocket(socket);

		socket.emit('terminal', '[[;lightblue;]Your fingers glow a soft blue...\n\n');
		opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s fingers glow a soft blue...\n\n');
		

		util.doMultipleThingsSlowly(function() {

			if(enemyboard.length == 0)
			{
				socket.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				
				execution.damagePlayer(game, opponent, 1);
				return;
			}

			var targetindex = util.RandomInt(0, enemyboard.length); // all cards + opponent

			if(targetindex == enemyboard.length)
			{
				socket.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				execution.damagePlayer(game, opponent, 1);
				return;
			}
			else
			{
				socket.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to '+ enemyboard[targetindex]['name'] +'\n\n');
				opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your '+ enemyboard[targetindex]['name'] + ']\n\n');

				execution.damageCard(game, enemyboard[targetindex], 1);
				return;
			}

		}, 500, 3 + player.spellpower);

		return true;
	},

	// Fireball
	CS2_029: function(socket, target, parts)
	{
		console.log("playing fireball");

		var game = helpers.getGameBySocket(socket);

		var player = helpers.getPlayerBySocket(socket, false);
		var opponent = helpers.getPlayerBySocket(socket, true);

		var opponentsocket = helpers.getOppositePlayerSocket(socket);

		var damage = 6 + player.spellpower;

		if(target == constants.selftarget)
		{
			socket.emit('terminal', '[[;lightblue;]Your fireball explodes violently in your hands, dealing '+ damage +' damage!]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s fireball explodes in their hands! dealing '+ damage + 'damage]\n\n');
		
			execution.damagePlayer(game, player, damage);
		}

		else if(target == constants.opponenttarget)
		{
			socket.emit('terminal', '[[;lightblue;]Your fireball streaks across the board to your opponent, dealing '+ damage +' damage]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s fireball hits you for '+ damage + ' damage!]\n\n');
		
			execution.damagePlayer(game, opponent, damage);
		}

		else
		{
			socket.emit('terminal', '[[;lightblue;]Your fireball collides with '+ target.name + ', dealing ' + damage +' damage]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s fireball collides with ' + target.name + ', dealing ' + damage + ' damage!]\n\n');
		
			execution.damageCard(game, target, damage);
		}

		return true;

	},

	// Pyroblast
	EX1_279: function(socket, target, parts)
	{
		console.log("playing pyroblast");

		var game = helpers.getGameBySocket(socket);

		var player = helpers.getPlayerBySocket(socket, false);
		var opponent = helpers.getPlayerBySocket(socket, true);
		var opponentsocket = helpers.getOppositePlayerSocket(socket);

		var damage = 10 + player.spellpower;

		if(target == constants.selftarget)
		{
			socket.emit('terminal', '[[;lightblue; You hurl an immense fiery boulder at... yourself, dealing '+ damage +' damage!]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent hurls an immense fiery boulder at... themselves! dealing '+ damage + 'damage]\n\n');
		
			execution.damagePlayer(game, player, damage);
		}

		else if(target == constants.opponenttarget)
		{
			socket.emit('terminal', '[[;lightblue;]You hurl an immense fiery boulder at your opponent, dealing '+ damage +' damage]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent hurls an immense fiery boulder at you, dealing '+ damage + ' damage!]\n\n');
		
			execution.damagePlayer(game, opponent, damage);
		}

		else
		{
			socket.emit('terminal', '[[;lightblue;]You hurl an immense fiery boulder at '+ target.name + ', dealing ' + damage +' damage]\n\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent hurls an immense fiery boulder at ' + target.name + ', dealing ' + damage + ' damage!]\n\n');
		
			execution.damageCard(game, target, damage);
		}

		return true;

	},

	// Arcane explosion
	CS2_025: function(socket, target, parts)
	{
		console.log("playing pyroblast");

		var game = helpers.getGameBySocket(socket);

		var player = helpers.getPlayerBySocket(socket, false);
		var opponent = helpers.getPlayerBySocket(socket, true);
		var enemyboard = helpers.getBoardBySocket(socket, true);
		var opponentsocket = helpers.getOppositePlayerSocket(socket);

		var damage = 1 + player.spellpower;

		socket.emit('terminal', '[[;lightblue;]You emit a powerful arcane shockwave]\n\n');
		opponentsocket.emit('terminal', '[[;lightblue;]Your opponent emits a powerful arcane shockwave]\n\n');
		

		for(cardid in enemyboard)
		{
			var card = enemyboard[cardid];

			socket.emit('terminal', '[[;lightblue;]Your arcane explosion deals '+damage+' to '+card.name+']\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\' arcane explosion deals '+damage+' to '+card.name+']\n');

			execution.damageCard(game, card, damage);
		}

	},

	// Novice Engineer
	EX1_015: function(socket, target, parts)
	{
		execution.drawCard(socket);
	}

}






