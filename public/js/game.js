var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    } 
  };
  
  var game = new Phaser.Game(config);
  
  function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');

    this.load.image('bananas', 'assets/bananas.png');
    this.load.image('photograph', 'assets/photograph.png');
    this.load.image('water', 'assets/water.png');
    this.load.image('lipstick', 'assets/lipstick.png');
    this.load.image('tennis', 'assets/tennis.png');
    this.load.image('mistletoe', 'assets/mistletoe.png');
    this.load.image('sticky', 'assets/sticky.png');
    this.load.image('carrot', 'assets/carrot.png');
    this.load.image('tomato', 'assets/tomato.png');
    this.load.image('spider', 'assets/spider.png');

    this.load.image('scene', 'assets/scene.png');
  }
  
  function create() {

    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();

    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          addPlayer(self, players[id]);
        } else {
          addOtherPlayers(self, players[id]);
        }
      });
    });

    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    });

    this.socket.on('disconnected', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
  
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.blueScoreText.depth = 1;
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
    this.redScoreText.depth = 1;
    
    this.socket.on('scoreUpdate', function (scores) {
      self.blueScoreText.setText('Blue: ' + scores.blue);
      self.redScoreText.setText('Red: ' + scores.red);
    });

    this.add.image(400, 300, 'scene');
    this.starLocations = {};
    game.input.mouse.capture = true;
    this.cursors = this.input.keyboard.createCursorKeys();

    this.socket.on('starLocations', function (starLocations) {
      for (let [starId, starData] of Object.entries(starLocations)) {
        if (starData.found && self.starLocations[starId]) self.starLocations[starId].destroy();
        if (!starData.found && !self.starLocations[starId]) {
          self.starLocations[starId] = self.physics.add.image(starData.x, starData.y, starId);
          self.starLocations[starId].depth = 0;
          self.physics.add.overlap(self.ship, self.starLocations[starId], function () {
            if (game.input.mousePointer.leftButtonDown()) {
              console.log(starId);
              this.socket.emit('starCollected', starId);
            }
          }, null, self);
        }
      }
    });
  }
  
  function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    self.ship.depth = 1;
    if (playerInfo.team === 'blue') {
      self.ship.setTint(0x0000ff);
    } else {
      self.ship.setTint(0xff0000);
    }
  }
  
  function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.depth = 1;
    self.otherPlayers.add(otherPlayer);
  }
  
  function update() {
    if (this.ship) {
      // emit player movement
      this.ship.x = game.input.mousePointer.x;
      this.ship.y = game.input.mousePointer.y;
      if (this.ship.oldPosition && (this.ship.x !== this.ship.oldPosition.x || this.ship.y !== this.ship.oldPosition.y)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y });
      }
      // save old position data
      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y
      };
    }
  }