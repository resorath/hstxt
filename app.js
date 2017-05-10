var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var components = require('./modules/Game');
var helpers = require('./modules/helpers');
var execution = require('./modules/execution');
var cfunc = require('./modules/commands');
var display = require('./modules/display');

// cross inits
cfunc.init(helpers, execution, display);
execution.init(helpers, display);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/keyboard-event-polyfill.js', function(req, res) {
  res.sendFile(__dirname + '/keyboard-event-polyfill.js');
});

var port = process.env.PORT || 8000;

var cards = JSON.parse(fs.readFileSync("cards.json"));

var decks = JSON.parse(fs.readFileSync("decks.json"));


// master games list.
var games = [];
helpers.init(games, cards, decks);

http.listen(port, function(){
  console.log('listening on *:' + port);
});

// on a connection
io.on('connection', function(socket){

  console.log('a user connected ' + socket.id);

  // Disconnected user, remove them from the game
  socket.on('disconnect', function(){
    console.log('a user disconnected ' + socket.id);

    var playernum = helpers.getPlayerNumberBySocket(socket);

    if(playernum != null)
    {
      var agame = helpers.getGameBySocket(socket);

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
          agame.quit();
          games.filter(function (el) {
            return el.name == agame.name;
          });
        }
      }

    };


  });

  socket.on('command', function(msg){

    agame = helpers.getGameBySocket(socket);
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

          socket.emit('terminal', 'Game joined! Your opponent is already here...');
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

          socket.emit('terminal', 'Game joined! Your opponent is already here...');
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

          var newgame = new components.Game(roomname);
          newgame.io = io;
          newgame.p1socket = socket;
          newgame.isNewGame = true;
          newgame.name = roomname;

          socket.player = 1;
          socket.game = newgame.name;

          games.push(newgame);

          socket.emit('terminal', 'Game joined! Waiting for an opponent...\nHint: Tell a friend to join the game using the same game name (' +  roomname + ')!');
          socket.emit('control', { command: "assignplayer", player: 1 });
    }

    // init game
    agame = helpers.getGameBySocket(socket);
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

        agame.p1socket.promptCallback = pickDecks;
        agame.p2socket.promptCallback = pickDecks;

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

  var agame = helpers.getGameBySocket(socket);
  var deck = helpers.getDeckBySocket(socket);
  // TBI

  // check if mulligan was already generated
  if(agame.mulligan[socket.player].length == 0)
  {
    // shuffle deck
    shuffle(deck);

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
    shuffle(helpers.getDeckBySocket(socket, false));
    for(i = 0; i < mulligancount; i++)
    {
      var card = helpers.getDeckBySocket(socket, false).pop();
      console.log("Mulliganed new card for " + socket.id);
      socket.emit('terminal', "New card from mulligan: " + display.printCard(card));
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
      execution.startGame(agame);

     }

    return;


  }

  // present the deck to the player:
  var mulligantoprint = "Pick cards to mulligan\nType a number to select if a card is kept or discarded. Type \"done\" when ready.\n\n";
  var i = 1;

  for(cardid in agame.mulligan[socket.player])
  {
    var card = agame.mulligan[socket.player][cardid].card;
    var keep = agame.mulligan[socket.player][cardid].keep;

    // tmp
    mulligantoprint += i + ": ";

    if(keep)
      mulligantoprint += "[[b;limegreen;black]&#91;KEEP&#93;]";
    else
      mulligantoprint += "[[b;red;black]&#91;DISCARD&#93;]"

    mulligantoprint += " " + display.printDetailedCard(card) + "\n";
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



// Parse a command sent from a player
function parseCommand(command, socket)
{
  if(!command)
    return null;

  var game = helpers.getGameBySocket(socket);

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

  //game.updatePromptsWithDefault();

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

// Zero-based random number
// e.g. max = 2 is 1 in 2 change when checking 0. 
function Random(max)
{
  return Math.floor(Math.random() * max);
}


