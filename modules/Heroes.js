var constants = require('./constants');
var helpers = require('./helpers');
var engineering = require('./engineering');
var execution = require('./execution');
var display = require('./display');

module.exports = {

	// the heroes themselves
	MAGE: {

		name: "Jaina",

		heropower: {

			name: "Fireblast",
			cost: 2,
			ready: true,
			targetrequired: true,
			cast: function(socket, target) {
				
				var o = helpers.getGameObjectsBySocket(socket);

				var damage = 1;

				var heropowercard = helpers.getCardById("CS2_034");
				console.log(heropowercard);
				
				o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(heropowercard));

				if(target == constants.selftarget)
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your fireblast explodes violently in your hands, dealing '+ damage +' damage!]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s fireblast explodes in their hands! dealing '+ damage + ' damage]\n');
				
					execution.damagePlayer(o.game, o.players.self, damage);
				}

				else if(target == constants.opponenttarget)
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your fireblast streaks across the board to your opponent, dealing '+ damage +' damage]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s fireblast hits you for '+ damage + ' damage!]\n');
				
					execution.damagePlayer(o.game, o.players.opponent, damage);
				}

				else
				{
					o.sockets.self.emit('terminal', '[[;lightblue;]Your fireblast collides with '+ target.name + ', dealing ' + damage +' damage]\n');
					o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent\'s fireblast collides with ' + target.name + ', dealing ' + damage + ' damage!]\n\n');
				
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

				var heropowercard = helpers.getCardById("CS1h_001_H1");

				o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(heropowercard));

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

	WARLOCK: {

		name: "Gul'dan",

		heropower: {

			name: "Life Tap",
			cost: 2,
			ready: true,
			targetrequired: false,
			cast: function(socket, target) {
				
				var o = helpers.getGameObjectsBySocket(socket);

				var damage = 2;

				var heropowercard = helpers.getCardById("CS2_056");

				o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(heropowercard));

				o.sockets.self.emit('terminal', '[[;lightblue;]You suffer '+ damage+ ' damage]\n');
				o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent suffers ' + damage + ' damage]\n\n');
			

				execution.damagePlayer(o.game, o.players.self, damage);

				execution.drawCard(socket);

			}

		}
	},


	ROGUE: function() {},

	SHAMAN: function() {},

	HUNTER: function() {},

	PALADIN: {

		name: "Uther",

		heropower: {

			name: "Reinforce",
			cost: 2,
			ready: true,
			targetrequired: false,
			cast: function(socket, target) {
				
				var o = helpers.getGameObjectsBySocket(socket);

				if(o.boards.self.length >= 7)
				{
					o.sockets.self.emit('terminal', 'There is no room on the board!\n');
					return;
				}

				var heropowercard = helpers.getCardById("CS2_101");
				var recruit = helpers.getCardById("CS2_101t");

				o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(heropowercard));

				o.game.io.to(o.game.name).emit('terminal', "[[;#FFBDC0;]&lt;Silver Hand Recruit&gt; Ready for action!]\n");

				// put recruit on board (last position)
				o.boards.self.splice(o.boards.self.length, 0, recruit);

			}

		}
	},

	WARRIOR: {

		name: "Garrosh",

		heropower: {

			name: "Armor up!",
			cost: 2,
			ready: true,
			targetrequired: false,
			cast: function(socket, target) {
				
				var o = helpers.getGameObjectsBySocket(socket);

				var armor = 2;

				var heropowercard = helpers.getCardById("CS2_102");

				o.game.io.to(o.game.name).emit('terminal', display.printDetailedCard(heropowercard));

				o.sockets.self.emit('terminal', '[[;lightblue;]You gain '+ armor+ ' armor]\n');
				o.sockets.opponent.emit('terminal', '[[;lightblue;]Your opponent gains ' + armor + ' armor]\n\n');

				o.players.self.armor+2;

			}

		}
	},


	DRUID: function() {}

}