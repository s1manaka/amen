const titleScreen = document.getElementById("title-screen");
const gameScreen = document.getElementById("game-screen");
const playButton = document.getElementById("play-button");
const finalScore = document.getElementById("final-score");
const retryButton = document.getElementById("retry-button");
const titleButton = document.getElementById("title-button");
const gameOverScreen = document.getElementById("game-over-screen");
const canvas = document.getElementById("game-canvas");
const scoreDisplay = document.getElementById("score");
const ctx = canvas.getContext("2d");

// アセットの読み込み
const assets = {
    ground: "zimen.png",
    background: "haikeigame.png",
    character: ["reizi.png", "reizi2.png"],
    obstacle: "amen.png",
    rareObstacles: {
        mannenhitu: "mannenhitu.png",
        papa: "papa.png",
        haruki: "haruki.png"
    }
};

let images = {};
function preloadAssets() {
    let loadedImagesCount = 0;
    const totalImages = Object.keys(assets).length + Object.keys(assets.rareObstacles).length;

    for (const key in assets) {
        if (typeof assets[key] === "object") {
            images[key] = {};
            for (const subKey in assets[key]) {
                images[key][subKey] = new Image();
                images[key][subKey].src = assets[key][subKey];
                images[key][subKey].onload = () => {
                    loadedImagesCount++;
                    checkAllImagesLoaded();
                };
                images[key][subKey].onerror = () => {
                    console.error(subKey + ' failed to load');
                };
            }
        } else {
            images[key] = new Image();
            images[key].src = assets[key];
            images[key].onload = () => {
                loadedImagesCount++;
                checkAllImagesLoaded();
            };
            images[key].onerror = () => {
                console.error(key + ' failed to load');
            };
        }
    }

    function checkAllImagesLoaded() {
        if (loadedImagesCount === totalImages) {
            console.log('All images loaded successfully!');
        }
    }
}
preloadAssets();

let isGameOver = false;
let gameInterval;
let score = 0;
let scoreCounter = 0;
let obstacleTimer = 0;
let obstacleInterval = Math.random() * 100 + 100;
let gravity = 0.8;
let jumpPower = -16; // ジャンプ力を調整
let speed = 10; // スピードを調整
let groundSpeed = speed * 0.8;
let obstacles = [];
let groundX = 0;
let backgroundX = 0;

const characterSize = { width: 90, height: 110 }; // キャラクターのサイズを小さくする
const obstacleSize = { width: 75, height: 75 }; // 障害物のサイズを小さくする

class Character {
    constructor() {
        this.x = 50; // キャラクターの位置を左に移動
        this.y = canvas.height - characterSize.height - 50;
        this.width = characterSize.width;
        this.height = characterSize.height;
        this.frame = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.doubleJump = false;
    }

    draw() {
        const img = images.character[this.frame % 2];
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }

    update() {
        if (scoreCounter % 30 === 0) this.frame++;
        this.y += this.velocityY;
        this.velocityY += gravity;

        if (this.y >= canvas.height - this.height - 50) {
            this.y = canvas.height - this.height - 50;
            this.velocityY = 0;
            this.isJumping = false;
            this.doubleJump = false;
        }
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = jumpPower;
            this.isJumping = true;
        } else if (!this.doubleJump) {
            this.velocityY = jumpPower;
            this.doubleJump = true;
        }
    }
}

const character = new Character();

function drawGround() {
    const img = images.ground;
    groundX -= groundSpeed;
    if (groundX <= -canvas.width) groundX = 0;
    ctx.drawImage(img, groundX, canvas.height - 50, canvas.width, 50);
    ctx.drawImage(img, groundX + canvas.width, canvas.height - 50, canvas.width, 50);
}

function drawBackground() {
    const img = images.background;
    backgroundX -= Math.floor(speed / 6);
    if (backgroundX <= -canvas.width) backgroundX = 0;
    ctx.drawImage(img, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(img, backgroundX + canvas.width, 0, canvas.width, canvas.height);
}

function handleObstacles() {
    obstacleTimer++;
    speed = 10 + Math.floor(score / 40);

    if (obstacleTimer >= obstacleInterval) {
        const yPosition = Math.random() * (canvas.height - obstacleSize.height);
        let type = "normal";

        if (Math.random() < 0.0005) {
            type = "haruki";
        }

        obstacles.push({ x: canvas.width, y: yPosition, type });
        obstacleTimer = 0;
        obstacleInterval = Math.random() * 60 + 65;
    }

    if (score % 403 === 0 && score > 0 && !obstacles.some(obs => obs.type === "mannenhitu")) {
        const yPosition = Math.random() * (canvas.height - obstacleSize.height);
        obstacles.push({ x: canvas.width, y: yPosition, type: "mannenhitu" });
    }
    if (score % 700 === 0 && score > 0 && !obstacles.some(obs.type === "papa")) {
        const yPosition = Math.random() * (canvas.height - obstacleSize.height);
        obstacles.push({ x: canvas.width, y: yPosition, type: "papa" });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        let img;
        let width = obstacleSize.width;
        let height = obstacleSize.height;

        if (obs.type === "normal") {
            img = images.obstacle;
        } else if (images.rareObstacles && images.rareObstacles[obs.type]) {
            img = images.rareObstacles[obs.type];
        }

        if (!img) continue;

        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            const aspectRatio = img.naturalWidth / img.naturalHeight;

            if (obs.type === "mannenhitu") {
                height *= 0.4;
            }

            width = height * aspectRatio;

            ctx.drawImage(img, obs.x, obs.y, width, height);
        }

        obs.x -= speed;

        if (obs.x + width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width - 20, 50);
}

function checkCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];

        if (
            obs.x < character.x + character.width &&
            obs.x + obstacleSize.width > character.x &&
            obs.y < character.y + character.height &&
            obs.y + obstacleSize.height > character.y
        ) {
            endGame();
        }
    }
}

function initGame() {
    score = 0;
    scoreCounter = 0;
    obstacleTimer = 0;
    obstacles.length = 0;
    groundX = 0;
    backgroundX = 0;
    speed = 10;
    groundSpeed = speed * 0.8;
    character.y = canvas.height - characterSize.height - 50;
    character.velocityY = 0;
    character.isJumping = false;
    character.doubleJump = false;
    isGameOver = false;
}

function startGame() {
    titleScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    initGame();
    gameInterval = setInterval(updateGame, 1000 / 60);
}

function updateGame() {
    if (isGameOver) {
        drawGameOver();
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGround();
    character.update();
    character.draw();
    handleObstacles();
    checkCollision();

    scoreCounter++;
    if (scoreCounter >= 18) {
        score++;
        scoreCounter = 0;
    }

    drawScore();
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");

    const existingScore = gameOverScreen.querySelector(".score");
    if (existingScore) {
        existingScore.remove();
    }

    const gameOverText = gameOverScreen.querySelector(".game-over-text");
    if (gameOverText) {
        gameOverText.style.fontSize = "30px";
    }

    const scoreContainer = document.createElement("div");
    scoreContainer.style.textAlign = "center";

    const finalScore = document.createElement("p");
    finalScore.textContent = `Score: ${score}`;
    finalScore.style.fontSize = "20px";
    finalScore.style.marginBottom = "10px";
    finalScore.classList.add("score");

    scoreContainer.appendChild(finalScore);

    if (gameOverText) {
        gameOverScreen.insertBefore(scoreContainer, gameOverText.nextSibling);
    }
}

function adjustCanvasSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

adjustCanvasSize();
window.addEventListener("resize", adjustCanvasSize);
playButton.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") character.jump();
});
document.addEventListener("click", () => character.jump());

playButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);
titleButton.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    titleScreen.classList.remove("hidden");
});

