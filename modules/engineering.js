/* Standalone modifications to cards */
var helpers = require('./helpers');
var constants = require('./constants');

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

	

}