var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var http = require('http').createServer(app);
const io = require('socket.io')(http);
var Vibrant = require('node-vibrant')
const path = require('path')
const getColors = require('get-image-colors')

app.use(express.static(__dirname));
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.set("ipaddr", "localhost");
app.set("port", port);

http.listen(port, 'localhost');
console.log('listening on port ' + port)

io.on('connection', function(socket) {
    console.log('connected to client');
    io.emit('connect'); 
    socket.on('getColors', function(imagePath) {
        getColors(path.join(__dirname, imagePath)).then(colors => {
            colors.map(color => color.hex());
            io.emit('updateColors', colors.map(color => color.hex())); 
          })
    });
});