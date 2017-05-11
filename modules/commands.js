var helpers = require('./helpers');
var execution = require('./execution');
var display = require('./display');

module.exports = {

  // test
  meow: function(socket, parts)
  {
    console.log("mew mew");
    socket.emit('control', { command: "prompt", prompt: "mew?> " });

    var agame = helpers.getGameBySocket(socket);
    
    socket.promptCallback = function(command, socket)
    {
      console.log("meow meow " + command);
      var agame = helpers.getGameBySocket(socket);

      if(command == "mew")
      {

        socket.promptCallback = null;

        socket.emit('terminal', 'meow meow');
        agame.defaultPrompt(socket);
      }


    }

  },

  // end of turn
  end: function(socket, parts)
  {
    execution.endTurn(socket);

  },

  // look at a card
  look: function(socket, parts)
  {
    // parse what we want to look at. 
    var lookatindex = parts[0];

    if(!lookatindex)
      return null;

    var index = helpers.boardIndexToCard(lookatindex, socket);

    if(index == null)
      return;

    socket.emit('terminal', this.display.printDetailedCard(index));

  },

  // print out hand
  hand: function(socket, parts)
  {

      i = 1;

      var response = "\n";

      helpers.getHandBySocket(socket, false).forEach(function(card) {
        response += "h" + i + ": " + display.printCard(card) + "\n";
        i++;
      });  

      response += "\n";

      socket.emit('terminal', response);

  },

  // print out board
  board: function(socket, parts)
  {
      var response = "\nYour opponent has " + helpers.getHandBySocket(socket, true).length + " cards\n" +
      "\nOpponent's side:\n\n";

      var i = 1;

      helpers.getBoardBySocket(socket, true).forEach(function(card) {
        response += "o" + i + ": " + display.printCard(card) + "\n";
        i++;
      });

      response += "\n------------\n\nYour side:\n\n";

      i = 1;

      helpers.getBoardBySocket(socket, false).forEach(function(card) {
        response += "m" + i + ": " + display.printCard(card) + "\n";
        i++;
      });  

      response += "\nYour hand:";

      socket.emit('terminal', response);

      module.exports.hand(socket, parts);

  }
}