module.exports = {

  helpers: null,
  execution: null,
  display: null,

  init: function(helpers, execution, display)
  {
    this.helpers = helpers;
    this.execution = execution;
    this.display = display;
  },

  // test
  meow: function(socket, parts)
  {
    console.log("mew mew");
    socket.emit('control', { command: "prompt", prompt: "mew?> " });

    var agame = this.helpers.getGameBySocket(socket);
    var that = this;
    
    socket.promptCallback = function(command, socket)
    {
      console.log("meow meow " + command);
      var agame = that.helpers.getGameBySocket(socket);

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
    this.execution.endTurn(socket);

  },

  // look at a card
  look: function(socket, parts)
  {
    // parse what we want to look at. 
    var lookatindex = parts[0];

    if(!lookatindex)
      return null;

    var index = this.helpers.boardIndexToCard(lookatindex, socket);

    if(index == null)
      return;

    socket.emit('terminal', this.display.printDetailedCard(index));

  },

  // print out board
  board: function(socket, parts)
  {
      var response = "\nYour opponent has " + this.helpers.getHandBySocket(socket, true).length + " cards\n" +
      "\nOpponent's side:\n\n";

      var i = 1;
      var that = this;

      this.helpers.getBoardBySocket(socket, true).forEach(function(card) {
        response += "o" + i + ": " + that.display.printCard(card) + "\n";
        i++;
      });

      response += "\n------------\n\nYour side:\n\n";

      i = 1;

      this.helpers.getBoardBySocket(socket, false).forEach(function(card) {
        response += "m" + i + ": " + that.display.printCard(card) + "\n";
        i++;
      });  

      response += "\nYour hand:\n\n";

      i = 1;

      this.helpers.getHandBySocket(socket, false).forEach(function(card) {
        response += "h" + i + ": " + that.display.printCard(card) + "\n";
        i++;
      });  

      response += "\n";

      socket.emit('terminal', response);

  }
}