function feedback() {
    confirm('Clicking Okay will lead you offsite to a feedback form.');
    if (true) {
        window.open('mailto:M__carlson1345@outlook.com');
    }
}

function showChangelog() {
    const changelog = document.getElementById('changelog');
    changelog.style.display = changelog.style.display === 'block' ? 'none' : 'block';
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const floorHeight = 30;
let player, enemies, enemyCount, defeatedCount, level, enemySpeed, enemySpawnInterval, gameStarted, gameOver;
let crosshair = { x: canvas.width / 2, y: canvas.height / 2, size: 10 };
let boxes = [];
let shootingInterval;
const laserFireRate = 100; // time in milliseconds between laser shots
let laserActive = false; // Track if the laser is currently firing

function createBoxes() {
    const boxCount = 15;
    const boxWidth = 60;
    const boxHeight = 20;
    boxes = [];
    for (let i = 0; i < boxCount; i++) {
        boxes.push({
            x: Math.random() * (canvas.width - boxWidth),
            y: canvas.height - (Math.random() * (canvas.height / 2)) - boxHeight,
            width: boxWidth,
            height: boxHeight
        });
    }
}

function resetGame() {
    player = {
        x: 50,
        y: canvas.height - floorHeight - 30,
        width: 30,
        height: 30,
        speed: 5,
        dy: 0,
        gravity: 0.5,
        jumpStrength: 15,
        jumping: false,
        bullets: [],
        weapon: 'basic'
    };

    enemies = [];
    enemyCount = 0;
    defeatedCount = 0;
    level = 1;
    enemySpeed = 2;
    enemySpawnInterval = 2000;

    gameStarted = false;
    gameOver = false;
    document.getElementById('weaponUI').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
}

function startGame() {
    resetGame();
    gameStarted = true;
    createBoxes();
    document.getElementById('weaponUI').style.display = 'block';
    document.getElementById('titleScreen').style.display = 'none'; // Hide title screen
    setInterval(spawnEnemy, enemySpawnInterval);
    update();
}

function spawnEnemy() {
    const enemy = {
        x: Math.random() * canvas.width,
        y: 0,
        width: 30,
        height: 30,
        speed: enemySpeed,
        dy: 0
    };
    enemies.push(enemy);
    enemyCount++;
}

function update() {
    if (!gameStarted || gameOver) return;

    // Move player
    if (keys.right) player.x += player.speed;
    if (keys.left) player.x -= player.speed;
    if (keys.jump && !player.jumping) {
        player.dy = -player.jumpStrength;
        player.jumping = true;
    }

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height >= canvas.height - floorHeight) {
        player.y = canvas.height - floorHeight - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    boxes.forEach(box => {
        if (
            player.x < box.x + box.width &&
            player.x + player.width > box.x &&
            player.y + player.height < box.y + box.height &&
            player.y + player.height + player.dy >= box.y
        ) {
            player.y = box.y - player.height;
            player.dy = 0;
            player.jumping = false;
        }
    });

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;

        if (bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            player.bullets.splice(index, 1);
        }

        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemies.splice(enemyIndex, 1);
                player.bullets.splice(index, 1);
                defeatedCount++;
                checkLevelUp();
            }
        });
    });

    enemies.forEach(enemy => {
        enemy.dy += player.gravity;
        enemy.y += enemy.dy;

        // Check ground collision for enemies
        if (enemy.y + enemy.height >= canvas.height - floorHeight) {
            enemy.y = canvas.height - floorHeight - enemy.height;
            enemy.dy = 0;
        }

        boxes.forEach(box => {
            if (
                enemy.x < box.x + box.width &&
                enemy.x + enemy.width > box.x &&
                enemy.y + enemy.height >= box.y &&
                enemy.y + enemy.height + enemy.dy >= box.y
            ) {
                enemy.y = box.y - enemy.height;
                enemy.dy = 0;
            }
        });

        // Move enemy towards the player
        if (enemy.x < player.x) {
            enemy.x += enemy.speed;
        } else {
            enemy.x -= enemy.speed;
        }

        // Check for player collision
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            gameOver = true;
            document.getElementById('gameOverScreen').style.display = 'block';
            updateHighScore(); // Update high score if necessary
        }
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, canvas.height - floorHeight, canvas.width, floorHeight);

    // Draw player
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw boxes
    ctx.fillStyle = 'orange';
    boxes.forEach(box => {
        ctx.fillRect(box.x, box.y, box.width, box.height);
    });

    // Draw bullets
    ctx.fillStyle = 'yellow';
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    ctx.fillStyle = 'blue';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw crosshair
    ctx.fillStyle = 'green';
    ctx.fillRect(crosshair.x - crosshair.size / 2, crosshair.y - crosshair.size / 2, crosshair.size, crosshair.size);

    // Draw stats
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Enemies Spawned: ${enemyCount}`, 10, 30);
    ctx.fillText(`Enemies Defeated: ${defeatedCount}`, canvas.width - 150, 30);
    ctx.fillText(`Level: ${level}`, canvas.width / 2 - 20, 30);

    requestAnimationFrame(update);
}

function checkLevelUp() {
    if (defeatedCount % 5 === 0) {
        level++;
        enemySpeed += 0.5;
    }
}

let keys = { right: false, left: false, jump: false };

window.addEventListener('keydown', (e) => {
    if (e.key === 'd') keys.right = true;
    if (e.key === 'a') keys.left = true;
    if (e.key === ' ') keys.jump = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'd') keys.right = false;
    if (e.key === 'a') keys.left = false;
    if (e.key === ' ') keys.jump = false;
});

function shoot() {
    const bulletWidth = 10;
    const bulletHeight = 5;
    const bulletSpeed = 10;

    const dx = crosshair.x - (player.x + player.width);
    const dy = crosshair.y - (player.y + player.height / 4);
    const angle = Math.atan2(dy, dx);
    const speedX = bulletSpeed * Math.cos(angle);
    const speedY = bulletSpeed * Math.sin(angle);

    switch (player.weapon) {
        case 'basic':
            player.bullets.push({
                x: player.x + player.width,
                y: player.y + (player.height / 4),
                width: bulletWidth,
                height: bulletHeight,
                speedX: speedX,
                speedY: speedY
            });
            break;
        case 'laser':
            if (!laserActive) {
                laserActive = true; // Start firing
                shootingInterval = setInterval(() => {
                    player.bullets.push({
                        x: player.x + player.width,
                        y: player.y + (player.height / 4),
                        width: bulletWidth,
                        height: bulletHeight,
                        speedX: speedX,
                        speedY: speedY
                    });
                }, laserFireRate);
            } else {
                clearInterval(shootingInterval);
                shootingInterval = null;
                laserActive = false; // Stop firing
            }
            break;
        case 'shotgun':
            for (let i = -2; i <= 2; i++) {
                player.bullets.push({
                    x: player.x + player.width,
                    y: player.y + (player.height / 4),
                    width: bulletWidth,
                    height: bulletHeight,
                    speedX: (bulletSpeed + i) * Math.cos(angle),
                    speedY: (bulletSpeed + i) * Math.sin(angle)
                });
            }
            break;
    }
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    crosshair.x = event.clientX - rect.left;
    crosshair.y = event.clientY - rect.top;
});

canvas.addEventListener('click', shoot);

document.querySelectorAll('.weaponIndicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
        player.weapon = indicator.id;
        document.querySelectorAll('.weaponIndicator').forEach(i => i.classList.remove('selected'));
        indicator.classList.add('selected');
        if (player.weapon !== 'laser') {
            clearInterval(shootingInterval);
            shootingInterval = null;
            laserActive = false; // Reset laser state when switching weapons
        }
    });
});

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

// High score handling
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function updateHighScore() {
    const currentScore = defeatedCount;
    const highScore = getCookie('highScore') || 0;
    if (currentScore > highScore) {
        setCookie('highScore', currentScore, 30); // Save high score for 30 days
        document.getElementById('highScoreDisplay').innerText = `High Score: ${currentScore}`;
    }
}

// Load high score on page load
window.onload = () => {
    const highScore = getCookie('highScore') || 0;
    document.getElementById('highScoreDisplay').innerText = `High Score: ${highScore}`;
};