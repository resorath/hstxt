var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/keyboard-event-polyfill.js', function(req, res) {
  res.sendFile(__dirname + '/keyboard-event-polyfill.js');
});

var port = process.env.PORT || 8000;

var cards = JSON.parse(fs.readFileSync("cards.json"));

var decks = JSON.parse(fs.readFileSync("decks.json"));

// Game instance
function Game(name) {

  // name of the game and room
  this.name = name;

  // whos turn it is
  this.playerTurn = 0;

  // and whos its not...
  this.playerTurnOpposite = function() { return (this.playerTurn == 1 ? 2 : 1) };

  // what round it is
  this.round = 0;

  // each player's hand
  this.hand = {
    p1: [],
    p2: []
  };

  // each player's side of the board
  this.board = {
    p1: [],
    p2: []
  };

  // each player's deck
  this.deck =  {
    p1: [],
    p2: []
  };

  // the player's actual characters
  this.player = {
    p1: {
      number: 1,
      character: null,
      health: 20,
      attack: 0,
      mana: 0,
      maxmana: 0,
      status: []
    },
    p2: {
      number: 2,
      character: null,
      health: 20,
      attack: 0,
      mana: 0,
      maxmana: 0,
      status: []
    }
  }

  // bind the sockets used for each player
  this.p1socket = null;
  this.p2socket = null;

  // mulligan storage
  this.mulligan = {
    1: [],
    2: []
  }


  // turn timer
  // 75 second turn, rope at 20 seconds
  this.turntimer = 55 * 1000; 
  this.turntimerrope = 20 * 1000;

  // timeout function holder
  this.turntimercallback = null;

  this.getHand = function (socket, getOppositeHand)
  {
    if( (socket.id == this.p1socket.id && !getOppositeHand) || (socket.id == this.p2socket.id && getOppositeHand) )
      return this.hand.p1;
    else
      return this.hand.p2;
  };

  this.getBoard = function (socket, getOppositeBoard)
  {
    if( (socket.id == this.p1socket.id && !getOppositeBoard) || (socket.id == this.p2socket.id && getOppositeBoard) )
      return this.board.p1;
    else
      return this.board.p2;
  }

  this.getDeck = function (socket, getOppositeDeck)
  {
    if( (socket.id == this.p1socket.id && !getOppositeDeck) || (socket.id == this.p2socket.id && getOppositeDeck) )
      return this.deck.p1;
    else
      return this.deck.p2;
  }

  this.getPlayer = function (socket, getOppositePlayer)
  {
    if( (socket.id == this.p1socket.id && !getOppositePlayer) || (socket.id == this.p2socket.id && getOppositePlayer) )
      return this.player.p1;
    else
      return this.player.p2;
  }

  this.getSocketByPlayerNumber = function (num)
  {
    if(num == 1)
      return this.p1socket;
    if(num == 2)
      return this.p2socket;

    return null;
  }

  this.everyoneConnected = function()
  {
    return (this.p1socket != null && this.p2socket != null);
  }

  this.updatePromptsWithDefault = function()
  {
    this.defaultPrompt(this.p1socket);
    this.defaultPrompt(this.p2socket);
  }

  this.defaultPrompt = function (socket)
  {
    var player = this.getPlayer(socket, false);

    var prompt = player.character + "  " + player.health + " HP | " + player.mana + " Mana ";

    if(player.attack > 0)
      prompt += player.attack + "| Attack ";

    if(player.status.length > 0)
    {
      for(aff in player.status)
      {
        prompt += " " + player.status[aff] + " ";
      }
    }

    if(player.number == this.playerTurn)
      prompt += " YOUR TURN> ";
    else
      prompt += " ENEMY TURN> ";

    socket.emit('control', {"command": "prompt", "prompt": prompt});
  }

  this.isPlayerTurn = function (socket)
  {
    return (socket.player == this.playerTurn)
  }


}

function getHandBySocket(socket, getOppositeHand)
{
  // find game of socket first
  var agame = getGameBySocket(socket);

  if(agame != null)
    return agame.getHand(socket, getOppositeHand);

}

function getBoardBySocket(socket, getOppositeBoard)
{
  // find game of socket first
  var agame = getGameBySocket(socket);

  if(agame != null)
    return agame.getBoard(socket, getOppositeBoard);
}

function getDeckBySocket(socket, getOppositeDeck)
{
  // find game of socket first
  var agame = getGameBySocket(socket);

  if(agame != null)
    return agame.getDeck(socket, getOppositeDeck);
}

function getGameBySocket(socket)
{
    for(game in games)
    {
      var agame = games[game];
      if(agame.p1socket != null && agame.p1socket.id == socket.id)
        return agame;
      if(agame.p2socket != null && agame.p2socket.id == socket.id)
        return agame;
    }
    return null;
}

function getPlayerBySocket(socket)
{
    if(socket != null && socket.player != null)
      return socket.player;

    return null;
}

// master games list.
var games = [];


http.listen(port, function(){
  console.log('listening on *:' + port);
});

// on a connection
io.on('connection', function(socket){

  console.log('a user connected ' + socket.id);

  // Disconnected user, remove them from the game
  socket.on('disconnect', function(){
    console.log('a user disconnected ' + socket.id);

    var playernum = getPlayerBySocket(socket);

    if(playernum != null)
    {
      var agame = getGameBySocket(socket);

      if(agame != null)
      {

        if(playernum == 1)
        {
          console.log("Removing player 1 from " + agame.name + " due to disconnect");
          agame.p1socket = null;
        }
        else if(playernum == 2)
        {
          console.log("Removing player 2 from " + agame.name + " due to disconnect");
          agame.p2socket = null;
        }

        io.to(agame.name).emit('control', { command: "opponentleft" });

        if(agame.p1socket == null && agame.p2socket == null)
        {
          console.log("Removing game " + agame.name + " because it is out of players");
          games.filter(function (el) {
            return el.name == agame.name;
          });
        }
      }

    };


  });

  socket.on('command', function(msg){

    agame = getGameBySocket(socket);
    if(agame == null)
      return;

    if(!agame.everyoneConnected())
      return;

    console.log(agame.name + "-" + socket.player + ": " + msg);
    
    parseCommand(msg, socket);

    //setTimeout(function() { io.emit('control', "enemyturn")}, 1000);
  });

  // join a room
  socket.on('join', function(roomname) {

    // check if room already exists:
    var found = false;

    for(game in games)
    {
      var agame = games[game];
      if(agame.name == roomname)
      {
        if(agame.p1socket == null)
        {
          agame.p1socket = socket;
          socket.player = 1;
          socket.game = agame.name;
          socket.join(roomname);
          socket.emit('control', { command: "assignplayer", player: 1 });

          console.log("Joining " + socket.id + " to existing " + roomname + " as player 1");

          found = true;
          break;
        }
        else if(agame.p2socket == null)
        {
          agame.p2socket = socket;
          socket.player = 2;
          socket.game = agame.name;
          socket.join(roomname);
          socket.emit('control', { command: "assignplayer", player: 2 });

          console.log("Joining " + socket.id + " to existing game (" + roomname + ") as player 2");

          found = true;
          break;
        }
        else
        {
          // needs rejoin feature
          console.log("Game " + roomname + " join failed, is full from " + socket.id);
          socket.emit('control', { command: "roomfull" });
          return;
        }
      }

    }

    // no existing room
    if(!found)
    {
          console.log("Joining " + socket.id + " to new game (" + roomname + ") as player 1");
          socket.join(roomname);

          var newgame = new Game(roomname);
          newgame.p1socket = socket;
          newgame.isNewGame = true;
          newgame.name = roomname;

          socket.player = 1;
          socket.game = newgame.name;

          games.push(newgame);

          socket.emit('control', { command: "assignplayer", player: 1 });
    }


    // init game
    agame = getGameBySocket(socket);
    if(agame != null && agame.everyoneConnected())
    {

      if(agame.isNewGame)
      {

        // random first player
        agame.playerTurn = (Random(2) + 1);
        console.log(agame.name + " player " + agame.playerTurn + " goes first!");

        // signal start.
        console.log("Game " + roomname + " ready to start");
        io.to(agame.name).emit('control', { command: "startgame" });

        // both players pick deck
        printAvailableDecks(agame.p1socket);
        printAvailableDecks(agame.p2socket);

        io.to(agame.name).emit('control', { command: "prompt", prompt: "Pick a deck> " });

        // this doesn't work right
        agame.p1socket.promptCallback = pickDecks;
        agame.p2socket.promptCallback = pickDecks;

        // do mulligan
        //agame.promptCallback = mulligan(agame);


        /*agame.board.p1.push(getCardByName("River Crocolisk"));
        agame.board.p2.push(getCardByName("Boulderfist Ogre"));
        agame.board.p2.push(getCardByName("Doomsayer"));


        agame.hand.p1.push(getCardByName("Fireball"));
        agame.hand.p2.push(getCardByName("Drain Life"));
        agame.hand.p2.push(getCardByName("Voidwalker"));*/

        agame.isNewGame = false;

      
      }
      else if(agame != null && !agame.everyoneConnected())
      {
        console.log("Game " + roomname + " resumed due to reconnect");
        io.to(agame.name).emit('control', { command: "resumegame" });
      }


    }



  });

  socket.on('control', function(msg) {

    //if(msg == "ready")
    //  socket.emit('control', { command: "assignplayer", player: socket.player });


  });


});

var pickDecks = function(command, socket)
{
  var deck = null;
  if(!isNaN(command))
    var deck = decks[command]
  else 
    return;

  if(deck == null)
    return;

  // load deck
  var playerdeck = getDeckBySocket(socket, false);
  var game = getGameBySocket(socket);

  for(cardid in deck.cards)
  {
    var card = deck.cards[cardid];
  
    playerdeck.push(getCardByName(card));
  }
  console.log("Loaded deck for player " + socket.player);

  // check opponent
  var opponentdeck = getDeckBySocket(socket, true)

  console.log(opponentdeck.length);
  if(opponentdeck.length > 28)
  {
    io.to(game.name).emit('control', { command: "resume" });

    startMulligan(game);
  }
  else
  {
    socket.emit('terminal', 'Waiting for opponent to pick a deck');
    socket.emit('control', { command: "suspend" });
  }


  return;
}

function startMulligan(game)
{
  console.log(game.name + " mulligan phase");


  var firstPlayer = game.getSocketByPlayerNumber(game.playerTurn);
  var secondPlayer = game.getSocketByPlayerNumber(game.playerTurnOpposite());

  io.to(game.name).emit('terminal', '\nFlipping the coin...\n');

  firstPlayer.emit('terminal', 'You go first!');
  secondPlayer.emit('terminal', 'You get an extra card!');

  io.to(game.name).emit('control', { command: "prompt", prompt: "Mulligan> " });

  game.p1socket.promptCallback = mulligan;
  game.p2socket.promptCallback = mulligan;

  mulligan("", game.p1socket);
  mulligan("", game.p2socket);
}

var mulligan = function(command, socket)
{
  console.log("mulligan: " + command + " for " + socket.player);

  var agame = getGameBySocket(socket);
  var deck = getDeckBySocket(socket);
  // TBI

  // check if mulligan was already generated
  if(agame.mulligan[socket.player].length == 0)
  {
    // shuffle deck
    shuffle(deck);

    // draw three cards
    var mulligan = deck.splice(0, 3);

    // if going second, get another
    if(socket.player != agame.playerTurn)
      mulligan.push(deck.pop());

    agame.mulligan[socket.player] = mulligan;

  }

  // present the deck to the player:
  var mulligantoprint = "Pick cards to mulligan\n\n";
  var i = 1;

  for(cardid in agame.mulligan[socket.player])
  {
    var card = agame.mulligan[socket.player][cardid];

    // tmp
    mulligantoprint += i + ": " + card['name'] + "\n";
    i++;
  }

  socket.emit('terminal', mulligantoprint);


  // start game
  // check both mulligans
  // null out callback

  //activateTurnTimer(agame);
  //startGame(agame);

}

function printAvailableDecks(socket)
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


function startGame(agame)
{
      // give 1 mana to player 1
      agame.getPlayer(agame.getSocketByPlayerNumber(agame.playerTurn), false).mana = 1;
      agame.getPlayer(agame.getSocketByPlayerNumber(agame.playerTurn), false).maxmana = 1;

      // give the coin to player 2
      agame.getHand(agame.getSocketByPlayerNumber(agame.playerTurnOpposite()), false).push(getCardById("GAME_005"));

      // set round one
      agame.round = 1;


      // set up prompts
      agame.updatePromptsWithDefault();

}

// Parse a command sent from a player
function parseCommand(command, socket)
{
  if(!command)
    return null;

  var game = getGameBySocket(socket);

  // check if the prompt callback override is set, and execute that instead
  // the callback function must accept the entire command
  if(socket.promptCallback != null)
  {
    console.log("prompt callback set for " + socket.id + " to " + socket.promptCallback.name);
    socket.promptCallback(command, socket);
    return;
  }

  var parts = command.split(" ");
  var root = parts.shift();

  if(typeof cfunc[root] === 'function')
    cfunc[root](socket, parts)
  else
    console.log("Command " + command + " not recognized by " + socket.game + ":" + socket.player);

  game.updatePromptsWithDefault();

}

// nicely print a card to a player
function printCard(card, socket)
{
  if(card["type"] == "MINION")
    return card["name"] + " [" + card["attack"] + "/" + card["health"] + "] (" + card["cost"] + ")";
  if(card["type"] == "SPELL")
    return card["name"] + " (" + card["cost"] + ")";
}

function printDetailedCard(card, socket)
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

// wrapper for emit message to terminal
function printToSender(message, socket)
{
  socket.emit('terminal', message);
}

function getCardByName(name)
{
  var returnVal = null;

  cards.forEach(function(card)
  {
    if(card["name"] && card["name"].toUpperCase() === name.toUpperCase())
    {
      returnVal = card;
      return;
    }
  })

  if(returnVal == null)
    console.log("WARNING: couldn't find card by name " + name);

  return returnVal;
}

function getCardById(id)
{
  var returnVal = null;

  cards.forEach(function(card)
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

function boardIndexToCard(boardindex, socket)
{

  // opponent's board
  if(boardindex.toLowerCase().charAt(0) == "o")
  {
    var index = Number(boardindex.substring(1)) - 1;
    return getBoardBySocket(socket, true)[index];
  }

  // player's board
  if(boardindex.toLowerCase().charAt(0) == "m")
  {
    var index = Number(boardindex.substring(1)) - 1;
    return getBoardBySocket(socket, false)[index];
  }

  // player's hand
  if(boardindex.toLowerCase().charAt(0) == "h")
  {
    var index = Number(boardindex.substring(1)) - 1;
    return getHandBySocket(socket, false)[index];
  }

  return null;

}

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function activateTurnTimer(agame)
{
  // star turn timer
  agame.turntimercallback = setTimeout(function() {

    // do rope stuff
    // trigger character rope speech TBD

    io.to(agame.name).emit('terminal', 'There is only ' + agame.turntimerrope + ' seconds left in the turn!');

    agame.turntimercallback = setTimeout(function() {

      io.to(agame.name).emit('terminal', 'End of turn by timeout');

      var currentplayersocket = agame.getSocketByPlayerNumber(agame.playerTurn);

      currentplayersocket.emit('terminal', '[[b;red;black]You ran out of time on your turn!]');
      cfunc.end(currentplayersocket, null);

    }, agame.turntimerrope);

  }, agame.turntimer);
}

// Zero-based random number
// e.g. max = 2 is 1 in 2 change when checking 0. 
function Random(max)
{
  return Math.floor(Math.random() * max);
}

// command functions
var cfunc = { };

// test
cfunc.meow = function(socket, parts)
{
  console.log("mew mew");
  socket.emit('control', { command: "prompt", prompt: "mew?> " });

  var agame = getGameBySocket(socket);
  
  socket.promptCallback = function(command, socket)
  {
    console.log("meow meow " + command);
    var agame = getGameBySocket(socket);

    if(command == "mew")
    {

      socket.promptCallback = null;

      socket.emit('terminal', 'meow meow');
      socket.emit('control', { command: "prompt", prompt: "Ready> " });
    }


  }

}

// end of turn
cfunc.end = function(socket, parts)
{
  var agame = getGameBySocket(socket);

  if(!agame.isPlayerTurn(socket))
  {
    socket.emit("terminal", "It is not your turn");
    return;
  }

  // clear the turn timer
  clearTimeout(agame.turntimer);
  
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

  activateTurnTimer(agame);

}

// look at a card
cfunc.look = function(socket, parts)
{
  // parse what we want to look at. 
  var lookatindex = parts[0];

  if(!lookatindex)
    return null;

  var index = boardIndexToCard(lookatindex, socket);

  if(index == null)
    return;

  printToSender(printDetailedCard(index), socket);

}

// print out board
cfunc.board = function(socket, parts)
{
    var response = "\nYour opponent has " + getHandBySocket(socket, true).length + " cards\n" +
    "\nOpponent's side:\n\n";

    var i = 1;

    getBoardBySocket(socket, true).forEach(function(card) {
      response += "o" + i + ": " + printCard(card) + "\n";
      i++;
    });

    response += "\n------------\n\nYour side:\n\n";

    i = 1;

    getBoardBySocket(socket, false).forEach(function(card) {
      response += "m" + i + ": " + printCard(card) + "\n";
      i++;
    });  

    response += "\nYour hand:\n\n";

    i = 1;

    getHandBySocket(socket, false).forEach(function(card) {
      response += "h" + i + ": " + printCard(card) + "\n";
      i++;
    });  

    response += "\n";

    printToSender(response, socket);

}

