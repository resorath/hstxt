var helpers = require('./helpers');
var display = require('./display');
var util = require('./util');

module.exports = {

	pickDecks: function(command, socket)
	{
	  var deck = null;
	  if(!isNaN(command))
	    var deck = helpers.decks[command]
	  else 
	    return;

	  if(deck == null)
	    return;

	  // load deck
	  var playerdeck = helpers.getDeckBySocket(socket, false);
	  var player = helpers.getPlayerBySocket(socket);
	  var game = helpers.getGameBySocket(socket);

	  player.character = deck.heroname;

	  for(cardid in deck.cards)
	  {
	    var card = deck.cards[cardid];
	  
	    playerdeck.push(helpers.getCardByName(card));
	  }
	  console.log("Loaded deck for player " + socket.player);

	  // check opponent
	  var opponentdeck = helpers.getDeckBySocket(socket, true)

	  console.log(opponentdeck.length);
	  if(opponentdeck.length > 28)
	  {
	    game.io.to(game.name).emit('control', { command: "resume" });

	    module.exports.startMulligan(game);
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

	  var firstPlayer = game.getSocketByPlayerNumber(game.playerTurn);
	  var secondPlayer = game.getSocketByPlayerNumber(game.playerTurnOpposite());

	  game.io.to(game.name).emit('terminal', '\n[[b;gold;black]Flipping the coin...]\n');

	  firstPlayer.emit('terminal', 'You go first!\n');
	  secondPlayer.emit('terminal', 'You get an extra card!\n');

	  game.io.to(game.name).emit('control', { command: "prompt", prompt: "Mulligan> " });

	  game.p1socket.promptCallback = module.exports.mulligan;
	  game.p2socket.promptCallback = module.exports.mulligan;

	  module.exports.mulligan("", game.p1socket);
	  module.exports.mulligan("", game.p2socket);
	},

	mulligan: function(command, socket)
	{
	  console.log("mulligan: " + command + " for " + socket.player);

	  var agame = helpers.getGameBySocket(socket);
	  var deck = helpers.getDeckBySocket(socket);
	  // TBI

	  // check if mulligan was already generated
	  if(agame.mulligan[socket.player].length == 0)
	  {
	    // shuffle deck
	    util.shuffle(deck);

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
	        helpers.getHandBySocket(socket, false).push(agame.mulligan[socket.player][cardid].card);
	      else
	      {
	        helpers.getDeckBySocket(socket, false).push(agame.mulligan[socket.player][cardid].card);
	        mulligancount++;
	      }
	    }

	    // now draw more cards directly into hand and tell the player
	    util.shuffle(helpers.getDeckBySocket(socket, false));

	    if(mulligancount > 0)
	    {
	      socket.emit('terminal', "\nNew cards from your mulligan:\n");
	    }

	    for(i = 0; i < mulligancount; i++)
	    {
	      var card = helpers.getDeckBySocket(socket, false).pop();
	      console.log("Mulliganed new card for " + socket.id);
	      socket.emit('terminal', display.printDetailedCard(card));
	      helpers.getHandBySocket(socket, false).push(card);
	    }

	    // wait for opponent
	    if(helpers.getHandBySocket(socket, true).length < 3)
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
	      module.exports.startGame(agame);

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

	    mulligantoprint += " " + display.printDetailedCard(card);
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

	      agame.getHand(agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false)).push(helpers.getCardById("GAME_005"));
	      agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false).emit('terminal', '\n[[;lightblue;black]The Coin mysteriously appears in your hand...]');
	      agame.getSocketByPlayerNumber(agame.playerTurnOpposite(), false).emit('terminal', display.printDetailedCard(helpers.getCardById("GAME_005")));


	      // set up prompts
	      agame.updatePromptsWithDefault();

	      // start timer
	      this.activateTurnTimer(agame);

	      // tell first player to go
      	  agame.getSocketByPlayerNumber(agame.playerTurn).emit("terminal", "\n[[b;limegreen;black]Your turn!]\n");

      	  // give them a card
      	  module.exports.drawCard(agame.getSocketByPlayerNumber(agame.playerTurn));

	},

	endTurn: function(socket)
	{
	    var agame = helpers.getGameBySocket(socket);

	    // game ended?
	    if(agame == null)
	    {
	    	clearTimeout(agame.turntimercallback);
	    	console.log("Ending unknown game");
	    	return;
	    }

	    if(!agame.isPlayerTurn(socket))
	    {
	      socket.emit("terminal", "It is not your turn\n");
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

	    // tell new player it is their turn
	    agame.getSocketByPlayerNumber(opponent.number).emit("terminal", "\n[[b;limegreen;black]Your turn!]\n");

	    // draw new player a card
	    module.exports.drawCard(helpers.getOppositePlayerSocket(socket));

	    // set all minions (that can attack) to ready
	    var currentBoard = helpers.getBoardBySocket(socket, true);
	    for(cardonboardindex in currentBoard)
	    {
	    	var cardonboard = currentBoard[cardonboardindex];

	    	if(typeof cardonboard['mechanics'] != 'undefined' && cardonboard['mechanics'].indexOf('CANT_ATTACK') > -1)
	    		continue;

	    	if(cardonboard['attack'] <= 0)
	    		continue;

	    	cardonboard.canattack = true;
	    }

	    agame.updatePromptsWithDefault();

	    this.activateTurnTimer(agame);
	},

	drawCard: function(socket)
	{

		var agame = helpers.getGameBySocket(socket);

	    // draw a card for the new player
	    var draw = helpers.getDeckBySocket(socket, false).pop();
	    var player = helpers.getPlayerBySocket(socket, false);

	    if(draw == null)
	    {
	    	// fatigue!
	    	helpers.getOppositePlayerSocket(socket).emit('terminal', 'Your opponent is out of cards and draws...');
	    	socket.emit("terminal", "You draw...");

	    	player.fatigue++;

	    	agame.io.to(agame.name).emit('terminal', '\n[[b;red;]Fatigue]\n\n[[;darkred;]   .-.\n  (0.0)\n\'=.|m|.=\'\n.=\'`"``=.]\n\nOut of cards! Take '+ player.fatigue +' damage.\n');
	    	
	    	module.exports.damagePlayer(agame, player, player.fatigue);
	    }
	    else if(helpers.getHandBySocket(socket, false).length == 10)
	    {
	    	// too many cards
	    	helpers.getOppositePlayerSocket(socket).emit('terminal', '[[;red;black]Your opponent has too many cards in their hand! They lost...]');
	    	
	    	socket.emit("terminal", "[[;red;black]You have too many cards in your hand! You lost...]");

	    	agame.io.to(agame.name).emit('terminal', display.printDetailedCard(draw));

	    }
	    else
	    {
	    	helpers.getOppositePlayerSocket(socket).emit('terminal', 'Your opponent draws a card\n');
	    	socket.emit("terminal", "You draw...");
	    	socket.emit("terminal", display.printDetailedCard(draw));

	    	helpers.getHandBySocket(socket, false).push(draw);
	    }


	},

	damagePlayer: function(agame, player, amount)
	{
		player.health -= amount;

		agame.updatePromptsWithDefault();

		// check if game is over
		// todo: refactor this so we don't need to retrieve the socket
		if(player.health <= 0)
		{
			var socket = agame.getSocketByPlayerNumber(player.number);
			socket.emit('terminal', 'Game over, you lose!\n');
			helpers.getOppositePlayerSocket(socket).emit('terminal', 'Game over, you win!\n');

			module.exports.quitGame(agame);
		}

	},

	damageCard: function(agame, card, amount)
	{
		card.health -= amount;

		if(card.health <= 0)
		{
			// todo: trigger deathrattle!

			agame.io.to(agame.name).emit('terminal', card['name'] + " is destroyed!\n");

			// who owned this card?
			var p1board = agame.board.p1;
			var p2board = agame.board.p2;

			var index = p1board.indexOf(card);

			if(index > -1)
				p1board.splice(index, 1);
			else
			{
				index = p2board.indexOf(card);
				p2board.splice(index, 1);
			}
		}
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
	},

	deactivateTurnTimer: function(game)
	{
		if(game.turntimercallback != null)
			clearTimeout(agame.turntimercallback);
	},

	quitGame: function(game)
	{
      module.exports.deactivateTurnTimer(game);

      game.io.to(game.name).emit("control", {command: "endgame"} );

      util.filterInPlace(helpers.games, function (el) {
        return el.name != game.name;
      });

	}

}