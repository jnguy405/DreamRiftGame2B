class DreamRift extends Phaser.Scene {
    graphics;
    curve;
    path;

    constructor() {
        super('DreamRift');
        this.my = { sprite: {} };
        this.gameOverTriggered = false;

        // Player and background properties
        this.bgX = 400;
        this.bgY = 450;
        this.endBackgroundY = 900;
        this.playerX = 400;
        this.playerY = 780;

        // Whimsy positions (column 1)
        this.greenwhimsyX = this.bgX - 250;
        this.greenwhimsyY = 220;
        this.bluewhimsyX = this.bgX - 250;
        this.bluewhimsyY = this.greenwhimsyY + 100;
        this.pinkwhimsyX = this.bgX - 250;
        this.pinkwhimsyY = this.bluewhimsyY + 100;

        // Flutter positions
        this.flutterX = 800;
        this.flutterY = 650;

        this.maxBullets = 10;

        // Number of update() calls to wait before making a new bullet
        this.bulletCooldown = 3;
        this.bulletCooldownCounter = 0;

        // Timer
        this.timer = 30;
        this.timerText = null; 
        this.timerEvent = null; 

        // Waves
        this.wave = 1; 
        this.waveText = null;

        // Score
        this.score = 0; 
        this.scoreText = null; 
        this.scoreValueText = null; 

        // Bee Delay
        this.beeStartTime = 15000; 
        this.beeActive = false;
        this.beeHasAppeared = false;
        this.beeSpeed = 1.5; // Speed multiplier (1 = normal, >1 = faster)

        // Player health properties
        this.playerMaxHealth = 100;
        this.playerHealth = this.playerMaxHealth;
        this.healthBar = null;
        this.healthBarBg = null;
        this.healthText = null;
    }

    init(data) {
        if (data.reset) {
            this.score = 0;
            this.wave = 1;
            this.timer = 30;
            this.playerHealth = this.playerMaxHealth;
        }
    }
    
    preload() {
        this.load.setPath("./assets/");
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // Background and Player assets
        this.load.image('bg', 'DreamRiftBackground.png');
        this.load.image('PlayerPinkShip', 'shipPink.png');
        this.load.image('SleepStars', 'laserYellowBurst.png');

        // Whimsy and projectiles
        this.load.image('GreenWhimsy', 'alienGreen.png');
        this.load.image('BlueWhimsy', 'alienBlue.png');
        this.load.image('PinkWhimsy', 'alienPink.png');
        this.load.image('ProjGreenWhimsy', 'alienGreen_badge2.png');
        this.load.image('ProjBlueWhimsy', 'alienBlue_badge2.png');
        this.load.image('ProjPinkWhimsy', 'alienPink_badge2.png');

        // Hurt and float images for whimsy
        this.load.image('HurtGreenWhimsy', 'alienGreen_hurt.png');
        this.load.image('HurtBlueWhimsy', 'alienBlue_hurt.png');
        this.load.image('HurtPinkWhimsy', 'alienPink_hurt.png');
        this.load.image('FloatGreenWhimsy', 'alienGreen_swim1.png');
        this.load.image('FloatBlueWhimsy', 'alienBlue_swim1.png');
        this.load.image('FloatPinkWhimsy', 'alienPink_swim1.png');

        // Bee assets
        this.load.image('Bee_Fly', 'bee_fly.png');
        this.load.image('Bee_Dead', 'bee_dead.png');

        // Audio
        this.load.audio('SleepStar', 'audio/laserLarge_002.ogg');
        this.load.audio('whimsies', 'audio/laserSmall_004.ogg');
        this.load.audio('dead', 'audio/doorOpen_001.ogg');
    }

    create() {
        const my = this.my;
        this.gameOverTriggered = false;

        // Background setup
        this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        // ======================== PLAYER ========================
        // Player setup
        my.sprite.player = this.add.sprite(this.playerX, this.playerY, 'PlayerPinkShip').setScale(0.8);
        my.sprite.projPlayer = [];
        this.createHealthBar();

        // ======================== CREATURES ========================
        
        // Whimsy creatures setup
        my.sprite.creatures = { GreenWhimsy: [], BlueWhimsy: [], PinkWhimsy: [] };
        my.sprite.flutters = { Bee: [] };
        my.sprite.projBlueWhimsy = [];
        my.sprite.projGreenWhimsy = [];

        // Create whimsy creatures
        const numWhimsies = 7;
        const spacing = 500 / 7;
        for (let i = 0; i < numWhimsies; i++) {
            const startX = this.playerX - ((numWhimsies - 1) * spacing) / 2;
            const whimsyG = this.createWhimsy(startX, i, this.greenwhimsyY, 'GreenWhimsy');
            const whimsyB = this.createWhimsy(startX, i, this.bluewhimsyY, 'BlueWhimsy');
            const whimsyP = this.createWhimsy(startX, i, this.pinkwhimsyY, 'PinkWhimsy');

            // Initialize state properties
            whimsyG.state = "idle";
            whimsyG.isAlive = true;
            whimsyB.state = "idle";
            whimsyB.isAlive = true;
            whimsyP.state = "idle";
            whimsyP.isAlive = true;

            my.sprite.creatures.GreenWhimsy.push(whimsyG);
            my.sprite.creatures.BlueWhimsy.push(whimsyB);
            my.sprite.creatures.PinkWhimsy.push(whimsyP);
        }

        // Create flutter (Bee)
        const flutter = this.add.sprite(this.flutterX, this.flutterY, 'Bee_Fly').setVisible(false); // Start invisible
        flutter.dead = false;
        my.sprite.flutters.Bee.push(flutter);

        // ======================== PATHS ========================
        // Path Setup
        const pointsBee = [810, 600, 778, 579, 749, 550, 717, 529, 672, 520, 625, 529, 589, 546, 
                           559, 563, 534, 579, 498, 595, 460, 597, 422, 580, 387, 554, 350, 531, 312, 
                           531, 268, 543, 232, 563, 194, 590, 150, 603, 102, 584, 72, 561, 50, 534, 
                           25, 513, -10, 502];

        // Create paths using the points
        this.pathBee = new Phaser.Curves.Spline(pointsBee);

        // ======================== CONTROLS ========================

        // Player controls setup
        this.keys = this.input.keyboard.addKeys('A,D');
        this.fireRate = 250;
        this.lastFired = 0;

        // Fire projectiles on mouse click
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.time.now - this.lastFired > this.fireRate) {
                const proj = this.add.sprite(my.sprite.player.x, my.sprite.player.y - 20, 'SleepStars').setScale(0.5);
                my.sprite.projPlayer.push(proj);
                this.lastFired = this.time.now;
                this.sound.play('SleepStar', { volume: 0.5 });
            }
        });

        // ======================== TIMER SETUP ========================

        // Create a timed event that repeats every second (1000ms)
        this.timerEvent = this.time.addEvent({
            delay: 1000, // 1 second
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        WebFont.load({
            google: {
                families: ['Play']
            },
            active: () => {
                const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
                const seconds = (this.timer % 60).toString().padStart(2, '0');
                this.timerText = this.add.text(this.scale.width - 20, 20, `${minutes}:${seconds}`, {
                    fontFamily: 'Play',
                    fontSize: '24px',
                    color: '#FFFFFF', 
                    stroke: '#cc4125',
                    strokeThickness: 6,
                    shadow: {
                        offsetX: 3,
                        offsetY: 3,
                        color: '#000',
                        blur: 0,
                        stroke: true
                    }
                }).setOrigin(1, 0);
                // Wave counter 
                this.waveText = this.add.text(20, 20, `WAVE ${this.wave.toString().padStart(2, '0')}`, {
                    fontFamily: 'Play',
                    fontSize: '24px',
                    color: '#FFFFFF',
                    stroke: '#cc4125', 
                    strokeThickness: 6,
                    shadow: {
                        offsetX: 3,
                        offsetY: 3,
                        color: '#000',
                        blur: 0,
                        stroke: true
                    }
                }).setOrigin(0, 0);
                // Score Title (center top)
                this.scoreText = this.add.text(this.scale.width/2, 15, 'SCORE', {
                    fontFamily: 'Play',
                    fontSize: '18px',
                    color: '#FFFFFF', 
                    stroke: '#cc4125',
                    strokeThickness: 4,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: '#000',
                        blur: 0,
                        stroke: true
                    }
                }).setOrigin(0.5, 0);
                // Score Value (below title)
                this.scoreValueText = this.add.text(this.scale.width/2, 40, this.score.toString().padStart(6, '0'), {
                    fontFamily: 'Play',
                    fontSize: '24px',
                    color: '#FFFFFF',
                    stroke: '#cc4125',
                    strokeThickness: 6,
                    shadow: {
                        offsetX: 3,
                        offsetY: 3,
                        color: '#000',
                        blur: 0,
                        stroke: true
                    }
                }).setOrigin(0.5, 0);
            }
        });
    }

    update() {
        const my = this.my;
        const speed = 2.5;
        const halfWidth = my.sprite.player.displayWidth / 2;

        if (this.keys.A.isDown && my.sprite.player.x > halfWidth) my.sprite.player.x -= speed;
        if (this.keys.D.isDown && my.sprite.player.x < this.scale.width - halfWidth) my.sprite.player.x += speed;

        this.updateEnemies();          // Handles all whimsy types in one function
        this.updateProjectiles();      // Handles all projectile types
        this.updateCollisions();       // Handles all collision types
        this.moveBeeAlongPath(my.sprite.flutters.Bee[0], this.pathBee);
    
        // Game state checks
        if (this.allEnemiesDead() && !this.gameOverTriggered) {
            this.handleGameOver(true);
        }
    }

    // ======================== CREATION & INITIALIZATION ========================

    createWhimsy(startX, i, yPosition, whimsyType) {
        const whimsy = this.add.sprite(startX + i * 500 / 7, yPosition, whimsyType).setScale(0.8);
        whimsy.homeX = startX + i * 500 / 7;
        whimsy.homeY = yPosition;
        return whimsy;
    }

    createHealthBar() {
        const healthBarWidth = 200;
        const healthBarHeight = 30;
        const x = 20;
        const y = this.scale.height - 40;

        // Health bar background
        this.healthBarBg = this.add.rectangle(x, y, healthBarWidth, healthBarHeight, 0x990000)
            .setOrigin(0, 0.5);

        // Health bar foreground
        this.healthBar = this.add.rectangle(x, y, healthBarWidth, healthBarHeight, 0x00ff00)
            .setOrigin(0, 0.5);

        // Health text
        this.healthText = this.add.text(
            x + healthBarWidth/2, y,
            `${this.playerHealth}/${this.playerMaxHealth}`,
            {
                fontFamily: 'Play',
                fontSize: '16px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        // Border
        this.healthBarBorder = this.add.graphics();
        this.healthBarBorder.lineStyle(2, 0xffffff);
        this.healthBarBorder.strokeRect(x, y - healthBarHeight/2, healthBarWidth, healthBarHeight);
    }

    // ======================== MOVEMENT & PATHFINDING ========================

    moveBeeAlongPath(bee, path) {
        if (!bee || bee.dead || this.beeHasAppeared) return;

        if (!this.beeActive && this.time.now >= this.beeStartTime) {
            this.beeActive = true;
            bee.setVisible(true);
        }

        if (this.beeActive) {
            const elapsed = this.time.now - this.beeStartTime;
            const duration = 3000 / this.beeSpeed;
            const t = Math.min(1, elapsed / duration);
            
            const point = path.getPointAt(t);
            bee.x = point.x;
            bee.y = point.y;

            if (t >= 1) {
                this.beeHasAppeared = true;
                bee.setVisible(false);
            }
        }
    }

    // ======================== ENEMY MANAGEMENT ========================

    updateEnemies() {
        const enemyTypes = ['PinkWhimsy', 'BlueWhimsy', 'GreenWhimsy'];
        
        enemyTypes.forEach((type, typeIndex) => {
            this.my.sprite.creatures[type].forEach((enemy, index) => {
                switch(enemy.state) {
                    case "dying":
                        this.handleDyingState(enemy);
                        if (enemy.state === "dead" && typeIndex < 2) {
                            this.triggerNextEnemy(typeIndex, index);
                        }
                        break;
                        
                    case "waiting":
                        if (this.time.now >= enemy.activationTime) {
                            this.startEnemyAttack(enemy, type);
                        }
                        break;
                        
                    case "moving":
                        this.updateEnemyMovement(enemy);
                        if ((type === 'BlueWhimsy' || type === 'GreenWhimsy') && this.time.now % 300 < 10) {
                            this.fireEnemyProjectile(enemy, type);
                        }
                        break;
                }
            });
        });
    }

    handleDyingState(enemy) {
        const progress = Math.min(1, (this.time.now - enemy.fallStartTime) / enemy.fallDuration);
        enemy.y = enemy.startY + (this.endBackgroundY - enemy.startY) * progress;
        enemy.angle = 360 * progress;

        if (progress >= 1) {
            enemy.state = "dead";
            enemy.setVisible(false);
        }
    }

    triggerNextEnemy(typeIndex, enemyIndex) {
        const nextType = ['PinkWhimsy', 'BlueWhimsy', 'GreenWhimsy'][typeIndex + 1];
        const nextEnemy = this.my.sprite.creatures[nextType][enemyIndex];
        if (nextEnemy.state === "idle") {
            nextEnemy.state = "waiting";
            nextEnemy.activationTime = this.time.now + (typeIndex === 0 ? 3000 : 4000);
        }
    }

    startEnemyAttack(enemy, type) {
        enemy.state = "moving";
        enemy.setTexture(`Float${type}`);
        enemy.flipX = this.my.sprite.player.x < enemy.x;
        enemy.targetX = this.my.sprite.player.x;
        enemy.targetY = this.my.sprite.player.y;
        enemy.startX = enemy.x;
        enemy.startY = enemy.y;
        enemy.moveStartTime = this.time.now;
        enemy.moveDuration = 1000;
    }

    updateEnemyMovement(enemy) {
        enemy.flipX = this.my.sprite.player.x < enemy.x;
        const progress = Math.min(1, (this.time.now - enemy.moveStartTime) / enemy.moveDuration);
        
        enemy.x = enemy.startX + (enemy.targetX - enemy.startX) * progress;
        enemy.y = enemy.startY + (enemy.targetY - enemy.startY) * progress;

        if (progress >= 1 || Math.abs(enemy.y - enemy.targetY) < 2) {
            enemy.state = "dying";
            enemy.setScale(0.5);
            enemy.fallStartTime = this.time.now;
            enemy.fallDuration = 1000;
            enemy.startY = enemy.y;
        }
    }

    fireEnemyProjectile(enemy, type) {
        const proj = this.add.sprite(enemy.x, enemy.y + 20, `Proj${type}`).setScale(0.5);
        this.my.sprite[`proj${type}`].push(proj);
        this.sound.play('whimsies', { volume: 0.3 });
    }

    handleBeeDeathAndCooldown(flyingBee) {
        if (flyingBee?.dead && !this.fireRateReduced) {
            this.fireRate = Math.max(50, this.fireRate - 50);
            this.fireRateReduced = true;

            this.time.delayedCall(10000, () => {
                this.fireRate = 250;
                this.fireRateReduced = false;
                flyingBee.dead = false;
            });
        }
    }

    // ======================== PROJECTILE MANAGEMENT ========================

    updateProjectiles() {
        const projectileGroups = [
            { array: this.my.sprite.projPlayer, speed: -5, filter: p => p.y > -p.displayHeight },
            { array: this.my.sprite.projBlueWhimsy, speed: 3, filter: p => p.y < this.scale.height + p.displayHeight },
            { array: this.my.sprite.projGreenWhimsy, speed: 3, filter: p => p.y < this.scale.height + p.displayHeight }
        ];
        
        projectileGroups.forEach(group => {
            group.array.forEach(proj => proj.y += group.speed);
            group.array = group.array.filter(group.filter);
        });
    }

    // ======================== COLLISION & DAMAGE ========================

    updateCollisions() {
        this.checkPlayerProjectileCollisions();
        this.checkEnemyProjectileCollisions();
        this.checkFallingWhimsyCollision();
    }

    checkPlayerProjectileCollisions() {
        this.my.sprite.projPlayer.forEach(proj => {
            // Enemies
            Object.keys(this.my.sprite.creatures).forEach(type => {
                this.my.sprite.creatures[type].forEach(enemy => {
                    if (enemy.state !== "dead" && this.collides(enemy, proj)) {
                        this.handleCreatureCollision(enemy, proj, type);
                    }
                });
            });
            
            // Flutters
            Object.keys(this.my.sprite.flutters).forEach(type => {
                this.my.sprite.flutters[type].forEach(flutter => {
                    if (this.collides(flutter, proj)) {
                        this.handleFlutterCollision(flutter, proj);
                    }
                });
            });
        });
    }

    checkEnemyProjectileCollisions() {
        if (this.isInvulnerable) return;
        
        let hit = false;
        [...this.my.sprite.projBlueWhimsy, ...this.my.sprite.projGreenWhimsy].forEach(proj => {
            if (this.collides(this.my.sprite.player, proj)) {
                proj.y = -100;
                hit = true;
            }
        });
        
        if (hit) {
            this.updateHealth(5);
            this.playerHitEffects(false);
        }
    }

    checkFallingWhimsyCollision() {
        if (this.isInvulnerable) return false;
        
        let hit = false;
        ['PinkWhimsy', 'BlueWhimsy', 'GreenWhimsy'].forEach(type => {
            this.my.sprite.creatures[type].forEach(whimsy => {
                if (whimsy.state === "dying" && this.collides(this.my.sprite.player, whimsy)) {
                    whimsy.state = "dead";
                    whimsy.setVisible(false);
                    hit = true;
                }
            });
        });
        
        if (hit) {
            this.updateHealth(15);
            this.playerHitEffects(true);
            return true;
        }
        return false;
    }

    handleCreatureCollision(creature, proj, groupName) {
        creature.setTexture('Hurt' + groupName).setScale(0.5).setRotation(Phaser.Math.DegToRad(315));
        creature.state = "dying";
        creature.fallStartTime = this.time.now;
        creature.fallDuration = 1000;
        creature.startY = creature.y;
        proj.y = -100;
        this.addScore(0, groupName);
        this.sound.play('dead', { volume: 0.4 });
    }

    handleFlutterCollision(flutter, proj) {
        if (this.beeHasAppeared) return;
        flutter.setTexture('Bee_Dead').setScale(0.5);
        flutter.dead = true;
        this.beeHasAppeared = true;
        this.tweens.add({
            targets: flutter,
            y: this.endBackgroundY,
            angle: 360,
            ease: 'Linear',
            duration: 1000,
            onComplete: () => flutter.setVisible(false)
        });
        proj.y = -100;
        this.addScore(0, 'Bee');
    }

    // ======================== PLAYER EFFECTS ========================

    playerHitEffects(isFallingHit = false) {
        // Visual feedback
        this.tweens.add({
            targets: this.my.sprite.player,
            alpha: isFallingHit ? 0.3 : 0.5,
            duration: isFallingHit ? 200 : 100,
            yoyo: true
        });

        // Screen shake
        this.cameras.main.shake(isFallingHit ? 200 : 100, isFallingHit ? 0.02 : 0.01);
        
        // Set invulnerability
        this.isInvulnerable = true;
        this.time.delayedCall(1000, () => this.isInvulnerable = false);
        
        // Score penalty and effects
        this.addScore(isFallingHit ? -15 : -5);
        
        if (isFallingHit) {
            this.tweens.add({
                targets: this.scoreValueText,
                x: { from: this.scale.width/2 - 10, to: this.scale.width/2 + 10 },
                yoyo: true,
                repeat: 5,
                duration: 50,
                ease: 'Sine.inOut'
            });
            
            this.scoreValueText.setColor('#FF0000');
            this.time.delayedCall(500, () => this.scoreValueText.setColor('#FFFFFF'));
        }
    }

    playerDeath() {
        this.tweens.add({
            targets: this.my.sprite.player,
            alpha: 0,
            duration: 1000,
            onComplete: () => this.handleGameOver(false)
        });
    }

    // ======================== HEALTH MANAGEMENT ========================

    updateHealth(damage) {
        this.playerHealth = Phaser.Math.Clamp(this.playerHealth - damage, 0, this.playerMaxHealth);
        this.updateHealthBar();
        
        if (this.playerHealth <= 0) {
            this.playerDeath();
        }
    }

    updateHealthBar() {
        const healthPercentage = this.playerHealth / this.playerMaxHealth;
        const currentWidth = 200 * healthPercentage;
        
        this.healthBar.width = currentWidth;
        
        if (healthPercentage < 0.3) {
            this.healthBar.setFillStyle(0xff0000);
        } else if (healthPercentage < 0.6) {
            this.healthBar.setFillStyle(0xffa500);
        } else {
            this.healthBar.setFillStyle(0x00ff00);
        }
        
        this.healthText.setText(`${this.playerHealth}/${this.playerMaxHealth}`);
        
        this.tweens.add({
            targets: [this.healthBar, this.healthBarBg, this.healthBarBorder],
            scaleX: 1.05,
            scaleY: 1.1,
            yoyo: true,
            duration: 100
        });
    }

    // ======================== SCORE & WAVE MANAGEMENT ========================

    addScore(points, enemyType = null) {
        if (enemyType) {
            points = {
                'PinkWhimsy': 10,
                'GreenWhimsy': 15,
                'BlueWhimsy': 20,
                'Bee': 30
            }[enemyType] || points;
        }
        
        this.score = Math.max(0, this.score + points);
        this.scoreValueText.setText(this.score.toString().padStart(6, '0'));
        
        this.tweens.add({
            targets: this.scoreValueText,
            scale: { from: 1.2, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
        
        this.scoreValueText.setColor(points >= 0 ? '#BF40BF' : '#FF0000');
        this.time.delayedCall(150, () => this.scoreValueText.setColor('#FFFFFF'));
    }

    completeWave() {
        const waveBonus = this.wave >= 6 ? 225 : 125;
        this.addScore(waveBonus);
        this.wave++;
        this.waveText.setText(`WAVE ${this.wave.toString().padStart(2, '0')}`);
        
        this.tweens.add({
            targets: this.waveText,
            scale: { from: 1.3, to: 1 },
            duration: 500,
            ease: 'Elastic.out'
        });
    }

    // ======================== GAME STATE MANAGEMENT ========================

    allEnemiesDead() {
        const enemyTypes = ['PinkWhimsy', 'BlueWhimsy', 'GreenWhimsy'];
        const allDead = enemyTypes.every(type => 
            this.my.sprite.creatures[type].every(enemy => 
                enemy.state === "dead" || !enemy.active
            )
        );
        
        const beeDeadOrInactive = this.beeHasAppeared || 
                                (this.my.sprite.flutters.Bee[0]?.dead);
        
        return allDead && beeDeadOrInactive;
    }

    handleGameOver(win) {
        this.gameOverTriggered = true;
        
        if (this.timerEvent && !this.timerEvent.paused) {
            this.timerEvent.paused = true;
            this.timerText.setColor('#00FF00');
        }
        
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOver', {
                score: this.score,
                wave: this.wave,
                win: win
            });
        });
    }

    updateTimer() {
        if (this.timer <= 0) return;
        
        this.timer--;
        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        this.timerText.setText(`${minutes}:${seconds}`);
        
        if (this.timer <= 10) {
            this.timerText.setAlpha(this.timer % 2 === 0 ? 1 : 0.7);
            this.tweens.add({
                targets: this.timerText,
                scale: { from: 1, to: 1.3 },
                yoyo: true,
                duration: 500
            });
        }
        
        if (this.timer === 0) {
            this.time.delayedCall(1000, () => this.handleGameOver(false));
        }
    }

    shutdown() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
    }

    // ======================== THAT ONE FUNCTION I NEED ========================

    collides(a, b) {
        return Phaser.Geom.Intersects.RectangleToRectangle(
            a.getBounds(),
            b.getBounds()
        );
    }
}