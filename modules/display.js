var helpers = require('./helpers');

module.exports = {

	// nicely print a card to a player
	printCard: function(card, showstatus)
	{
	  var returnval = "";

	  if(card["type"] == "MINION")
	  {	  	
	    returnval += card["name"] + " [" + card["attack"] + "/" + card["health"] + "] (" + card["cost"] + ")";

	    if(typeof card["canattack"] != 'undefined' && card["canattack"] && showstatus)
	  		returnval += " [[;lime;] (READY)]"; 

	  	if(helpers.cardHasMechanic(card, "TAUNT") && showstatus)
	  		returnval += " [[;gold;] (TAUNT)]";

	  	return returnval;
	  }
	  if(card["type"] == "SPELL")
	    return card["name"] + " (" + card["cost"] + ")";
	},

	printDetailedCard: function(card)
	{
	  if(card["type"] == "MINION")
	  {
	  	var returnval = "";

	    returnval += "[[b;white;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + " Attack: " + card["attack"] + " Health: " + card["health"] + "\n";

	    if(typeof card["rarity"] != 'undefined' && card["rarity"] != "FREE")
	   		returnval += card["rarity"] + " ";

	    if(typeof card["type"] != 'undefined')
	    	returnval += card["type"] + " ";

	    if(typeof card["race"] != 'undefined')
	    	returnval += card["race"] + " ";
	    
	    if(typeof card["text"] != 'undefined')
	    	returnval += "\n" + card["text"];

	    return "\n" + returnval + "\n";
	  }

	  if(card["type"] == "SPELL")
	  {
	    var returnval = "[[b;lightblue;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + "\n";
	    
	    if(typeof card["rarity"] != 'undefined' && card["rarity"] != "FREE")
	   		returnval += card["rarity"] + " ";

	    if(typeof card["type"] != 'undefined')
	    	returnval += card["type"];
	    
	    if(typeof card["text"] != 'undefined')
	    	returnval += "\n" + card["text"];

	    return "\n" + returnval + "\n";
	  }
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