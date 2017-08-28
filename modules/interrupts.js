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
* onleaveplay
*
* signature
* game: game to act on
* selectedcard: the card picked up on the loop which has the effect
* sourcecard: the card that triggered the effect
* targetcard: card that may be impacted by the trigger
*/

module.exports = {

	// raid leader
	CS2_122: {


		// remove aura
		onleaveplay: function(game, selectedcard, sourcecard, targetcard) {

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

		},

		// give aura to cards
		onplay: function(game, selectedcard, sourcecard, targetcard) {

			// raid leader start aura
			if(selectedcard == sourcecard)
			{
				var buff = new buffs.Buff("Raid leader aura");

				buff.changeattack = 1;
				buff.sourcecard = sourcecard;
				buff.isaura = true;

				var friendlyboard = helpers.getBoardBySocket(game.getSocketByPlayerNumber(selectedcard.ownernumber), false);

				friendlyboard.forEach(function(card)
				{
					if(card != sourcecard)
						engineering.addBuff(card, buff);
				});

			}
			// raid leader give aura to new cards on board
			else
			{
				console.log("Adding buff to " + sourcecard.name);

				var buff = new buffs.Buff("Raid leader aura");

				buff.changeattack = 1;
				buff.isaura = true;
				buff.sourcecard = selectedcard;

				engineering.addBuff(sourcecard, buff);
			}
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