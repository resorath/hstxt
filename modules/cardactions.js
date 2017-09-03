// Battlecries and spells (on play effects)

var helpers = require('./helpers');
var util = require('./util');
var execution = require('./execution');
var constants = require('./constants');
var buffs = require('./Buff');
var engineering = require('./engineering');
var display = require('./display');

// card actions by internal CardID
// spells, battlecries, and buff loading for actions/deathrattles
module.exports = {

	// The Coin
	GAME_005: function(socket, sourcecard, target, parts)
	{
		console.log("playing the coin");

		player = helpers.getPlayerBySocket(socket, false);

		if(player.mana < 10)
			player.mana++;

		socket.emit('terminal', '[[;lightblue;]You gain one mana (this turn)]\n');

	},

	// shield block
	EX1_606: function(socket, sourcecard, target, parts)
	{
		var o = helpers.getGameObjectsBySocket(socket);

		socket.emit('terminal', '[[;lightblue;]You gain 5 armor\n\n');
		o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s gains 5 armor\n\n');
		
		o.players.self.armor += 5;

		execution.drawCard(socket);

	},

	// Arcane Missiles
	EX1_277: function(socket, sourcecard, target, parts)
	{
		console.log("Playing arcane missiles");

		var o = helpers.getGameObjectsBySocket(socket);

		socket.emit('terminal', '[[;lightblue;]Your fingers glow a soft blue...\n\n');
		o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s fingers glow a soft blue...\n\n');
		

		util.doMultipleThingsSlowly(function() {

			if(o.boards.opponent.length == 0)
			{
				o.sockets.self.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				
				execution.damagePlayer(o.game, o.players.opponent, 1);
				return;
			}

			var targetindex = util.RandomInt(0, o.boards.opponent.length); // all cards + opponent

			if(targetindex == o.boards.opponent.length)
			{
				o.sockets.self.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to your opponent\'s hero\n\n');
				o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your hero\n\n');
				execution.damagePlayer(o.game, o.players.opponent, 1);
				return;
			}
			else
			{
				o.sockets.self.emit('terminal', '[[;lightblue;]Your arcane missiles deal 1 damage to '+ o.boards.opponent[targetindex]['name'] +'\n\n');
				o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s arcane missiles deal 1 damage to your '+ o.boards.opponent[targetindex]['name'] + ']\n\n');

				engineering.damageCard(o.game, o.boards.opponent[targetindex], 1);
				return;
			}

		}, 500, 3 + o.players.self.spellpower);

	},

	// Fireball
	CS2_029: function(socket, sourcecard, target, parts)
	{
		console.log("playing fireball");

		var o = helpers.getGameObjectsBySocket(socket);

		var game = o.game;

		var player = o.players.self;
		var opponent = o.players.opponent;
		var opponentsocket = o.sockets.opponent;

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
		
			engineering.damageCard(game, target, damage);
		}

	},

	// Pyroblast
	EX1_279: function(socket, sourcecard, target, parts)
	{
		console.log("playing pyroblast");

		var o = helpers.getGameObjectsBySocket(socket);

		var game = o.game;

		var player = o.players.self;
		var opponent = o.players.opponent;
		var opponentsocket = o.sockets.opponent;

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
		
			engineering.damageCard(game, target, damage);
		}

	},

	// Arcane explosion
	CS2_025: function(socket, sourcecard, target, parts)
	{
		console.log("playing arcane explosion");

		var o = helpers.getGameObjectsBySocket(socket);

		var game = o.game;

		var player = o.players.self;
		var opponent = o.players.opponent;
		var enemyboard = o.boards.opponent;
		var opponentsocket = o.sockets.opponent;

		var damage = 1 + player.spellpower;

		socket.emit('terminal', '[[;lightblue;]You emit a powerful arcane shockwave]\n\n');
		opponentsocket.emit('terminal', '[[;lightblue;]Your opponent emits a powerful arcane shockwave]\n\n');

		enemyboard.forEach(function(card)
		{
			socket.emit('terminal', '[[;lightblue;]Your arcane explosion deals '+damage+' to '+card.name+']\n');
			opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s arcane explosion deals '+damage+' to '+card.name+']\n');

			engineering.damageCard(game, card, damage);
		})

	},

	// Arcane intellect
	CS2_023: function(socket, sourcecard, target, parts)
	{
		util.doMultipleThingsSlowly(function() {

			execution.drawCard(socket);

		}, 1000, 2);
	},

	// Novice Engineer
	EX1_015: function(socket, sourcecard, target, parts)
	{
		execution.drawCard(socket);
	},

	// Polymorph
	CS2_022: function(socket, sourcecard, target, parts)
	{
		var o = helpers.getGameObjectsBySocket(socket);

		// get victim card owner
		var socketowner = helpers.getSocketFromCard(o.game, target);

		// announce spell
		o.game.io.to(o.game.name).emit('terminal', target.name + ' is transformed into a sheep!\n');

		// remove target card, replace it with sheep (CS2_tk1) in same position
		var index = engineering.removeCard(o.game, target, false);

		// get sheep card ready
		var sheep = helpers.getCardById("CS2_tk1");
		sheep.ownernumber = helpers.getPlayerBySocket(socketowner).number;

		// show sheep
		o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(sheep));

		// put sheep where the minion used to be
		execution.summonMinion(socketowner, sheep, index);
	},

	// Nightblade
	EX1_593: function(socket, sourcecard, target, parts)
	{		
		var o = helpers.getGameObjectsBySocket(socket);

		var damage = 3 + o.players.self.spellpower;

		o.sockets.self.emit('terminal', '[[;lightblue;]You deal ' + damage + ' to your opponent]\n\n');
		o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent deals ' + damage + ' to you!]\n\n');

		execution.damagePlayer(o.game, o.players.opponent, damage);
		

	},

}






