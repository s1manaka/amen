// 基本設定
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


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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



// assets オブジェクトで定義した画像を前もってロード
let images = {};
function preloadAssets() {
    let loadedImagesCount = 0; // ロードした画像の数をカウント
    const totalImages = Object.keys(assets).length;

    for (const key in assets) {
        if (typeof assets[key] === "object") {
            images[key] = {}; // keyごとにオブジェクトを作成
            for (const subKey in assets[key]) {
                images[key][subKey] = new Image();
                images[key][subKey].src = assets[key][subKey];

                // 画像が読み込まれたらカウントアップ
                images[key][subKey].onload = () => {
                    loadedImagesCount++;
                    checkAllImagesLoaded();
                };
                
                // 画像のロードエラー時
                images[key][subKey].onerror = () => {
                    console.error(subKey + ' failed to load');
                };
            }
        } else {
            images[key] = new Image();
            images[key].src = assets[key];

            // 画像が読み込まれたらカウントアップ
            images[key].onload = () => {
                loadedImagesCount++;
                checkAllImagesLoaded();
            };
            
            // 画像のロードエラー時
            images[key].onerror = () => {
                console.error(key + ' failed to load');
            };
        }
    }

    // すべての画像が読み込まれたかチェックする
    function checkAllImagesLoaded() {
        if (loadedImagesCount === totalImages) {
            console.log('All images loaded successfully!');
        }
    }
}preloadAssets();

// ゲーム状態
let isGameOver = false;
let gameOverImage = null;
let gameInterval;
let score = 0;
let scoreCounter = 0;
let obstacleTimer = 0;
let obstacleInterval = Math.random() * 100 + 100; // 障害物生成間隔ランダム化
let gravity = 0.8; // 重力
let jumpPower = -20; // ジャンプ力
let speed = 12; // 初期速度
let groundSpeed = speed * 0.8; // 床速度は障害物速度の80%
const obstacles = [];  // 変更: const から let に変更
const obstacleLanes = [canvas.height - 150, canvas.height - 220, canvas.height - 290]; // レーンの高さ
let groundX = 0;
let backgroundX = 0;

// サイズ設定
const characterSize = { width: 120, height: 150 };
const obstacleSize = { width: 100, height: 100 }; // すべての障害物をこのサイズに統一

// キャラクタークラス
class Character {
    constructor() {
        this.x = 100;
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
    if (scoreCounter % 30 === 0) this.frame++;  // 15から30に変更
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

// キャラクター生成
const character = new Character();

// 地面の描画
function drawGround() {
    const img = images.ground;
    groundX -= 15; // 床速度は障害物速度の80%
    if (groundX <= -canvas.width) groundX = 0;
    ctx.drawImage(img, groundX, canvas.height - 50, canvas.width, 50);
    ctx.drawImage(img, groundX + canvas.width, canvas.height - 50, canvas.width, 50);
}

// 背景の描画
function drawBackground() {
    const img = images.background;
    backgroundX -= Math.floor(speed / 6); // 背景速度調整
    if (backgroundX <= -canvas.width) backgroundX = 0;
    ctx.drawImage(img, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(img, backgroundX + canvas.width, 0, canvas.width, canvas.height);
}

// 障害物の描画と移動
function handleObstacles() {
    obstacleTimer++;

    // スコアに基づいて速度を増加させる（例：スコアが10点上がるごとに速度を1増加）
    speed = 12 + Math.floor(score / 40);  // スコアが10点増えるごとに速度を1増加


    // 通常の障害物を一定間隔で生成
    if (obstacleTimer >= obstacleInterval) {
        const yPosition = obstacleLanes[Math.floor(Math.random() * obstacleLanes.length)];
        let type = "normal"; // デフォルトは通常の障害物

        // 0.05%の確率で "haruki" に変更
        if (Math.random() < 0.0005) {
            type = "haruki";
        }

        obstacles.push({ x: canvas.width, y: yPosition, type });
        obstacleTimer = 0;
        obstacleInterval = Math.random() * 60 + 65; // 次の生成間隔をランダム化
    }
    // レア障害物の生成条件（ランダムなレーンで生成）
    if (score % 403 === 0 && score > 0 && !obstacles.some(obs => obs.type === "mannenhitu")) {
        const yPosition = obstacleLanes[Math.floor(Math.random() * obstacleLanes.length)];
        obstacles.push({ x: canvas.width, y: yPosition, type: "mannenhitu" });
    }
    if (score % 700 === 0 && score > 0 && !obstacles.some(obs => obs.type === "papa")) {
        const yPosition = obstacleLanes[Math.floor(Math.random() * obstacleLanes.length)];
        obstacles.push({ x: canvas.width, y: yPosition, type: "papa" });
    }

// 障害物の描画と移動
for (let i = obstacles.length - 1; i >= 0; i--) { // 逆ループで安全に削除処理
    const obs = obstacles[i];
    let img;
    let width = obstacleSize.width;  // 初期値として通常の幅を設定
    let height = obstacleSize.height; // 通常の高さ

    // 画像の種類によって適切な画像を設定
    if (obs.type === "normal") {
        img = images.obstacle; // 通常の障害物画像
    } else if (images.rareObstacles && images.rareObstacles[obs.type]) {
        img = images.rareObstacles[obs.type]; // レア障害物の画像
    }

    // imgが存在しない場合、描画をスキップ
    if (!img) continue;

    // 画像が正常に読み込まれている場合のみ描画
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const aspectRatio = img.naturalWidth / img.naturalHeight; // 画像の縦横比
        
        // 特定のレア障害物のサイズを調整
        if (obs.type === "mannenhitu") {
            height *= 0.4; // 高さを半分に
        }

        width = height * aspectRatio; // 幅も再計算

        // 描画処理
        ctx.drawImage(img, obs.x, obs.y, width, height);
    }

    // 障害物を左に移動
    obs.x -= speed;

    // 画面外に出た障害物を削除（全ての障害物に適用）
    if (obs.x + width < 0) {
        obstacles.splice(i, 1); // 削除
    }
}
}


function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "30px 'Press Start 2P'";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width - 20, 50);
}

// 衝突判定
function checkCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];

        // プレイヤーとの衝突判定
        if (
            obs.x < character.x + character.width &&
            obs.x + obstacleSize.width > character.x &&
            obs.y < character.y + character.height &&
            obs.y + obstacleSize.height > character.y
        ) {
            endGame(); // 衝突した場合はゲームオーバー
        }
    }
}
// ゲームの初期化
function initGame() {
    score = 0;
    scoreCounter = 0;
    obstacleTimer = 0;
    obstacles.length = 0;
    groundX = 0;
    backgroundX = 0;
    speed = 12; // 初期速度
    groundSpeed = speed * 0.8; // 初期床速度
    character.y = canvas.height - characterSize.height - 50;
    character.velocityY = 0;
    character.isJumping = false;
    character.doubleJump = false;
}

// ゲーム開始処理
function startGame() {
    titleScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    initGame();
    gameInterval = setInterval(updateGame, 1000 / 60);
}


// ゲーム更新処理
function updateGame() {
    if (isGameOver) {
        drawGameOver();
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 画面をクリア
    drawBackground(); // 背景描画
    drawGround(); // 地面描画
    character.update(); // プレイヤーの更新
    character.draw(); // プレイヤーの描画

    handleObstacles(); // 障害物の処理
    checkCollision(); // 衝突判定

    // スコア更新: 1秒ごとにスコアを増加
    scoreCounter++; // カウンタを増加
    if (scoreCounter >= 18) { // 60フレーム経過（1秒）
        score++; // スコアを加算
        scoreCounter = 0; // カウンタをリセット
    }

    drawScore(); // スコアを描画
}


// ゲーム終了処理
function endGame() {
    clearInterval(gameInterval); // ゲームの進行を停止
    gameScreen.classList.add("hidden"); // ゲーム画面を隠す
    gameOverScreen.classList.remove("hidden"); // ゲームオーバー画面を表示

   // ゲームオーバー画面の初期化（画像とスコアの削除）
    const existingImage = gameOverScreen.querySelector("img");
    if (existingImage) {
        existingImage.remove(); // 既存の画像を削除
    }

    // 既存のスコアがあれば削除
    const existingScore = gameOverScreen.querySelector(".score"); // スコアに特定のクラスを付けて選択
    if (existingScore) {
        existingScore.remove(); // 既存のスコアを削除
    }

    // ゲームオーバーのテキストの上にイラストを追加
    const gameOverImage = document.createElement("img");
    gameOverImage.src = "gameover.png"; // ゲームオーバー画像のパスを指定
    gameOverImage.alt = "Game Over"; // 画像の代替テキスト（アクセシビリティ対応）
    gameOverImage.style.display = "block"; // ブロック要素として表示（縦に並べる）
    gameOverImage.style.margin = "0 auto"; // 画像を中央揃えに

    // ゲームオーバー画面に画像を追加
    gameOverScreen.insertBefore(gameOverImage, gameOverScreen.firstChild);

    // ゲームオーバーのテキストのフォントサイズを変更
    const gameOverText = gameOverScreen.querySelector(".game-over-text");
    if (gameOverText) {
        gameOverText.style.fontSize = "30px"; // フォントサイズを変更
    }

    // ゲームオーバーのテキストの直下にスコアを表示するコンテナを作成
    const scoreContainer = document.createElement("div");
    scoreContainer.style.textAlign = "center"; // スコアを中央揃えに

    // ゲームオーバーのテキストの直下にスコアを配置
    const finalScore = document.createElement("p");
    finalScore.textContent = `Score: ${score}`;
    finalScore.style.fontSize = "20px";
    finalScore.style.marginBottom = "10px";
    finalScore.classList.add("score"); // スコアにクラスを追加して識別

    // スコアコンテナにfinalScoreを追加
    scoreContainer.appendChild(finalScore);

    // ゲームオーバーのテキストの直後にスコアコンテナを挿入
    if (gameOverText) {
        gameOverScreen.insertBefore(scoreContainer, gameOverText.nextSibling);
    }
}







// イベント設定
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
