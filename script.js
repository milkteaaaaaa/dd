document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const brushSize = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const clearButton = document.getElementById('clearCanvas');
    const weaponizeButton = document.getElementById('weaponize');
    const scoreElement = document.getElementById('score');
    const healthElement = document.getElementById('health');

    // 設置畫布大小
    canvas.width = 800;
    canvas.height = 600;

    // 遊戲狀態
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = colorPicker.value;
    let score = 0;
    let health = 100;
    let weapons = [];
    let monsters = [];
    let isGameActive = true;

    // 更新筆刷大小顯示
    brushSize.addEventListener('input', () => {
        brushSizeValue.textContent = `${brushSize.value}px`;
    });

    // 繪圖相關事件監聽
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // 清除畫布
    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // 更新顏色
    colorPicker.addEventListener('input', () => {
        currentColor = colorPicker.value;
    });

    // 將繪製的圖形轉換為武器
    weaponizeButton.addEventListener('click', () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bounds = getDrawingBounds(imageData);
        
        if (bounds) {
            // 從原始繪圖中提取實際繪製的部分
            const weaponData = ctx.getImageData(
                bounds.minX,
                bounds.minY,
                bounds.maxX - bounds.minX,
                bounds.maxY - bounds.minY
            );

            const weapon = {
                imageData: weaponData,
                x: canvas.width / 2 - (bounds.maxX - bounds.minX) / 2,
                y: canvas.height - 100,
                width: bounds.maxX - bounds.minX,
                height: bounds.maxY - bounds.minY,
                active: true
            };
            weapons.push(weapon);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    // 添加獲取繪圖邊界的函數
    function getDrawingBounds(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let found = false;

        // 遍歷每個像素
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                // 檢查像素是否不透明
                if (data[index + 3] > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + 1);
                    maxY = Math.max(maxY, y + 1);
                    found = true;
                }
            }
        }

        if (!found) {
            return null;
        }

        return { minX, minY, maxX, maxY };
    }

    class Monster {
        constructor() {
            this.width = 40;
            this.height = 40;
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height;
            this.speed = 2;
            this.health = 100;
        }

        draw() {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // 畫生命值條
            ctx.fillStyle = '#00ff00';
            const healthWidth = (this.width * this.health) / 100;
            ctx.fillRect(this.x, this.y - 10, healthWidth, 5);
        }

        update() {
            this.y += this.speed;
            return this.y > canvas.height;
        }
    }

    // 每隔一段時間生成新的怪物
    setInterval(() => {
        if (isGameActive && monsters.length < 5) {
            monsters.push(new Monster());
        }
    }, 2000);

    function checkCollisions() {
        for (let i = weapons.length - 1; i >= 0; i--) {
            const weapon = weapons[i];
            for (let j = monsters.length - 1; j >= 0; j--) {
                const monster = monsters[j];
                if (isColliding(weapon, monster)) {
                    monster.health -= 20;
                    if (monster.health <= 0) {
                        monsters.splice(j, 1);
                        score += 10;
                        scoreElement.textContent = score;
                    }
                }
            }
        }

        // 檢查怪物是否到達底部
        for (let i = monsters.length - 1; i >= 0; i--) {
            if (monsters[i].y + monsters[i].height >= canvas.height) {
                monsters.splice(i, 1);
                health -= 10;
                healthElement.textContent = health;
                if (health <= 0) {
                    gameOver();
                }
            }
        }
    }

    function isColliding(weapon, monster) {
        return weapon.x < monster.x + monster.width &&
               weapon.x + weapon.width > monster.x &&
               weapon.y < monster.y + monster.height &&
               weapon.y + weapon.height > monster.y;
    }

    function gameOver() {
        isGameActive = false;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('遊戲結束!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`最終分數: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }

    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function draw(e) {
        if (!isDrawing) return;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.stroke();

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // 遊戲主循環
    function gameLoop() {
        if (!isGameActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 更新並繪製所有怪物
        monsters.forEach((monster, index) => {
            if (monster.update()) {
                monsters.splice(index, 1);
            } else {
                monster.draw();
            }
        });

        // 繪製和更新所有武器
        weapons = weapons.filter(weapon => {
            if (weapon.active) {
                ctx.putImageData(
                    weapon.imageData,
                    weapon.x,
                    weapon.y
                );
                weapon.y -= 5; // 武器向上移動
                return weapon.y > -weapon.height;
            }
            return false;
        });

        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});