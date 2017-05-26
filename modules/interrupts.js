// Registered actions for misc conditions

var helpers = require('./helpers');
var util = require('./util');
var constants = require('./constants');
var buffs = require('./Buff');

/**
* onplay
* onattack
* onstartturn
* onendturn
* onherodamaged
* onminiondamaged
* onheal
* ondeath
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
					if(buff.sourcecard == card)
						helpers.removeBuff(card, buff)
				});
			});

			
			console.log(selectedcard.name + " died! (deathrattle~~~~spooky)");

		},

		// give aura to new cards
		onplay: function(game, selectedcard, sourcecard, targetcard) {

			if(selectedcard != sourcecard)
				return;

			console.log("Adding buff to " + sourcecard.name);

			var buff = new buffs.Buff("Raid leader aura");

			buff.changeattack = 1;
			buff.sourcecard = selectedcard;

			helpers.addBuff(sourcecard, buff);
		}

	},


	
}