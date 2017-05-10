module.exports = {

	// nicely print a card to a player
	printCard: function(card, socket)
	{
	  if(card["type"] == "MINION")
	    return card["name"] + " [" + card["attack"] + "/" + card["health"] + "] (" + card["cost"] + ")";
	  if(card["type"] == "SPELL")
	    return card["name"] + " (" + card["cost"] + ")";
	},

	printDetailedCard: function(card)
	{
	  if(card["type"] == "MINION")
	  {
	    var returnval = "\n[[b;white;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + " Attack: " + card["attack"] + " Health: " + card["health"] + "\n";
	    returnval += card["rarity"] + " " + card["type"] + " " + card["race"] + "\n";
	    returnval += card["text"] + "\n";
	    return returnval;
	  }
	  if(card["type"] == "SPELL")
	  {
	    var returnval = "\n[[b;lightblue;black]" + card["name"] + "]\n" + "Cost: " + card["cost"] + "\n";
	    returnval += card["rarity"] + " " + card["type"] + "\n";
	    returnval += card["text"] + "\n";
	    return returnval;
	  }
	}


}