var constants = require('./constants');
var helpers = require('./helpers');
var engineering = require('./engineering');
var execution = require('./execution');

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
					o.sockets.self.emit('terminal', '[[;lightblue;]Your firebolt explodes violently in your hands, dealing '+ damage +' damage!]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt explodes in their hands! dealing '+ damage + 'damage]\n');
				
					execution.damagePlayer(o.game, o.players.self, damage);
				}

				else if(target == constants.opponenttarget)
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your firebolt streaks across the board to your opponent, dealing '+ damage +' damage]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt hits you for '+ damage + ' damage!]\n');
				
					execution.damagePlayer(o.game, o.players.opponent, damage);
				}

				else
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your firebolt collides with '+ target.name + ', dealing ' + damage +' damage]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s firebolt collides with ' + target.name + ', dealing ' + damage + ' damage!]\n\n');
				
					engineering.damageCard(o.game, target, damage);
				}

			}

		}
	},

	PRIEST: {

		name: "Anduin",

		heropower: {

			name: "Lesser Heal",
			cost: 2,
			ready: true,
			targetrequired: true,
			cast: function(socket, target) {
				
				var o = helpers.getGameObjectsBySocket(socket);

				var heal = 2;

				if(target == constants.selftarget)
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]The warmth of your spell heals for '+ heal +' health!]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s lesser heal restores '+ heal + 'health to themselves]\n');
				
					execution.healPlayer(o.game, o.players.self, heal);
				}

				else if(target == constants.opponenttarget)
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your spell heals your opponent for '+ heal +' health]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s lesser heal restores '+ heal + ' health to you!]\n');
				
					execution.healPlayer(o.game, o.players.opponent, heal);
				}

				else
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your spell heals '+ target.name + ' for ' + heal +' health]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s lesser heal restores ' + heal + ' health to ' + target.name + ']\n\n');
				
					engineering.healCard(o.game, target, heal);
				}

			}

		}
	},

	WARLOCK: function() {},

	DRUID: function() {},

	ROGUE: function() {},

	SHAMAN: function() {},

	HUNTER: function() {},

	PALADIN: function() {},

	WARRIOR: function() {}

}