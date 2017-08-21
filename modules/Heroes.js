var constants = require('./constants');

module.exports = {

	// the heroes themselves
	MAGE: {

		name: "Jaina",

		heropower: {

			name: "Firebolt",
			cost: 2,
			ready: true,
			targetrequired: true,
			cast: function(socket, target) {

				var o = helpers.getGameObjectsBySocket(socket);

				var damage = 1;

				if(target == constants.selftarget)
				{
					socket.emit('terminal', '[[;lightblue;]Your firebolt explodes violently in your hands, dealing '+ damage +' damage!]\n\n');
					opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt explodes in their hands! dealing '+ damage + 'damage]\n\n');
				
					execution.damagePlayer(o.game, o.players.self, damage);
				}

				else if(target == constants.opponenttarget)
				{
					socket.emit('terminal', '[[;lightblue;]Your firebolt streaks across the board to your opponent, dealing '+ damage +' damage]\n\n');
					opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt hits you for '+ damage + ' damage!]\n\n');
				
					execution.damagePlayer(o.game, o.players.opponent, damage);
				}

				else
				{
					socket.emit('terminal', '[[;lightblue;]Your firebolt collides with '+ target.name + ', dealing ' + damage +' damage]\n\n');
					opponentsocket.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt collides with ' + target.name + ', dealing ' + damage + ' damage!]\n\n');
				
					engineering.damageCard(o.game, target, damage);
				}

			}

		}
	},

	PRIEST: function() {},

	WARLOCK: function() {},

	DRUID: function() {},

	ROGUE: function() {},

	SHAMAN: function() {},

	HUNTER: function() {},

	PALADIN: function() {},

	WARRIOR: function() {},

}