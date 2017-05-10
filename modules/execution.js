module.exports = {

	helpers: null,
	display: null,

	init: function(helpers, display)
	{
		this.helpers = helpers;
		this.display = display;
	},

	startGame: function(agame)
	{
	      // give 1 mana to player 1
	      agame.getPlayer(agame.getSocketByPlayerNumber(agame.playerTurn), false).mana = 1;
	      agame.getPlayer(agame.getSocketByPlayerNumber(agame.playerTurn), false).maxmana = 1;

	      // set round one
	      agame.round = 1;

	      agame.getHand(agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false)).push(this.helpers.getCardById("GAME_005"));
	      agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false).emit('terminal', '\n[[;lightblue;black]The Coin mysteriously appears in your hand...]');
	      agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false).emit('terminal', this.display.printDetailedCard(this.helpers.getCardById("GAME_005")));


	      // set up prompts
	      agame.updatePromptsWithDefault();

	      // start timer
	      this.activateTurnTimer(agame);

	      // tell first player to go
      	  agame.getSocketByPlayerNumber(agame.playerTurn).emit("terminal", "\n[[b;limegreen;black]Your turn!]\n");


	},

	endTurn: function(socket)
	{
	    var agame = this.helpers.getGameBySocket(socket);

	    if(!agame.isPlayerTurn(socket))
	    {
	      socket.emit("terminal", "It is not your turn");
	      return;
	    }

	    // clear the turn timer
	    clearTimeout(agame.turntimercallback);
	    
	    // whos turn it is that is ending
	    var currentplayer = agame.getPlayer(socket, true);

	    // whos turn it is that is starting
	    var opponent = agame.getPlayer(socket, true);


	    console.log("Ending turn of " + agame.name + ". Moving turn from " + agame.playerTurn + " to " + agame.playerTurnOpposite());

	    // flip whos turn it is
	    agame.playerTurn = agame.playerTurnOpposite();

	    // increase round count
	    agame.round++;

	    // increase mana for new player
	    if(opponent.mana < 10)
	      opponent.maxmana++;

	    // refresh mana
	    opponent.mana = opponent.maxmana;

	    // draw a card for the new player
	    // NYI

	    // tell new player it is their turn
	    agame.getSocketByPlayerNumber(opponent.number).emit("terminal", "\n[[b;limegreen;black]Your turn!]\n");

	    agame.updatePromptsWithDefault();

	    this.activateTurnTimer(agame);
	},

	activateTurnTimer: function(agame)
	{
	  var that = this;

	  // start turn timer
	  agame.turntimercallback = setTimeout(function() {

	    // do rope stuff
	    // trigger character rope speech TBD

	    agame.io.to(agame.name).emit('terminal', '\n[[b;orange;black]There is only ' + agame.turntimerrope + ' seconds left in the turn!\n]');

	    agame.turntimercallback = setTimeout(function() {

	      agame.io.to(agame.name).emit('terminal', 'End of turn by timeout');

	      var currentplayersocket = agame.getSocketByPlayerNumber(agame.playerTurn);

	      currentplayersocket.emit('terminal', '\n[[b;red;black]You ran out of time on your turn!]\n');
	      
	      that.endTurn(currentplayersocket);

	    }, agame.turntimerrope * 1000);

	  }, agame.turntimer * 1000);
	}

}