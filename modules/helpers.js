var constants = require('./constants');

module.exports = {

	games: null,
	cards: null,
	decks: null,

	init: function(games, cards, decks) {
		this.games = games;
		this.cards = cards;
		this.decks = decks;
	},

	getHandBySocket: function(socket, getOppositeHand)
	{
	  // find game of socket first
	  var agame = this.getGameBySocket(socket);

	  if(agame != null)
	    return agame.getHand(socket, getOppositeHand);

	},

	getBoardBySocket: function(socket, getOppositeBoard)
	{
	  // find game of socket first
	  var agame = this.getGameBySocket(socket);

	  if(agame != null)
	    return agame.getBoard(socket, getOppositeBoard);
	},

	getDeckBySocket: function(socket, getOppositeDeck)
	{
	  // find game of socket first
	  var agame = this.getGameBySocket(socket);

	  if(agame != null)
	    return agame.getDeck(socket, getOppositeDeck);
	},

	getGameBySocket: function(socket)
	{
	    for(game in this.games)
	    {
	      var agame = this.games[game];
	      if(agame.p1socket != null && agame.p1socket.id == socket.id)
	      	 return agame;
	      if(agame.p2socket != null && agame.p2socket.id == socket.id)
	        return agame;
	    }
	    return null;
	},

	getPlayerNumberBySocket: function(socket)
	{
	    if(socket != null && socket.player != null)
	      return socket.player;

	    return null;
	},

	getPlayerBySocket: function(socket, getOppositeDeck)
	{
	  // find game of socket first
	  var agame = this.getGameBySocket(socket);

	  if(agame != null)
	    return agame.getPlayer(socket, getOppositeDeck);
	},

	boardIndexToCard: function(boardindex, socket)
	{

	  // opponent's board
	  if(boardindex.toLowerCase().charAt(0) == "o")
	  {
	    var index = Number(boardindex.substring(1)) - 1;
	    return this.getBoardBySocket(socket, true)[index];
	  }

	  // player's board
	  if(boardindex.toLowerCase().charAt(0) == "m")
	  {
	    var index = Number(boardindex.substring(1)) - 1;
	    return this.getBoardBySocket(socket, false)[index];
	  }

	  // player's hand
	  if(boardindex.toLowerCase().charAt(0) == "h")
	  {
	    var index = Number(boardindex.substring(1)) - 1;
	    return this.getHandBySocket(socket, false)[index];
	  }

	  return null;

	},

	getCardByName: function(name)
	{
	  var returnVal = null;

	  this.cards.forEach(function(card)
	  {
	    if(card["name"] && card["name"].toUpperCase() === name.toUpperCase() && 
	      ( card["type"] == "WEAPON" || card["type"] == "SPELL" || card["type"] == "MINION" ) )
	    {
	      //console.log("Found card: " + card["name"] + " id: " + card["id"]);

	      // create a new card from the database
	      returnVal = JSON.parse(JSON.stringify(card));
	      return;
	    }
	  })

	  if(returnVal == null)
	    console.log("WARNING: couldn't find card by name " + name);

	  return returnVal;
	},

	getCardById: function(id)
	{
	  var returnVal = null;

	  this.cards.forEach(function(card)
	  {
	    if(card["id"] && card["id"].toUpperCase() === id.toUpperCase())
	    {
	      // create a new card from the database
	      returnVal = JSON.parse(JSON.stringify(card));
	      return;
	    }
	  })

	  if(returnVal == null)
	    console.log("WARNING: couldn't find card by id " + id);

	  return returnVal;
	},

	// true false if card has specified mechanic
	cardHasMechanic: function(card, mechanic)
	{
		if(card == null || typeof card == 'undefined')
			return false;

		if(typeof card['mechanics'] == 'undefined')
			return false;

		return (card['mechanics'].indexOf(mechanic) > -1);
	},

	// FALSE or number if card has specificed play requirement
	cardHasPlayRequirement: function(card, requirement)
	{
		if(card == null || typeof card == 'undefined')
			return false;

		if(typeof card['playRequirements'] == 'undefined')
			return false;

		if(requirement in card['playRequirements'])
			return card['playRequirements'][requirement];
	},

	targetIsOpponent: function(target)
	{
		return (constants.synonymopponent.indexOf(target.toLowerCase()) > -1)
	},

	targetIsSelf: function(target)
	{
		return (constants.synonymself.indexOf(target.toLowerCase()) > -1)
	},

	getOppositePlayerSocket: function(socket)
	{
	  // find game of socket first
	  var agame = this.getGameBySocket(socket);

	  if(agame != null)
	  {
	  	if(agame.p1socket.id == socket.id)
	  		return agame.p2socket;
	  	else
	  		return agame.p1socket;

	  }

	},

	getSocketFromCard: function(game, card)
	{
		// determine owner
		var playernum = card.ownernumber;

		return game.getSocketByPlayerNumber(playernum);
	}

}