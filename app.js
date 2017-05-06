var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var port = process.env.PORT || 8000;

var cards = JSON.parse(fs.readFileSync("cards.json"));

// Game instance
function Game(name) {

  this.name = name;
  this.hand = {
    p1: [],
    p2: []
  };

  this.board = {
    p1: [],
    p2: []
  };

  this.deck =  {
    p1: [],
    p2: []
  };

  this.player = {
    p1: {
      character: null,
      health: 20,
      attack: 0,
      status: []
    },
    p2: {
      character: null,
      health: 20,
      attack: 0,
      status: []
    }
  }

  this.p1socket = null;
  this.p2socket = null;

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

  this.everyoneConnected = function()
  {
    return (this.p1socket != null && this.p2socket != null);
  }


}

function getHandBySocket(socket, getOppositeHand)
{
  // find game of socket first
  var agame = getGameBySocket(socket);

  if(agame != null)
    return agame.getHand(socket, getOppositeHand);

}

function getBoardBySocket(socket, getOppositeHand)
{
  // find game of socket first
  var agame = getGameBySocket(socket);

  if(agame != null)
    return agame.getBoard(socket, getOppositeHand);
}

function getGameBySocket(socket)
{
    for(game of games)
    {
      if(game.p1socket != null && game.p1socket.id == socket.id)
        return game;
      if(game.p2socket != null && game.p2socket.id == socket.id)
        return game;
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

    for(agame of games)
    {
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


          socket.player = 1;
          socket.game = newgame.name;

          games.push(newgame);

          socket.emit('control', { command: "assignplayer", player: 1 });
    }


    // init game
    agame = getGameBySocket(socket);
    if(agame.everyoneConnected())
    {

      if(agame.isNewGame)
      {
        agame.board.p1.push(getCardByName("River Crocolisk"));
        agame.board.p2.push(getCardByName("Boulderfist Ogre"));
        agame.board.p2.push(getCardByName("Doomsayer"));


        agame.hand.p1.push(getCardByName("Fireball"));
        agame.hand.p2.push(getCardByName("Drain Life"));
        agame.hand.p2.push(getCardByName("Voidwalker"));

        agame.isNewGame = false;

        // signal start.
        console.log("Game " + roomname + " ready to start");
        io.to(agame.name).emit('control', { command: "startgame" });

      }
      else
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

// Parse a command sent from a player
function parseCommand(command, socket)
{
  if(!command)
    return null;

  var parts = command.split(" ");
  var root = parts.shift();

  if(typeof cfunc[root] === 'function')
    cfunc[root](socket, parts)
  else
    console.log("Command " + command + " not recognized by " + socket.game + ":" + socket.player);

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

// command functions
var cfunc = { };

cfunc.meow = function(socket, parts)
{
  console.log("mew mew");
  console.log(parts);
}

cfunc.look = function(socket, parts)
{
  // parse what we want to look at. 
  var lookatindex = parts[0];

  if(!lookatindex)
    return null;

  printToSender(printDetailedCard(boardIndexToCard(lookatindex, socket)), socket);

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