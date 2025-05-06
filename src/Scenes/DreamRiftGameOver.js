class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalWave = data.wave || 1;
        this.win = data.win || false;
    }
    
    create() {
        // Background setup - Light pink base with baby blue overlay
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xF8D7E8).setOrigin(0); // Soft pink
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x89CFF0, 0.3).setOrigin(0); // Baby blue overlay

        // Game Over text
        const gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 3,
            this.win ? "DREAM CONQUERED!" : "DREAM DISRUPTED",
            {
                fontFamily: 'Kevin',
                fontSize: '48px',
                color: this.win ? '#89CFF0' : '#FF6B8B',
                stroke: '#FFFFFF',
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 0,
                    stroke: true
                }
            }
        ).setOrigin(0.5);

        // Stats display
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            `Waves Cleared: ${this.finalWave}\nFinal Score: ${this.finalScore.toString().padStart(6, '0')}`,
            {
                fontFamily: 'Kevin',
                fontSize: '32px',
                color: '#5D5D5D',
                stroke: '#FFFFFF',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);

        // Play Again button - Baby blue with pink hover
        const playAgainButton = this.add.text(
            this.scale.width / 2,
            this.scale.height * 2/3,
            'PLAY AGAIN',
            {
                fontFamily: 'Kevin',
                fontSize: '36px',
                color: '#FFFFFF',
                backgroundColor: '#89CFF0',
                padding: { x: 30, y: 15 },
                stroke: '#FFFFFF',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setInteractive();

        // Hover effects
        playAgainButton.on('pointerover', () => {
            playAgainButton.setStyle({ 
                fill: '#FFFFFF',
                backgroundColor: '#FFB6C1' // Light pink on hover
            });
            if (this.sound.get('button_hover')) {
                this.sound.play('button_hover', { volume: 0.5 });
            }
        });

        playAgainButton.on('pointerout', () => {
            playAgainButton.setStyle({ 
                fill: '#FFFFFF',
                backgroundColor: '#89CFF0' // Back to baby blue
            });
        });

        playAgainButton.on('pointerdown', () => {
            if (this.sound.get('button_click')) {
                this.sound.play('button_click', { volume: 0.7 });
            }
            
            this.scene.stop('DreamRift'); // Stop existing game
            this.scene.start('DreamRift', { 
                reset: true
            });
        });

        // Text animation
        this.tweens.add({
            targets: gameOverText,
            scale: { from: 0.8, to: 1.1 },
            yoyo: true,
            duration: 1500,
            repeat: -1
        });
    }
}