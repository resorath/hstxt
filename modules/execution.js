module.exports = {

	helpers: null,
	display: null,
	util: null,

	init: function(helpers, display, util)
	{
		this.helpers = helpers;
		this.display = display;
		this.util = util;
	},

	pickDecks: function(command, socket)
	{
	  var deck = null;
	  if(!isNaN(command))
	    var deck = this.helpers.decks[command]
	  else 
	    return;

	  if(deck == null)
	    return;

	  // load deck
	  var playerdeck = this.helpers.getDeckBySocket(socket, false);
	  var player = this.helpers.getPlayerBySocket(socket);
	  var game = this.helpers.getGameBySocket(socket);

	  player.character = deck.heroname;

	  for(cardid in deck.cards)
	  {
	    var card = deck.cards[cardid];
	  
	    playerdeck.push(this.helpers.getCardByName(card));
	  }
	  console.log("Loaded deck for player " + socket.player);

	  // check opponent
	  var opponentdeck = this.helpers.getDeckBySocket(socket, true)

	  console.log(opponentdeck.length);
	  if(opponentdeck.length > 28)
	  {
	    game.io.to(game.name).emit('control', { command: "resume" });

	    this.startMulligan(game);
	  }
	  else
	  {
	    socket.emit('terminal', 'Waiting for opponent to pick a deck');
	    socket.emit('control', { command: "suspend" });
	  }


	  return;
	},

	startMulligan: function(game)
	{
	  console.log(game.name + " mulligan phase");

	  var that = this;

	  var firstPlayer = game.getSocketByPlayerNumber(game.playerTurn);
	  var secondPlayer = game.getSocketByPlayerNumber(game.playerTurnOpposite());

	  game.io.to(game.name).emit('terminal', '\nFlipping the coin...\n');

	  firstPlayer.emit('terminal', 'You go first!');
	  secondPlayer.emit('terminal', 'You get an extra card!');

	  game.io.to(game.name).emit('control', { command: "prompt", prompt: "Mulligan> " });

	  game.p1socket.promptCallback = function(command, socket) { that.mulligan(command, socket) };
	  game.p2socket.promptCallback = function(command, socket) { that.mulligan(command, socket) };

	  this.mulligan("", game.p1socket);
	  this.mulligan("", game.p2socket);
	},

	mulligan: function(command, socket)
	{
	  console.log("mulligan: " + command + " for " + socket.player);

	  var agame = this.helpers.getGameBySocket(socket);
	  var deck = this.helpers.getDeckBySocket(socket);
	  // TBI

	  // check if mulligan was already generated
	  if(agame.mulligan[socket.player].length == 0)
	  {
	    // shuffle deck
	    this.util.shuffle(deck);

	    // draw three cards
	    //var mulligan = deck.splice(0, 3);
	    for(i=0 ; i<3 ; i++)
	    {
	      agame.mulligan[socket.player].push({ keep: true, card: deck.pop() });
	    }

	    // if going second, get another
	    if(socket.player != agame.playerTurn)
	      agame.mulligan[socket.player].push({ keep: true, card: deck.pop() });

	  }

	  // user entered a number to change state
	  if(!isNaN(command))
	  {
	    // convert number user entered to array index 
	    var cardtochange = command-1;

	    if(agame.mulligan[socket.player][cardtochange] != null)
	    {
	      // invert "keep" state
	      agame.mulligan[socket.player][cardtochange].keep = !agame.mulligan[socket.player][cardtochange].keep;
	    }
	  }
	  else if(command == "done")
	  {
	    var mulligancount = 0;

	    for(cardid in agame.mulligan[socket.player])
	    {
	      var keep = agame.mulligan[socket.player][cardid].keep;

	      // if keeping card, push it to hand
	      // otherwise, push it to deck and increase mulligan count
	      if(keep)
	        this.helpers.getHandBySocket(socket, false).push(agame.mulligan[socket.player][cardid].card);
	      else
	      {
	        this.helpers.getDeckBySocket(socket, false).push(agame.mulligan[socket.player][cardid].card);
	        mulligancount++;
	      }
	    }

	    // now draw more cards directly into hand and tell the player
	    this.util.shuffle(this.helpers.getDeckBySocket(socket, false));

	    if(mulligancount > 0)
	    {
	      socket.emit('terminal', "\nNew cards from your mulligan:\n");
	    }

	    for(i = 0; i < mulligancount; i++)
	    {
	      var card = this.helpers.getDeckBySocket(socket, false).pop();
	      console.log("Mulliganed new card for " + socket.id);
	      socket.emit('terminal', this.display.printDetailedCard(card));
	      this.helpers.getHandBySocket(socket, false).push(card);
	    }

	    // wait for opponent
	    if(this.helpers.getHandBySocket(socket, true).length < 3)
	    {
	      socket.emit('terminal', 'Waiting for opponent to finish mulligan');
	      socket.emit('control', {command: 'suspend'});
	    }
	    else
	    {
	      // begin game

	      // clear the callbacks
	      agame.p1socket.promptCallback = null;
	      agame.p2socket.promptCallback = null;

	      // resume consoles
	      agame.p1socket.emit('control', {command: 'resume'});
	      agame.p2socket.emit('control', {command: 'resume'});

	      // start game
	      this.startGame(agame);

	     }

	    return;


	  }

	  // present the deck to the player:
	  var mulligantoprint = "Pick cards to mulligan\nType a number and press enter to toggle if a card is kept or discarded. Type \"done\" when ready.\n";
	  var i = 1;

	  for(cardid in agame.mulligan[socket.player])
	  {
	    var card = agame.mulligan[socket.player][cardid].card;
	    var keep = agame.mulligan[socket.player][cardid].keep;

	    // tmp
	    mulligantoprint += "\n" +  i + ": ";

	    if(keep)
	      mulligantoprint += "[[b;limegreen;black]&#91;KEEP&#93;]";
	    else
	      mulligantoprint += "[[b;red;black]&#91;DISCARD&#93;]"

	    mulligantoprint += " " + this.display.printDetailedCard(card);
	    i++;
	  }

	  socket.emit('terminal', mulligantoprint);



	  // start game
	  // check both mulligans
	  // null out callback

	  //activateTurnTimer(agame);
	  //startGame(agame);

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