"use strict"
// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 800,
    height: 900,
    scene: [DreamRift, GameOver],
    fps: 30,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
}

// Global variable to hold sprites
var my = {sprite: {}};

const game = new Phaser.Game(config);
