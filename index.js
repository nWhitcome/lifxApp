var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var http = require('http');
const io = require('socket.io')(http);
var Vibrant = require('node-vibrant')

app.use(express.static(__dirname));
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});

var httpServer = http.createServer(app);
httpServer.listen(port);
console.log('listening on port ' + port)

io.on('connection', function(socket) {
    console.log('connected to client');
    io.emit('connect'); 
  });