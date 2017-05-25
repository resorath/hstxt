// Registered actions for misc conditions

var helpers = require('./helpers');
var util = require('./util');
var execution = require('./execution');
var constants = require('./constants');

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

		ondeath: function(game, card) {
			
			console.log(card.name + " died! (deathrattle~~~~spooky)");

		}

	},


	
}