var helpers = require('./helpers');
var execution = require('./execution');
var display = require('./display');
var util = require('./util');

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

    socket.emit('terminal', display.printDetailedCard(index));

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

  },

  // play a card from hand
  // play handId [boardposition]
  play: function(socket, parts)
  {
      var game = helpers.getGameBySocket(socket);
      var player = helpers.getPlayerBySocket(socket, false);
      var oppositeplayer = helpers.getPlayerBySocket(socket, true);

      // can only play a card on turn
      if(!game.isPlayerTurn(socket))
      {
        socket.emit("terminal", "It is not your turn\n");
        return;
      }

      var handtarget = parts[0];
      var boardtargetafter = parts[1];

      if(handtarget == null)
      {
        socket.emit("terminal", "Select a card from your hand to play, e.g. play h1\n");
        return;
      }

      var cardtoplay = helpers.boardIndexToCard(handtarget, socket); 
      if(cardtoplay == null)
      {
        socket.emit("terminal", "Select a card from your hand to play, e.g. play h1\n");
        return;
      }  

      // if its a minion, it has to have a board target
      if(cardtoplay.type == "MINION")
      {
        // board target must exist and be between 0 and max friendly board count (inclusive)
        if(boardtargetafter == null 
          && !isNaN(boardtargetafter) 
          && boardtargetafter > -1 
          && boardtargetafter <= helpers.getBoardBySocket(socket, false).length)
        {
          socket.emit("terminal", "Select a card from your hand to play, e.g. play h1\n");
          return;
        }
      }

      // card index in hand array
      var indexinhand = handtarget.substring(1);
      indexinhand--;

      console.log(socket.id + " playing index :" + indexinhand);

      // remove card from hand
      var cardinhand = helpers.getHandBySocket(socket, false).splice(indexinhand, 1)[0];

      // announce play to opposite
      helpers.getOppositePlayerSocket(socket).emit('terminal', "Your opponent played...");
      helpers.getOppositePlayerSocket(socket).emit('terminal', display.printDetailedCard(cardinhand));

      // announce play to player
      socket.emit('terminal', 'Playing...');
      socket.emit('terminal', display.printDetailedCard(cardinhand));

      // todo: do game logic

      // if a minion, place on board
      if(cardtoplay.type == "MINION")
      {
        // put card on board
        helpers.getBoardBySocket(socket, false).splice(boardtargetafter, 0, cardinhand);

        // todo: do battlecry
      }

      if(cardtoplay.type == "SPELL")
      {
        // cast spell
      }

      if(cardtoplay.type == "WEAPON");
      {
        // equip weapon
      }

  }


}