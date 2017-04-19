var http = require('http');

http.createServer(function (req, res) {
    
	console.log("Serving request!");
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello, world!!');
    
}).listen(process.env.PORT || 8080);