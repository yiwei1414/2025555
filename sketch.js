let stopSheet, walkSheet, jumpSheet, attackSheet, crazySheet;
let all2Image, all3Image, all4Image;

let gameState = "START"; 
let clouds = [];
let feedbackText = ""; // 用於顯示「正確」或「錯誤」

// 動畫與物理參數
let stopFrameWidth = 355 / 6, stopFrameHeight = 87;
let walkFrameWidth = 619 / 6, walkFrameHeight = 88;
let jumpFrameWidth = 289 / 6, jumpFrameHeight = 101;
let attackFrameWidth = 994 / 9, attackFrameHeight = 87;
let characterX, characterY, groundY;
let currentFrame = 0, animationSpeed = 5;
let isMoving = false, isJumping = false, isAttacking = false;
let moveDirection = 1, moveSpeed = 5;
let jumpStartFrame = 0, jumpHeight = 150;
let attackStartFrame = 0, attackFrameCount = 9;

// NPC 參數
let all2X, all2Y, all3X, all3Y, all4X, all4Y;
let npcW = 120, npcH = 120;
let npcFrameCount = 9, npcAnimSpeed = 8, proximityThreshold = 100;
let currentActiveNPC = null; 
let score = 0;
let totalQuestions = 4;
let hintText = "我是提示精靈，有問題可以點我！";

// 題目資料庫
let all2Data = { completed: false, answers: [null, null], quizzes: [{q: 'TKU 問題1: 淡江的大學標誌是什麼？', choices: ['鐘塔','海豚'], correctIndex: 1, hint: '這是一種海洋生物。'}, {q: 'TKU 問題2: 蛋捲廣場在哪個校區？', choices: ['淡水','台北'], correctIndex: 0, hint: '就在淡水主校區。'}] };
let all3Data = { completed: false, answers: [null, null], quizzes: [{q: 'TKU 問題3: 五虎崗指的是哪裡？', choices: ['淡江','清華'], correctIndex: 0, hint: '這是淡大校友的共同回憶。'}, {q: 'TKU 問題4: 覺生紀念圖書館有幾層？', choices: ['9層','11層'], correctIndex: 0, hint: '雖然它很高，但不到10層以上。'}] };
let projectiles = [];

function preload() {
  stopSheet = loadImage('1/stop/stop_all.png');
  walkSheet = loadImage('1/walk/walk_all.png');
  jumpSheet = loadImage('1/jump/jump_all.png');
  attackSheet = loadImage('1/attack/attack_all.png');
  crazySheet = loadImage('1/crazy/crazy_all.png');
  all2Image = loadImage('2/all2.png');
  all3Image = loadImage('3/all3.png');
  all4Image = loadImage('4/all4.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  characterX = windowWidth / 2;
  characterY = windowHeight * 0.8;
  groundY = characterY;
  for (let i = 0; i < 6; i++) {
    clouds.push({ x: random(width), y: random(height * 0.4), s: random(1, 3) });
  }
  updateLayout();
}

function updateLayout() {
  all2X = width * 0.25; all2Y = groundY - 50;
  all3X = width * 0.75; all3Y = groundY - 50;
  all4X = width - 100; all4Y = 100;
}

function draw() {
  if (gameState === "START") drawStartScreen();
  else if (gameState === "INFO") drawInfoScreen();
  else if (gameState === "PLAY") {
    drawGameContent();
    if (all2Data.completed && all3Data.completed) {
      setTimeout(() => { gameState = "FINISH"; }, 1500);
    }
  } else if (gameState === "FINISH") drawFinishScreen();
}

function drawClouds(skyColor) {
  background(skyColor);
  noStroke(); fill(255, 255, 255, 180);
  for (let c of clouds) {
    ellipse(c.x, c.y, 60, 40); ellipse(c.x + 20, c.y + 10, 50, 30); ellipse(c.x - 20, c.y + 10, 50, 30);
    c.x += c.s * 0.5; if (c.x > width + 50) c.x = -50;
  }
}

function drawStartScreen() {
  drawClouds(color(100, 150, 255));
  textAlign(CENTER, CENTER); fill(255); textSize(80); textStyle(BOLD);
  text("淡江知識王", width / 2, height * 0.4); textStyle(NORMAL);
  drawButton(width / 2, height * 0.65, 240, 70, "開始遊戲");
}

function drawInfoScreen() {
  drawClouds(color(50, 80, 150));
  rectMode(CENTER); fill(0, 0, 0, 180); rect(width/2, height/2, width * 0.8, height * 0.7, 20);
  textAlign(CENTER, CENTER); fill(255, 204, 0); textSize(40);
  text("遊戲說明 & 操作方式", width / 2, height * 0.25);
  fill(255); textSize(22);
  let content = "【遊戲目標】\n尋找街道上的同學，回答淡江小知識來獲得分數！\n\n【移動】 ← → 方向鍵\n【跳躍】 ↑ 向上鍵\n【攻擊】 Space 空白鍵\n【互動】 滑鼠點擊回答，點右上精靈看提示";
  text(content, width / 2, height * 0.5, width * 0.7, height * 0.4);
  drawButton(width / 2, height * 0.8, 200, 60, "進入校園");
}

function drawUI() {
  rectMode(CORNER); fill(0, 150); rect(10, 10, 120, 40, 5);
  fill(255); textSize(20); textAlign(LEFT, CENTER); text('總分: ' + score, 25, 30);

  let activeData = (currentActiveNPC === 'all2' ? all2Data : (currentActiveNPC === 'all3' ? all3Data : null));
  if (activeData && !activeData.completed) {
    rectMode(CENTER); fill(0, 0, 0, 230); rect(width / 2, height / 2, width * 0.6, height * 0.6, 15);
    
    let qIdx = activeData.answers.findIndex(a => a === null);
    if (qIdx === -1) qIdx = 0; 
    let q = activeData.quizzes[qIdx];

    fill(255); textAlign(CENTER, CENTER); textSize(24);
    text("目前挑戰：" + q.q, width / 2, height * 0.35, width * 0.5);
    
    // 如果有回饋文字就顯示回饋，否則顯示按鈕
    if (feedbackText !== "") {
      textSize(32);
      fill(feedbackText === "正確！" ? [0, 255, 0] : [255, 100, 100]);
      text(feedbackText, width / 2, height * 0.6);
    } else {
      for (let j = 0; j < q.choices.length; j++) {
        let bx = width / 2 + (j === 0 ? -110 : 110);
        let by = height * 0.6;
        drawAnswerButton(bx, by, 160, 50, q.choices[j]);
      }
    }
    rectMode(CORNER);
  }
}

function drawAnswerButton(x, y, w, h, label) {
  rectMode(CENTER);
  fill(100);
  if (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
    fill(150); cursor(HAND);
  }
  rect(x, y, w, h, 10);
  fill(255); textAlign(CENTER, CENTER); textSize(20); text(label, x, y);
}

function drawButton(x, y, w, h, label) {
  rectMode(CENTER);
  if (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
    fill(255, 100, 100); cursor(HAND);
  } else { fill(200, 50, 50); cursor(ARROW); }
  rect(x, y, w, h, 10);
  fill(255); textAlign(CENTER, CENTER); textSize(24); text(label, x, y);
}

function drawFinishScreen() {
  drawClouds(color(20, 100, 50));
  textAlign(CENTER, CENTER); fill(255, 204, 0); textSize(60);
  text("恭喜過關！", width / 2, height * 0.4);
  fill(255); textSize(30); text("最終得分：" + score + " / " + totalQuestions, width / 2, height * 0.55);
  drawButton(width / 2, height * 0.75, 200, 60, "再玩一次");
}

function drawGameContent() {
  drawClouds(color(100, 150, 255));
  fill(60); noStroke(); rect(0, height * 0.8, width, height * 0.2);
  stroke(255, 255, 0); strokeWeight(5);
  for(let i=0; i<width; i+=80) line(i, height*0.9, i+40, height*0.9);
  noStroke();
  drawNPC(all2Image, all2X, all2Y, all2Data, 'all2');
  drawNPC(all3Image, all3X, all3Y, all3Data, 'all3');
  drawHintElf();
  handleCharacter(); drawCharacter(); drawProjectiles(); drawUI();
}

function mousePressed() {
  if (gameState === "START") {
    if (dist(mouseX, mouseY, width/2, height*0.65) < 100) gameState = "INFO";
  } else if (gameState === "INFO") {
    if (dist(mouseX, mouseY, width/2, height*0.8) < 80) gameState = "PLAY";
  } else if (gameState === "FINISH") {
    if (dist(mouseX, mouseY, width/2, height*0.75) < 80) resetGame();
  } else if (gameState === "PLAY") {
    // 點擊精靈給提示
    if (dist(mouseX, mouseY, all4X, all4Y) < 60) {
      let activeData = (currentActiveNPC === 'all2' ? all2Data : (currentActiveNPC === 'all3' ? all3Data : null));
      if (activeData) {
        let qIdx = activeData.answers.findIndex(a => a === null);
        if (qIdx !== -1) hintText = "提示：" + activeData.quizzes[qIdx].hint;
      } else {
        hintText = "先靠近同學，我就能給你提示喔！";
      }
      return;
    }
    
    // 答題點擊與回饋
    let activeData = (currentActiveNPC === 'all2' ? all2Data : (currentActiveNPC === 'all3' ? all3Data : null));
    if (activeData && feedbackText === "") {
      let qIdx = activeData.answers.findIndex(a => a === null);
      if (qIdx !== -1) {
        let q = activeData.quizzes[qIdx];
        for (let j = 0; j < q.choices.length; j++) {
          let bx = width / 2 + (j === 0 ? -110 : 110);
          let by = height * 0.6;
          if (mouseX > bx - 80 && mouseX < bx + 80 && mouseY > by - 25 && mouseY < by + 25) {
            if (j === q.correctIndex) {
              score++;
              feedbackText = "正確！";
            } else {
              feedbackText = "可惜錯了！正確是：" + q.choices[q.correctIndex];
            }
            // 延遲 1 秒後進入下一步
            setTimeout(() => {
              activeData.answers[qIdx] = j;
              feedbackText = "";
              if (activeData.answers.every(a => a !== null)) {
                activeData.completed = true;
                currentActiveNPC = null;
                hintText = "真棒！去挑戰下一位吧！";
              }
            }, 1200);
          }
        }
      }
    }
  }
}

// 物理、渲染與 NPC (保持與前次相同)
function handleCharacter() {
  if (isAttacking) {
    currentFrame = floor((frameCount - attackStartFrame) / animationSpeed);
    if (currentFrame >= attackFrameCount) { isAttacking = false; spawnProjectile(); }
  } else if (isJumping) {
    currentFrame = floor((frameCount - jumpStartFrame) / animationSpeed);
    if (currentFrame < 3) characterY = groundY - (jumpHeight * (currentFrame / 3));
    else if (currentFrame < 6) characterY = groundY - (jumpHeight * (1 - (currentFrame - 3) / 3));
    else { characterY = groundY; isJumping = false; }
  } else { currentFrame = floor((frameCount / animationSpeed) % 6); }
  if (isMoving && !isAttacking) characterX += moveSpeed * moveDirection;
  characterX = constrain(characterX, 50, width - 50);
}

function drawCharacter() {
  let sheet, fw, fh;
  if (isAttacking) { sheet = attackSheet; fw = attackFrameWidth; fh = attackFrameHeight; }
  else if (isJumping) { sheet = jumpSheet; fw = jumpFrameWidth; fh = jumpFrameHeight; }
  else if (isMoving) { sheet = walkSheet; fw = walkFrameWidth; fh = walkFrameHeight; }
  else { sheet = stopSheet; fw = stopFrameWidth; fh = stopFrameHeight; }
  push(); translate(characterX, characterY - fh/2); if (moveDirection === -1) scale(-1, 1);
  image(sheet, -fw/2, -fh/2, fw, fh, currentFrame * fw, 0, fw, fh); pop();
}

function spawnProjectile() { projectiles.push({ x: characterX, y: characterY - 30, dir: moveDirection, startFrame: frameCount }); }

function drawProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i]; p.x += 8 * p.dir;
    let pf = floor((frameCount - p.startFrame) / 6) % 4;
    push(); translate(p.x, p.y); if (p.dir === -1) scale(-1, 1);
    image(crazySheet, -30, -30, 60, 60, pf * (503/4), 0, 503/4, 229); pop();
    if (p.x < 0 || p.x > width) projectiles.splice(i, 1);
  }
}

function drawNPC(img, x, y, data, id) {
  let frameW = img.width / npcFrameCount, currentF = floor((frameCount / npcAnimSpeed) % npcFrameCount);
  push(); imageMode(CENTER);
  image(img, x, y, npcW, npcH, currentF * frameW, 0, frameW, img.height);
  let d = dist(characterX, characterY, x, y);
  if (!data.completed && d < proximityThreshold) { currentActiveNPC = id; }
  pop();
}

function drawHintElf() {
  if (!all4Image) return;
  let currentF = floor((frameCount / 10) % 9), frameW = all4Image.width / 9;
  push(); imageMode(CENTER);
  let floatingY = all4Y + sin(frameCount * 0.05) * 10;
  image(all4Image, all4X, floatingY, 80, 80, currentF * frameW, 0, frameW, all4Image.height);
  fill(255, 240, 200, 230); rect(all4X, floatingY + 60, 240, 30, 10);
  fill(50); textAlign(CENTER, CENTER); textSize(14); text(hintText, all4X, floatingY + 60); pop();
}

function resetGame() {
  score = 0; feedbackText = "";
  all2Data.completed = false; all2Data.answers = [null, null];
  all3Data.completed = false; all3Data.answers = [null, null];
  gameState = "START"; characterX = width / 2;
}

function keyPressed() {
  if (gameState !== "PLAY") return;
  if (keyCode === RIGHT_ARROW) { isMoving = true; moveDirection = 1; }
  else if (keyCode === LEFT_ARROW) { isMoving = true; moveDirection = -1; }
  else if (keyCode === UP_ARROW && !isJumping) { isJumping = true; jumpStartFrame = frameCount; }
  else if (keyCode === 32 && !isAttacking) { isAttacking = true; attackStartFrame = frameCount; }
}

function keyReleased() { if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) isMoving = false; }

function windowResized() { resizeCanvas(windowWidth, windowHeight); updateLayout(); }