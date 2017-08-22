var helpers = require('./helpers');

module.exports = {

	// nicely print a card to a player
	// playstatus is optional, and is either 0 = can't play, 1 = can play, 2 = should play (e.g. combo)
	printCard: function(card, showstatus, playstatus)
	{

	  var returnval = "";

	  if(playstatus == null || typeof playstatus === 'undefined')
	  	playstatus = 0;

	  if(card["type"] == "MINION")
	  {	  	
	  	// get base card for comparison
	  	var basecard = helpers.getCardById(card.id);

	  	if(playstatus === 1)
			returnval += "[[;lime;]" + card["name"] + "] [";
	  	else if(playstatus === 2)
			returnval += "[[;yellow;]" + card["name"] + "] [";
	  	else
	    	returnval += card["name"] + " [";

	    if(card.attack < basecard.attack)
	    	returnval += "[[;red;]" + card.attack + "]";
	    else if(card.attack > basecard.attack)
	    	returnval += "[[;lime;]" + card.attack + "]";
	    else
	    	returnval += "[[;white;]" + card.attack + "]";

	    returnval += "/";

	    if(card.health < basecard.health)
	    	returnval += "[[;red;]" + card.health + "]";
	    else if(card.health > basecard.health)
	    	returnval += "[[;lime;]" + card.health + "]";
	    else
	    	returnval += "[[;white;]" + card.health + "]";

	    returnval += "] (" + card["cost"] + ")";

	    if(typeof card["canattack"] != 'undefined' && card["canattack"] && showstatus)
	  		returnval += " [[;lime;] (READY)]"; 

	  	if(helpers.cardHasMechanic(card, "TAUNT") && showstatus)
	  		returnval += " [[;gold;] (TAUNT)]";

	  }
	  else if(card["type"] == "SPELL")
	  {
	    
	  	if(playstatus === 1)
			returnval += "[[;lime;]" + card["name"] + "]";
	  	else if(playstatus === 2)
			returnval += "[[;yellow;]" + card["name"] + "]";
	  	else
	    	returnval += card["name"];

		returnval += " (" + card["cost"] + ")";
	  }

	  if(card["type"] == "WEAPON")
	  {	  	
	  	// get base card for comparison
	  	var basecard = helpers.getCardById(card.id);

	  	if(playstatus === 1)
			returnval += "[[;lime;]" + card["name"] + "] [";
	  	else if(playstatus === 2)
			returnval += "[[;yellow;]" + card["name"] + "] [";
	  	else
	    	returnval += card["name"] + " [";

	    if(card.attack < basecard.attack)
	    	returnval += "[[;red;]" + card.attack + "]";
	    else if(card.attack > basecard.attack)
	    	returnval += "[[;lime;]" + card.attack + "]";
	    else
	    	returnval += "[[;white;]" + card.attack + "]";

	    returnval += "/";

	    if(card.durability < basecard.durability)
	    	returnval += "[[;red;]" + card.durability + "]";
	    else if(card.durability > basecard.durability)
	    	returnval += "[[;lime;]" + card.durability + "]";
	    else
	    	returnval += "[[;white;]" + card.durability + "]";

	    returnval += "] (" + card["cost"] + ")";

	  }

	  return returnval;

	},

	printDetailedCard: function(card)
	{
	  var basecard = helpers.getCardById(card.id);

	  if(card["type"] == "MINION")
	  {
	  	// get base card for comparison

	  	var returnval = "";

	    returnval += "[[b;white;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + " Attack: ";

	    if(card.attack < basecard.attack)
	    	returnval += "[[;red;]" + card.attack + "]";
	    else if(card.attack > basecard.attack)
	    	returnval += "[[;lime;]" + card.attack + "]";
	    else
	    	returnval += "[[;white;]" + card.attack + "]";

	    returnval += " Health: ";

	    if(card.health < basecard.health)
	    	returnval += "[[;red;]" + card.health + "]";
	    else if(card.health > basecard.health)
	    	returnval += "[[;lime;]" + card.health + "]";
	    else
	    	returnval += "[[;white;]" + card.health + "]";

	    returnval += "\n";

	    if(typeof card["rarity"] != 'undefined' && card["rarity"] != "FREE")
	   		returnval += card["rarity"] + " ";

	    if(typeof card["type"] != 'undefined')
	    	returnval += card["type"] + " ";

	    if(typeof card["race"] != 'undefined')
	    	returnval += card["race"] + " ";
	    
	    if(typeof card["text"] != 'undefined')
	    	returnval += "\n" + card["text"];
	  }

	  if(card["type"] == "SPELL" || card["type"] == "HERO_POWER")
	  {
	    var returnval = "[[b;lightblue;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + "\n";
	    
	    if(typeof card["rarity"] != 'undefined' && card["rarity"] != "FREE")
	   		returnval += card["rarity"] + " ";

	    if(typeof card["type"] != 'undefined' && card["type"] != "HERO_POWER")
	    	returnval += card["type"];
	    
	    if(typeof card["text"] != 'undefined')
	    	returnval += "\n" + card["text"];

	  }

	  if(card["type"] == "WEAPON")
	  {
	  	var returnval = "[[b;#FFFFD5;]" + card["name"] + "]\n" + "Cost: " + card["cost"] + "\n";

	  	returnval += "Damage: ";

	    if(card.attack < basecard.attack)
	    	returnval += "[[;red;]" + card.attack + "]";
	    else if(card.attack > basecard.attack)
	    	returnval += "[[;lime;]" + card.attack + "]";
	    else
	    	returnval += "[[;white;]" + card.attack + "]";

	    returnval += " Durability: ";

	    if(card.durability < basecard.durability)
	    	returnval += "[[;red;]" + card.durability + "]";
	    else if(card.durability > basecard.health)
	    	returnval += "[[;lime;]" + card.durability + "]";
	    else
	    	returnval += "[[;white;]" + card.durability + "]";

	    returnval += "\n";

	  	if(typeof card["rarity"] != 'undefined' && card["rarity"] != "FREE")
	   		returnval += card["rarity"] + " ";

	    if(typeof card["type"] != 'undefined')
	    	returnval += card["type"];

	   	if(typeof card["text"] != 'undefined')
	    	returnval += "\n" + card["text"];
	  }


	    return "\n" + returnval + "\n";
	},


	printAvailableDecks: function(socket, decks)
	{
	  var printdeck = "Pick a deck: \n\n";

	  var i = 0;
	  for(deck in decks)
	  {
	    printdeck += i + ": " + decks[deck]["name"] + "\n";
	    i++;
	  }

	  socket.emit('terminal', printdeck);
	}


}