var http = require('http');
var io = require('socket.io')(http);

http.createServer(function (req, res) {
    
	console.log("Serving request!");
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello, world!!');
    
}).listen(process.env.PORT || 8080);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
