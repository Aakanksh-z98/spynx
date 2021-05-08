var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var players = {};
var stars = {
  bananas: {
    x: 55+59,
    y: 39+44,
    found: false
  },
  photograph: {
    x: 45+573,
    y: 48+12,
    found: false
  },
  water: {
    x: 47+115,
    y: 40+197,
    found: false
  },
  lipstick: {
    x: 43+445,
    y: 10+252,
    found: false
  },
  tennis: {
    x: 36+655,
    y: 33+201,
    found: false
  },
  mistletoe: {
    x: 50+24,
    y: 40+409,
    found: false
  },
  sticky: {
    x: 31+282,
    y: 35+317,
    found: false
  },
  carrot: {
    x: 41+485,
    y: 20+403,
    found: false
  },
  tomato: {
    x: 46+693,
    y: 35+397,
    found: false
  },
  spider: {
    x: 26+316,
    y: 15+570,
    found: false
  }
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocations', stars);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnected', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function (starId) {
    if (!stars[starId].found) {
      stars[starId].found = true;
      if (players[socket.id].team === 'red') {
        scores.red += 10;
      } else {
        scores.blue += 10;
      }
      io.emit('starLocations', stars);
      io.emit('scoreUpdate', scores);

    }
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});