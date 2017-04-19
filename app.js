var http = require('http');
var io = require('socket.io')(http);

var server = http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("Hello Azure!?");
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


var port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);