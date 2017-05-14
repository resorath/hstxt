var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var components = require('./modules/Game');
var helpers = require('./modules/helpers');
var execution = require('./modules/execution');
var cfunc = require('./modules/commands');
var display = require('./modules/display');
var util = require('./modules/util');

var serverVersion = "0.1 dev"



app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/keyboard-event-polyfill.js', function(req, res) {
  res.sendFile(__dirname + '/keyboard-event-polyfill.js');
});

var port = process.env.PORT || 8000;

var globals = {};

globals.cards = JSON.parse(fs.readFileSync("cards.json"));

globals.decks = JSON.parse(fs.readFileSync("decks.json"));


// master games list.
globals.games = [];

// cross inits
helpers.init(globals.games, globals.cards, globals.decks);

http.listen(port, function(){
  console.log('listening on *:' + port);
});

/*process.stdin.resume();

function exitHandler(options, err) {
  io.sockets.emit('terminal', '\n[[bu;red;black]server going down...]\n');

  if (options.cleanup) console.log('clean');
  if (err)console.log(err.stack);
  if (options.exit) process.exit();}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
*/
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
          execution.quitGame(agame);

          /*util.filterInPlace(globals.games, function (el) {
            return el.name != agame.name;
          });*/

        }

        // can't resume a game if it hasn't started, so kill the game.
        if(agame.round == 0)
        {
          console.log("Removing game " + agame.name + " because a player left before it started");
          io.to(agame.name).emit("terminal", "The game cannot continue because your opponent left before the game started! Retry making the game...\n");

          execution.quitGame(agame);
          /*io.to(agame.name).emit("control", {command: "endgame"} );

          util.filterInPlace(globals.games, function (el) {
            return el.name != agame.name;
          });*/

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

  });

  // join a room
  socket.on('join', function(roomname) {

    // check if room already exists:
    var found = false;
    var existinggame = null;

    for(game in globals.games)
    {
      var agame = globals.games[game];
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

          console.log("Joining " + socket.id + " to existing game (" + roomname + ") as player 1");

          found = true;
          existinggame = agame;

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
          existinggame = agame;

          break;
        }
        else
        {
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

          globals.games.push(newgame);

          socket.emit('terminal', 'Game joined! Waiting for an opponent...\nHint: Tell a friend to join the game using the same game name (' +  roomname + ')!');
          socket.emit('control', { command: "assignplayer", player: 1 });
    }
    else
    {
      // a game is already in progress, rejoin
      if(existinggame.round > 0)
      {
        console.log("Resuming existing game " + existinggame.round);
        existinggame.defaultPrompt(socket);
        io.to(roomname).emit('control', { command: "resumegame" });

      }
    }

    var agame = helpers.getGameBySocket(socket);
    if(agame != null && agame.everyoneConnected())
    {

      if(agame.isNewGame)
      {

        // random first player
        agame.playerTurn = (util.Random(2) + 1);
        console.log(agame.name + " player " + agame.playerTurn + " goes first!");

        // signal start.
        console.log("Game " + roomname + " ready to start");
        io.to(agame.name).emit('control', { command: "startgame" });

        // both players pick deck
        display.printAvailableDecks(agame.p1socket, globals.decks);
        display.printAvailableDecks(agame.p2socket, globals.decks);

        io.to(agame.name).emit('control', { command: "prompt", prompt: "Pick a deck> " });

        agame.p1socket.promptCallback = execution.pickDecks;
        agame.p2socket.promptCallback = execution.pickDecks;

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

    if(msg == "ready")
    {
      socket.emit('terminal', 'Server version ' + serverVersion + '\n');
    }

    if(msg == "showsetup")
    {
      socket.emit('terminal', 'To start a new game, enter a unique game name.\nTo join a friend\'s game, enter their game name.\nTo rejoin a game you disconnected from, enter the game name you left.\n');
    
      socket.emit('control', { command: 'prompt', prompt: 'Game name> '})
    }


  });


});




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
  {
    socket.emit('terminal', 'unknown command: \'' + root + '\' try \'help\'\n');
    console.log("Command " + command + " not recognized by " + socket.game + ":" + socket.player);
  }

  //game.updatePromptsWithDefault();

}






