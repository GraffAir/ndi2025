(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const btnPause = document.getElementById("btnPause");
  const btnRestart = document.getElementById("btnRestart");

  const snakeHeadimg = new Image();
  snakeHeadimg.src = "../img/snake_head.png";
  const snakeBodyimg = new Image();
  snakeBodyimg.src = "../img/cardBoardBox.png";

  const tileCount = 20; // grille 20x20
  const tileSize = canvas.width / tileCount;

  let snake = [{ x: 9, y: 9 }];
  let dir = { x: 0, y: 0 };
  let nextDir = { x: 0, y: 0 };
  let apple = { x: 5, y: 5 };
  let score = 0;
  let running = true;
  let speed = 15;
  let frameId = null;
  let lastTime = 0;

  function placeApple() {
    while (true) {
      const x = Math.floor(Math.random() * tileCount);
      const y = Math.floor(Math.random() * tileCount);
      if (!snake.some((s) => s.x === x && s.y === y)) {
        apple = { x, y };
        return;
      }
    }
  }

  function reset() {
    snake = [{ x: 9, y: 9 }];
    dir = { x: 0, y: 0 };
    nextDir = { x: 0, y: 0 };
    score = 0;
    speed = 8;
    placeApple();
    running = true;
    scoreEl.textContent = `: ${score}`;
  }

  function draw() {
    drawBase();
    drawSnake();
    drawApple();
  }

  function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
      const segment = snake[i];
      const img = i === 0 ? snakeHeadimg : snakeBodyimg;
      ctx.drawImage(
        img,
        segment.x * tileSize,
        segment.y * tileSize,
        tileSize,
        tileSize
      );
    }
  }

  function drawApple() {
    ctx.fillStyle = "#b81010ff";
    ctx.fillRect(apple.x * tileSize, apple.y * tileSize, tileSize, tileSize);
  }

  function drawBase() {
    let change = true;
    for (let i = 0; i < canvas.width; i++) {
      for (let j = 0; j < canvas.height; j++) {
        if (change) {
          ctx.fillStyle = "rgba(51, 102, 17, 1)";
        } else {
          ctx.fillStyle = "#245e05ff";
        }
        ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
        if (j === canvas.height - 1) {
          change = change;
        } else {
          change = !change;
        }
      }
    }
  }

  function update() {
    if (
      nextDir.x === -dir.x &&
      nextDir.y === -dir.y &&
      (dir.x !== 0 || dir.y !== 0)
    ) {
    } else {
      dir = { ...nextDir };
    }

    if (dir.x === 0 && dir.y === 0) return;

    const head = {
      x: (snake[0].x + dir.x + tileCount) % tileCount,
      y: (snake[0].y + dir.y + tileCount) % tileCount,
    };

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      running = false;
      showGameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === apple.x && head.y === apple.y) {
      score += 1;
      scoreEl.textContent = `Score: ${score}`;
      if (score % 3 === 0) speed = Math.min(18, speed + 1);
      placeApple();
    } else {
      snake.pop();
    }
  }

  function showGameOver() {
    setTimeout(() => {
      if (confirm(`Game over — score: ${score}. Recommencer ?`)) {
        reset();
      }
    }, 10);
  }

  function gameLoop(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    const interval = 1000 / speed;
    if (delta > interval) {
      lastTime = ts;
      if (running) update();
    }
    draw();
    frameId = requestAnimationFrame(gameLoop);
  }

  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (key === "ArrowUp") nextDir = { x: 0, y: -1 };
    if (key === "ArrowDown") nextDir = { x: 0, y: 1 };
    if (key === "ArrowLeft") nextDir = { x: -1, y: 0 };
    if (key === "ArrowRight") nextDir = { x: 1, y: 0 };
    if (key === "r") {
      reset();
    }
    if (key === " ") {
      togglePause();
      e.preventDefault();
    }
  });

  btnPause.addEventListener("click", togglePause);
  btnRestart.addEventListener("click", () => {
    reset();
  });
  function togglePause() {
    running = !running;
    btnPause.textContent = running ? "Pause" : "Reprendre";
  }

  reset();

  canvas.focus();
  frameId = requestAnimationFrame(gameLoop);
})();
