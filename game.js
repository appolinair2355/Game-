// 🎮 JEU NEON RACER - Version Pro

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuration responsive
function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    const maxWidth = Math.min(400, window.innerWidth - 40);
    const maxHeight = window.innerHeight - 280;
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Recalculer position joueur si en jeu
    if (player.y > 0) {
        player.y = canvas.height - player.height - 30;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 🌟 État du jeu
const game = {
    state: 'start',
    score: 0,
    level: 1,
    pointsPerLevel: 1,
    carsPassed: 0,
    carsNeededForNextLevel: 5,
    baseSpeed: 4,
    currentSpeed: 4,
    frameCount: 0,
    combo: 0,
    lastPassTime: 0,
    roadOffset: 0
};

// 🏎️ Joueur
const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 90,
    lane: 1,
    targetX: 0,
    tilt: 0,
    trail: []
};

// Objets du jeu
let trafficCars = [];
let particles = [];
let roadLines = [];
let stars = [];

// Contrôles
let touchLeft = false, touchRight = false;
const keys = {};

// DOM Elements
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const pointsEl = document.getElementById('pointsPerLevel');
const carsPassedEl = document.getElementById('carsPassed');
const carsNeededEl = document.getElementById('carsNeeded');
const levelProgress = document.getElementById('levelProgress');
const levelBarFill = document.getElementById('levelBarFill');
const speedLines = document.getElementById('speedLines');

// Écrans
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const levelUpNotif = document.getElementById('levelUpNotif');
const notifLevel = document.getElementById('notifLevel');
const notifMult = document.getElementById('notifMult');
const comboDisplay = document.getElementById('comboDisplay');
const comboCount = document.getElementById('comboCount');

// Initialiser particules d'arrière-plan
function initBgParticles() {
    const container = document.getElementById('bgParticles');
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.animationDuration = (5 + Math.random() * 10) + 's';
        container.appendChild(p);
    }
}
initBgParticles();

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);

// Boutons tactiles
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const pauseBtn = document.getElementById('pauseBtn');

[leftBtn, rightBtn].forEach((btn, index) => {
    const isLeft = index === 0;
    
    const startHandler = (e) => {
        e.preventDefault();
        if (isLeft) touchLeft = true;
        else touchRight = true;
        btn.style.transform = 'scale(0.95)';
    };
    
    const endHandler = (e) => {
        e.preventDefault();
        if (isLeft) touchLeft = false;
        else touchRight = false;
        btn.style.transform = 'scale(1)';
    };
    
    btn.addEventListener('touchstart', startHandler);
    btn.addEventListener('touchend', endHandler);
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
});

pauseBtn.addEventListener('click', togglePause);

// Clavier
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'ArrowLeft') leftBtn.style.transform = 'scale(0.95)';
    if (e.key === 'ArrowRight') rightBtn.style.transform = 'scale(0.95)';
    
    if (e.code === 'Space' || e.code === 'Escape') {
        if (game.state === 'playing') togglePause();
        else if (game.state === 'paused') resumeGame();
    }
    if (e.key === 'Enter' && game.state === 'start') startGame();
    if (e.key === 'Enter' && game.state === 'gameover') resetGame();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'ArrowLeft') leftBtn.style.transform = 'scale(1)';
    if (e.key === 'ArrowRight') rightBtn.style.transform = 'scale(1)';
});

// 🎯 Fonctions principales

function startGame() {
    game.state = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initPlayer();
    initRoadLines();
    gameLoop();
}

function resetGame() {
    game.score = 0;
    game.level = 1;
    game.pointsPerLevel = 1;
    game.carsPassed = 0;
    game.carsNeededForNextLevel = 5;
    game.currentSpeed = game.baseSpeed;
    game.frameCount = 0;
    game.combo = 0;
    trafficCars = [];
    particles = [];
    stars = [];
    player.trail = [];
    
    updateHUD();
    startGame();
}

function togglePause() {
    if (game.state === 'playing') {
        game.state = 'paused';
        pauseScreen.classList.remove('hidden');
        speedLines.style.opacity = '0';
    }
}

function resumeGame() {
    if (game.state === 'paused') {
        game.state = 'playing';
        pauseScreen.classList.add('hidden');
        gameLoop();
    }
}

function gameOver() {
    game.state = 'gameover';
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('finalLevel').textContent = game.level;
    gameOverScreen.classList.remove('hidden');
    speedLines.style.opacity = '0';
    
    // Explosion massive
    createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0040', 50);
    createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff8800', 30);
}

function initPlayer() {
    player.lane = 1;
    player.x = (canvas.width / 2) - (player.width / 2);
    player.y = canvas.height - player.height - 30;
    player.targetX = player.x;
    player.tilt = 0;
}

function initRoadLines() {
    roadLines = [];
    for (let i = 0; i < 6; i++) {
        roadLines.push({
            y: i * (canvas.height / 5),
            speed: 0
        });
    }
}

function updateHUD() {
    scoreEl.textContent = game.score;
    levelEl.textContent = game.level;
    pointsEl.textContent = 'x' + game.pointsPerLevel;
    carsPassedEl.textContent = game.carsPassed;
    carsNeededEl.textContent = game.carsNeededForNextLevel;
    
    // Cercle de progression
    const circumference = 2 * Math.PI * 45;
    const progress = game.carsPassed / game.carsNeededForNextLevel;
    const offset = circumference - (progress * circumference);
    levelProgress.style.strokeDashoffset = offset;
    
    // Barre de progression
    levelBarFill.style.width = (progress * 100) + '%';
}

function showLevelUp() {
    notifLevel.textContent = game.level;
    notifMult.textContent = game.pointsPerLevel;
    levelUpNotif.classList.remove('hidden');
    levelUpNotif.classList.add('show');
    
    setTimeout(() => {
        levelUpNotif.classList.remove('show');
        setTimeout(() => levelUpNotif.classList.add('hidden'), 500);
    }, 2500);
}

function showCombo(combo) {
    if (combo < 2) return;
    
    comboCount.textContent = 'x' + combo;
    comboDisplay.classList.remove('hidden');
    comboDisplay.classList.add('show');
    
    setTimeout(() => {
        comboDisplay.classList.remove('show');
        setTimeout(() => comboDisplay.classList.add('hidden'), 300);
    }, 1500);
}

function levelUp() {
    game.level++;
    game.pointsPerLevel = game.level;
    game.carsNeededForNextLevel = 5 + (game.level * 3);
    game.carsPassed = 0;
    game.currentSpeed += 1.2;
    
    // Effets visuels
    showLevelUp();
    createExplosion(canvas.width/2, canvas.height/2, '#ffee00', 40);
    
    // Flash blanc
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;opacity:0.3;pointer-events:none;z-index:1000;transition:opacity 0.5s;';
    document.body.appendChild(flash);
    setTimeout(() => flash.style.opacity = '0', 50);
    setTimeout(() => flash.remove(), 550);
    
    updateHUD();
}

// 🎨 Dessin avancé

function drawNeonRect(x, y, w, h, color, glow = 10) {
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
}

function drawCarPro(x, y, w, h, color, isPlayer = false, tilt = 0) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(tilt * 0.1);
    ctx.translate(-w/2, -h/2);
    
    // Ombre portée
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(5, 5, w, h);
    
    // Corps principal avec dégradé
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, lightenColor(color, 40));
    grad.addColorStop(1, color);
    
    ctx.shadowBlur = isPlayer ? 20 : 10;
    ctx.shadowColor = color;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    // Lignes néon sur les côtés
    ctx.shadowBlur = 15;
    ctx.fillStyle = isPlayer ? '#00f3ff' : '#ff00ff';
    ctx.fillRect(2, 10, 3, h - 20);
    ctx.fillRect(w - 5, 10, 3, h - 20);
    
    // Pare-brise / Lunette
    ctx.shadowBlur = 5;
    ctx.fillStyle = isPlayer ? 'rgba(0, 243, 255, 0.6)' : 'rgba(255, 0, 255, 0.4)';
    ctx.fillRect(8, isPlayer ? h - 35 : 15, w - 16, 20);
    
    // Feux
    if (isPlayer) {
        // Feux arrière rouges
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0040';
        ctx.fillStyle = '#ff0040';
        ctx.fillRect(5, h - 8, 12, 6);
        ctx.fillRect(w - 17, h - 8, 12, 6);
        
        // Lumière de freinage si ralentissement
        if (keys['ArrowDown']) {
            ctx.fillStyle = 'rgba(255, 0, 64, 0.8)';
            ctx.fillRect(0, h - 5, w, 5);
        }
    } else {
        // Phares avant
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffee00';
        ctx.fillStyle = '#ffee00';
        ctx.fillRect(5, 2, 12, 6);
        ctx.fillRect(w - 17, 2, 12, 6);
        
        // Faisceau lumineux
        ctx.fillStyle = 'rgba(255, 238, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-10, -60);
        ctx.lineTo(25, -60);
        ctx.lineTo(20, 0);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(w - 5, 0);
        ctx.lineTo(w + 10, -60);
        ctx.lineTo(w - 25, -60);
        ctx.lineTo(w - 20, 0);
        ctx.fill();
    }
    
    // Roues
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-3, 15, 6, 18);
    ctx.fillRect(w - 3, 15, 6, 18);
    ctx.fillRect(-3, h - 33, 6, 18);
    ctx.fillRect(w - 3, h - 33, 6, 18);
    
    // Jantes
    ctx.fillStyle = '#444';
    ctx.fillRect(-2, 18, 4, 12);
    ctx.fillRect(w - 2, 18, 4, 12);
    ctx.fillRect(-2, h - 30, 4, 12);
    ctx.fillRect(w - 2, h - 30, 4, 12);
    
    ctx.restore();
}

function drawRoadPro() {
    // Fond dégradé route
    const roadGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    roadGrad.addColorStop(0, '#0a0a1a');
    roadGrad.addColorStop(0.5, '#1a1a3e');
    roadGrad.addColorStop(1, '#0f0f2d');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Lignes de voie animées
    const laneWidth = canvas.width / 3;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -game.roadOffset;
    
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(laneWidth * i, 0);
        ctx.lineTo(laneWidth * i, canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Ligne centrale brillante
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Bordures néon
    ctx.fillStyle = '#ff0040';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0040';
    ctx.fillRect(0, 0, 6, canvas.height);
    ctx.fillRect(canvas.width - 6, 0, 6, canvas.height);
    ctx.shadowBlur = 0;
    
    // Lumières latérales animées
    const lightOffset = (game.frameCount * 2) % 100;
    for (let i = -1; i < canvas.height / 100 + 1; i++) {
        const y = i * 100 + lightOffset;
        ctx.fillStyle = 'rgba(255, 0, 64, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0040';
        ctx.fillRect(2, y, 2, 40);
        ctx.fillRect(canvas.width - 4, y, 2, 40);
    }
    ctx.shadowBlur = 0;
}

function createTrafficCarPro() {
    const laneWidth = canvas.width / 3;
    const lane = Math.floor(Math.random() * 3);
    const colors = ['#9d00ff', '#ff00ff', '#00ff88', '#ff8800', '#0088ff', '#ff0088'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Vérifier si la voie est libre
    const tooClose = trafficCars.some(car => 
        car.lane === lane && car.y < 150
    );
    
    if (tooClose) return;
    
    trafficCars.push({
        x: (lane * laneWidth) + (laneWidth - 50) / 2,
        y: -120,
        width: 50,
        height: 90,
        color: color,
        speed: game.currentSpeed * (0.5 + Math.random() * 0.3),
        passed: false,
        lane: lane,
        tilt: (Math.random() - 0.5) * 0.2
    });
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 6;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2,
            type: 'explosion'
        });
    }
}

function createSparkle(x, y) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3,
        life: 0.5,
        color: '#ffee00',
        size: Math.random() * 3,
        type: 'sparkle'
    });
}

function createTrail(x, y) {
    player.trail.push({
        x: x,
        y: y,
        life: 1,
        size: Math.random() * 3 + 2
    });
}

function updateParticles() {
    // Particules d'explosion
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.98;
        
        if (p.type === 'explosion') {
            p.vy += 0.1; // Gravité
        }
        
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Trail du joueur
    for (let i = player.trail.length - 1; i >= 0; i--) {
        const t = player.trail[i];
        t.y += game.currentSpeed;
        t.life -= 0.05;
        if (t.life <= 0) player.trail.splice(i, 1);
    }
}

function drawParticles() {
    // Trail
    player.trail.forEach(t => {
        ctx.globalAlpha = t.life * 0.5;
        ctx.fillStyle = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Particules
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width - 8 &&
           rect1.x + rect1.width > rect2.x + 8 &&
           rect1.y < rect2.y + rect2.height - 15 &&
           rect1.y + rect1.height > rect2.y + 15;
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// 🎮 Game Loop

function update() {
    if (game.state !== 'playing') return;
    
    game.frameCount++;
    game.roadOffset += game.currentSpeed;
    
    // Animation lignes de vitesse
    speedLines.style.opacity = Math.min(0.6, (game.currentSpeed - 4) / 10);
    
    // Déplacement joueur fluide
    const laneWidth = canvas.width / 3;
    
    if ((keys['ArrowLeft'] || touchLeft) && player.lane > 0) {
        player.lane--;
        player.targetX = (player.lane * laneWidth) + (laneWidth - player.width) / 2;
        player.tilt = -1;
        keys['ArrowLeft'] = false;
        touchLeft = false;
        createSparkle(player.x + player.width, player.y + player.height);
    }
    if ((keys['ArrowRight'] || touchRight) && player.lane < 2) {
        player.lane++;
        player.targetX = (player.lane * laneWidth) + (laneWidth - player.width) / 2;
        player.tilt = 1;
        keys['ArrowRight'] = false;
        touchRight = false;
        createSparkle(player.x, player.y + player.height);
    }
    
    // Interpolation position X
    player.x += (player.targetX - player.x) * 0.2;
    player.tilt *= 0.9;
    
    // Trail
    if (game.frameCount % 3 === 0) {
        createTrail(player.x + player.width/2, player.y + player.height);
    }
    
    // Spawn voitures
    const spawnRate = Math.max(20, 60 - (game.level * 5));
    if (game.frameCount % spawnRate === 0) {
        createTrafficCarPro();
    }
    
    // Mise à jour voitures
    let passedThisFrame = 0;
    
    for (let i = trafficCars.length - 1; i >= 0; i--) {
        const car = trafficCars[i];
        car.y += car.speed;
        
        // Dépassement
        if (!car.passed && car.y > player.y + player.height) {
            car.passed = true;
            passedThisFrame++;
            
            // Système de combo
            const now = Date.now();
            if (now - game.lastPassTime < 2000) {
                game.combo++;
            } else {
                game.combo = 1;
            }
            game.lastPassTime = now;
            
            const points = game.pointsPerLevel * (game.combo > 1 ? Math.min(game.combo, 5) : 1);
            game.score += points;
            game.carsPassed++;
            
            showCombo(game.combo);
            
            // Effet visuel dépassement
            createSparkle(car.x + car.width/2, car.y);
            
            // Level up?
            if (game.carsPassed >= game.carsNeededForNextLevel) {
                levelUp();
            }
            
            updateHUD();
        }
        
        // Collision
        if (checkCollision(player, car)) {
            gameOver();
        }
        
        // Supprimer si hors écran
        if (car.y > canvas.height + 100) {
            trafficCars.splice(i, 1);
        }
    }
    
    updateParticles();
}

function draw() {
    drawRoadPro();
    
    // Voitures traffic
    trafficCars.forEach(car => {
        drawCarPro(car.x, car.y, car.width, car.height, car.color, false, car.tilt);
    });
    
    // Particules et trail
    drawParticles();
    
    // Joueur
    if (game.state !== 'gameover') {
        drawCarPro(player.x, player.y, player.width, player.height, '#e74c3c', true, player.tilt);
    }
}

function gameLoop() {
    if (game.state === 'playing') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else if (game.state === 'paused') {
        draw();
    }
}

// Initialisation
initPlayer();
updateHUD();
