var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



var port = process.env.PORT || 8000;


var cards = JSON.parse(fs.readFileSync("cards.json"));

var game = function(name) {

  this.name = name;
  this.hand = {
    p1: [],
    p2: []
  };

  this.oard = {
    p1: [],
    p2: []
  };

  this.deck =  {
    p1: [],
    p2: []
  };

  this.p1socket = null;
  this.p2socket = null;
}

// master games list
game.prototype = {

  getHandBySocket: function(socket, getOppositeHand)
  {
    if( (socket.id == this.p1socket && !getOppositeHand) || (socket.id == this.p2socket && getOppositeHand) )
      return this.hand.p1;
    else
      return this.hand.p2;
  },

  getBoardBySocket: function (socket, getOppositeBoard)
  {
    if( (socket.id == this.p1socket && !getOppositeBoard) || (socket.id == this.p2socket && getOppositeBoard) )
      return this.board.p1;
    else
      return this.board.p2;
  }

}

// master games list.
var games = [];


// add card to p1 hand
/*board.p1.push(getCardByName("River Crocolisk"));
board.p2.push(getCardByName("Boulderfist Ogre"));
board.p2.push(getCardByName("Doomsayer"));


hand.p1.push(getCardByName("Fireball"));
hand.p2.push(getCardByName("Drain Life"));
hand.p2.push(getCardByName("Voidwalker"));*/

http.listen(port, function(){
  console.log('listening on *:' + port);
});

// on a connection
io.on('connection', function(socket){

  console.log('a user connected ' + socket.id);


 /* if(!p1socket)
  {
    p1socket = socket.id;
    socket.player = 1;
    console.log("Assigned player 1 to " + socket.id);

  }
  else if(!p2socket)
  {
    p2socket = socket.id;
    socket.player = 2;
    console.log("Assigned player 2 to " + socket.id);
  }
  else
    console.log("Too many players connected!")
*/
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('command', function(msg){
    console.log(socket.player + ": " + msg);
    
    parseCommand(msg, socket);

    //setTimeout(function() { io.emit('control', "enemyturn")}, 1000);
  });

  socket.on('join', function(roomname) {

    // check if room already exists:
    var found = false;
    for(game of games)
    {
      if(game.name == roomname)
      {
        if(game.p1socket == null)
        {
          game.p1socket = socket;
          break;
        }
        else if(game.p2socket == null)
        {
          game.p2socket = socket;
          break;
        }
        else
        {
          console.log("Game " + roomname + " join failed, is full from " + socket.id);
          return;
        }

        found = true;
      }

    }

    console.log("Joining " + socket.id + " to " + roomname);

    socket.join(roomname);

    var game = new game(roomname);


    games.push();

    socket.emit('control', { command: "assignplayer", player: 1 });


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