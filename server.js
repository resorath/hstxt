var http = require('http');
var io = require('socket.io');

http.createServer(function (req, res) {
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello, world!!');
    
}).listen(process.env.PORT || 8080);