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

	getPlayerBySocket: function(socket)
	{
	    if(socket != null && socket.player != null)
	      return socket.player;

	    return null;
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
	      returnVal = card;
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
	      returnVal = card;
	      return;
	    }
	  })

	  if(returnVal == null)
	    console.log("WARNING: couldn't find card by id " + id);

	  return returnVal;
	}

}