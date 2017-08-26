/* Standalone modifications to cards */
var helpers = require('./helpers');
var constants = require('./constants');
var gamevars = require('./gamevars');

module.exports = {

	addBuff: function(card, buff)
	{
		card.buffs.push(buff);

		// apply buff
		card.attack += buff.changeattack;
		card.health += buff.changehealth;
		card.cost += buff.changemana;


		if(card.attack < 0)
			card.attack = 0;

		if(card.health < 1)
			card.health = 1;

		if(card.cost < 0)
			card.cost = 0;

	},

	removeBuff: function(card, buff)
	{		
		for(buffid in card.buffs)
		{
			var cardbuff = card.buffs[buffid];

			if(cardbuff == buff)
			{
				card.buffs.splice(buffid, 1);
			}
		}

		// remove buff
		card.attack -= buff.changeattack;

		card.health -= buff.changehealth;

		card.cost -= buff.changemana;


		if(card.attack < 0)
			card.attack = 0;

		if(card.health < 1)
			card.health = 1;

		if(card.cost < 0)
			card.cost = 0;

	},

	damageCard: function(agame, card, amount)
	{
		card.health -= amount;

		// do on damage trigger
		gamevars.triggers.emit('doTrigger', constants.triggers.onminiondamaged, agame, card, null);

		if(card.health <= 0)
		{
			agame.io.to(agame.name).emit('terminal', card['name'] + " is destroyed!\n");

			module.exports.removeCard(agame, card, true);
		}
	},

	healCard: function(agame, card, amount)
	{
		// need original values of card
		var basecard = helpers.getCardById(card.id);

		// determine how much can be healed
		var healamount = basecard.health - card.health;
		if(healamount > amount)
			healamount = amount;

		// heal card
		card.health += amount;

		// enforce maximum health
		if(card.health > basecard.health)
			card.health = basecard.health;

		gamevars.triggers.emit('doTrigger', constants.triggers.onheal, agame, card, null);

		// return how much was healed
		return healamount;

	},

	// removes a card from the board, and optionally triggers its deathrattle
	removeCard: function(agame, card, deathrattle)
	{
		// who owned this card?
		var playerid = card.ownernumber;

		var board = null;

		if(playerid == 1)
			board = agame.board.p1;
		else if(playerid == 2)
			board = agame.board.p2;
		else
			console.log("FATAL: Card not owned");

		if(deathrattle)
		{
			//module.exports.doTrigger(constants.triggers.ondeath, agame, card, null);
	  		gamevars.triggers.emit('doTrigger', constants.triggers.ondeath, agame, card, null);
		}

		var index = board.indexOf(card);

		board.splice(index, 1);

	},



}