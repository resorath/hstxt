var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.broadcast.emit('chat message', 'Someone else connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('command', function(msg){
    console.log('message: ' + msg);
    
    parseCommand(msg);

    setTimeout(function() { io.emit('control', "enemyturn")}, 1000);
  });


});

var port = process.env.PORT || 8000;

var hand = {
  p1: {

  },
  p2: {

  }
};

var board = {
  p1: {

  },
  p2: {

  }
};

var deck = {
  p1: {

  },
  p2: {

  }
}

var cards = JSON.parse(fs.readFileSync("cards.json"));

console.log(getCardByName("Doomsayer"));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function parseCommand(command)
{
  if(!command)
    return null;

  var parts = command.split(" ");
  var root = parts.shift();

  if(typeof cfunc[root] === 'function')
    cfunc[root](parts)

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

// command functions
var cfunc = { };

cfunc.meow = function(parts)
{
  console.log("mew mew");
  console.log(parts);
}