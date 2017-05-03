var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



var port = process.env.PORT || 8000;

var p1socket = null;
var p2socket = null;

var hand = {
  p1: [],
  p2: []
};

function getHandBySocket(socket, getOppositeHand)
{
  if( (socket.id == p1socket && !getOppositeHand) || (socket.id == p2socket && getOppositeHand) )
    return hand.p1;
  else
    return hand.p2;
}

var board = {
  p1: [],
  p2: []
};

function getBoardBySocket(socket, getOppositeBoard)
{
  if( (socket.id == p1socket && !getOppositeBoard) || (socket.id == p2socket && getOppositeBoard) )
    return board.p1;
  else
    return board.p2;
}

var deck = {
  p1: [],
  p2: []
};

var cards = JSON.parse(fs.readFileSync("cards.json"));

// add card to p1 hand
board.p1.push(getCardByName("River Crocolisk"));
board.p2.push(getCardByName("Boulderfist Ogre"));
board.p2.push(getCardByName("Doomsayer"));


hand.p1.push(getCardByName("Fireball"));
hand.p2.push(getCardByName("Drain Life"));
hand.p2.push(getCardByName("Voidwalker"));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

// on a connection
io.on('connection', function(socket){
  console.log('a user connected ' + socket.id);
  if(!p1socket)
  {
    p1socket = socket.id;
    socket.player = 1;
    console.log("Assigned player 1 to " + socket.id)
  }
  else if(!p2socket)
  {
    p2socket = socket.id;
    socket.player = 2;
    console.log("Assigned player 2 to " + socket.id)
  }
  else
    console.log("Too many players connected!")

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('command', function(msg){
    console.log(socket.player + ": " + msg);
    
    parseCommand(msg, socket);

    //setTimeout(function() { io.emit('control', "enemyturn")}, 1000);
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
    var returnval = "\n[[b]" + card["name"] + "]\n" + "Cost: " + card["cost"] + "\n";
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