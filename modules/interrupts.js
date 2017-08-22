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
			if(selectedcard == sourcecard)
				return;

			console.log("Adding buff to " + sourcecard.name);

			var buff = new buffs.Buff("Raid leader aura");

			buff.changeattack = 1;
			buff.isaura = true;
			buff.sourcecard = selectedcard;

			engineering.addBuff(sourcecard, buff);
		}

	},


	
}