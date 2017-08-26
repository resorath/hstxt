// Registered actions for misc conditions

var helpers = require('./helpers');
var util = require('./util');
var constants = require('./constants');
var buffs = require('./Buff');
var engineering = require('./engineering');

/**
* onplay
* onattack
* onstartturn
* onendturn
* onherodamaged
* onminiondamaged
* onheal
* ondeath
*
* signature
* game: game to act on
* selectedcard: the card picked up on the loop
* sourcecard: the card that triggered the effect
* targetcard: card that may be impacted by the trigger
*/

module.exports = {

	// raid leader
	CS2_122: {

		// remove aura
		ondeath: function(game, selectedcard, sourcecard, targetcard) {

			// remove aura only affects if self died
			if(selectedcard != sourcecard)
				return;

			var friendlyboard = helpers.getBoardBySocket(game.getSocketByPlayerNumber(selectedcard.ownernumber));

			friendlyboard.forEach(function(card)
			{
				card.buffs.forEach(function(buff)
				{
					if(buff.sourcecard == sourcecard)
						engineering.removeBuff(card, buff)
				});
			});

			
			console.log(selectedcard.name + " died! (deathrattle~~~~spooky)");

		},

		// give aura to new cards
		onplay: function(game, selectedcard, sourcecard, targetcard) {

			// don't buff self on play
			if(selectedcard != sourcecard)
				return;

			var friendlyboard = helpers.getBoardBySocket(game.getSocketByPlayerNumber(selectedcard.ownernumber));

			var buff = new buffs.Buff("Raid leader aura");

			buff.changeattack = 1;
			buff.isaura = true;
			buff.sourcecard = selectedcard;

			friendlyboard.forEach(function(card)
			{
				engineering.addBuff(card, buff);
			});

			
		}

	},

	// healing totem
	AT_132_SHAMANa: {

		onendturn: function(game, card, a, b) {

			// only heal at end of owners turn
			if(!helpers.cardOwnedByPlayer(game, game.playerTurn, card))
				return;

			// go through each card in hand and heal it for spellpower amount
			var o = helpers.getGameObjectsByPlayerNumber(game, game.playerTurn);

			o.boards.self.forEach(function(c) {

				var amount = engineering.healCard(game, c, 1 + o.players.self.spellpower);

				if(amount > 0)
					o.game.io.to(o.game.name).emit('terminal', 'Healing totem heals ' + c.name + ' for ' + amount + '\n');

			});

		}

	}


	
}