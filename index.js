var express = require('express');
var application = express();
var port = process.env.PORT || 3000;
var http = require('http').createServer(application);
var request = require('request'); // "Request" library
var cors = require('cors');
var fs = require('fs');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const io = require('socket.io')(http);
const path = require('path')
const getColors = require('get-image-colors')
const LifxLan = require('node-lifx-lan');
var myBulbs = [];

var client_id = '76dbacbf5b4049a0b04adc95c0de2856'; // Your client id
var client_secret = '6b199d14a5f54340b482da683e998c3a'; // Your secret
var redirect_uri = 'http://localhost:' + port + '/callback'; // Your redirect uri

var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var loginState = false;

var playInterval;
var y;

var currentArt = null;
var albArt = null;
var oldSongInfo = [];
var songInfo = [];
var stateKey = 'spotify_auth_state';
var currentlyPlaying = false;
var access = null;

application.use(express.static(__dirname)).use(cors()).use(cookieParser());
/*
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});
*/

application.get('/login', function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-read-currently-playing user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

application.get('/callback', function (req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;
        access = body.access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/player/currently-playing',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        var options2 = {
          url: 'https://api.spotify.com/v1/me/player',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        playInterval = setInterval(function () { getIfPlaying(options2); }, 500);
        getBulbs(options);
        res.redirect('/');
        loginState = true;
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

application.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

http.listen(port);
console.log('listening on port ' + port);

function getIfPlaying(options) {
  request.get(options, function (error, response, body) {
    if (body != undefined && body.is_playing != currentlyPlaying) {
      currentlyPlaying = body.is_playing;
      io.emit('playState', currentlyPlaying);
    }
  })
}

function changeSong(direction) {
  var command = '';
  if (direction == 'forward') {
    command = 'https://api.spotify.com/v1/me/player/next'
  }
  else if (direction == 'back') {
    command = 'https://api.spotify.com/v1/me/player/previous'
  }
  var options = {
    url: command,
    headers: { 'Authorization': 'Bearer ' + access },
    json: true
  };
  request.post(options, function (error, response, body) {
  });
}

function getBulbs(theseOptions) {
  LifxLan.discover().then((device_list) => {
    console.log(device_list);
    device_list.forEach((device) => {
      if(device.deviceInfo.location.label === "Nate\'s Room")
      	myBulbs.push(device);
    })
    y = setInterval(function () { getCurrentlyPlaying(theseOptions); }, 1000);
  }).catch((error) => {
    console.error(error);
  });
}

function togglePlayback() {
  clearInterval(playInterval);
  var pauseOptions = {
    url: 'https://api.spotify.com/v1/me/player/pause',
    headers: { 'Authorization': 'Bearer ' + access },
    json: true
  };
  var playOptions = {
    url: 'https://api.spotify.com/v1/me/player/play',
    headers: { 'Authorization': 'Bearer ' + access },
    json: true
  };
  var options2 = {
    url: 'https://api.spotify.com/v1/me/player',
    headers: { 'Authorization': 'Bearer ' + access },
    json: true
  };
  if (currentlyPlaying == true) {
    request.put(pauseOptions, function (error, response, body) {
      currentlyPlaying = false;
      io.emit('playState', currentlyPlaying);
      playInterval = setInterval(function () { getIfPlaying(options2); }, 500);
    })
  }
  else {
    request.put(playOptions, function (error, response, body) {
      currentlyPlaying = true;
      io.emit('playState', currentlyPlaying);
      playInterval = setInterval(function () { getIfPlaying(options2); }, 500);
    })
  }
}

function getCurrentlyPlaying(theseOptions) {
  request.get(theseOptions, function (error, response, body) {
    if (body != undefined && body.item != undefined) {
      songInfo = [body.item.name, body.item.artists[0].name, body.item.album.name]
      if (oldSongInfo.length == 0 || (body.item.album.images[2].url != oldSongInfo[0] || body.item.name != oldSongInfo[1] || body.item.artists[0].name != oldSongInfo[2] || body.item.album.name != oldSongInfo[3])) {
        clearInterval(y);
        currentArt = __dirname + '/currentArt/albArt.jpg'
        download(body.item.album.images[2].url, currentArt, function () {
          y = setInterval(function () { getCurrentlyPlaying(theseOptions); }, 1000);
          albArt = body.item.album.images[0].url;
          io.emit('currentSongInfo', songInfo);
          io.emit('albArt', albArt);
          getAlbumColors(currentArt);
        })
        oldSongInfo = [body.item.album.images[2].url, body.item.name, body.item.artists[0].name, body.item.album.name];
      }
    }
  })
}

var download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function getAlbumColors(imagePath) {
  getColors(path.join(imagePath)).then(colors => {
    currentColors = colors.map(color => color.hex())
    setColors(currentColors)
    io.emit('updateColors', colors.map(color => color.hex()));
  })
}

function setColors(colors) {
  var i = 0;
  while (i < myBulbs.length) {
    sendColor(myBulbs[i], colors[i % 5], 1000, 5)
    i++
  }
}

function sendColor(bulb, color, duration, tries) {
  if (tries > 0) {
    try {
      bulb.setColor({
        color: { css: color },
        duration: duration
      })
    }
    catch (err) {
      console.log("Failed, trying again")
      sendColor(bulb, color, duration, tries - 1)
    }
  }
  else{
    console.log("Too many failed attempts")
  }
}

io.on('connection', function (socket) {
  console.log('connected to client');
  io.emit('connect', loginState);
  io.emit('updateLogin', loginState);
  io.emit('currentSongInfo', songInfo);
  if (albArt != null)
    io.emit('albArt', albArt);
  if (currentArt != null)
    getAlbumColors(currentArt);
  socket.on('togglePlayback', function () {
    togglePlayback();
  })
  socket.on('changeSong', function (direction) {
    changeSong(direction);
  })
});


