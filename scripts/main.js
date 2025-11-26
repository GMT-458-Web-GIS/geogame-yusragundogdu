// --- DEĞİŞKEN TANIMLARI ---
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const startGameButton = document.getElementById('start-game-button');
const engineSound = document.getElementById('engine-sound'); 

// Geri Sayım Elementleri
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');

// Modal Elementleri
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButton = document.getElementById('modal-button');

// Oyun Değişkenleri
let gameMap;
let plane1, plane2; 
let planeSource, missionSource, routeSource, stormSource, waypointSource; 
let currentMission = null;

// Skorlar ve Durumlar
let scoreP1 = 0;
let scoreP2 = 0;
let lives = 3; 
let fuel = 100; 
let missionsCompleted = 0;
let isGameActive = false; 
let missionTimer; 
let playerCount = 1; 
let activeControlMethod = "mouse"; 
let waypoints = []; 
let isFlying = false; 
const keysPressed = {}; 

// Ses Ayarı
if(engineSound) engineSound.volume = 0.4; 

// --- HAVALİMANLARI ---
const airports = [
    { name: "Istanbul (IST)", coords: [28.8146, 40.9769] },
    { name: "New York (JFK)", coords: [-73.7781, 40.6413] },
    { name: "London (LHR)", coords: [-0.4543, 51.4700] },
    { name: "Tokyo (HND)", coords: [139.7798, 35.5494] },
    { name: "Dubai (DXB)", coords: [55.3644, 25.2532] },
    { name: "Sydney (SYD)", coords: [151.1753, -33.9461] },
    { name: "Moscow (SVO)", coords: [37.4146, 55.9726] },
    { name: "Cape Town (CPT)", coords: [18.6017, -33.9648] },
    { name: "Rio de Janeiro (GIG)", coords: [-43.2436, -22.8089] },
    { name: "Los Angeles (LAX)", coords: [-118.4085, 33.9416] }
];

// --- MODAL ---
function showModal(title, message, buttonText, actionType) {
    if(!customModal) return;
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalButton.innerText = buttonText;
    
    if (title.includes("OVER") || title.includes("FAILED")) {
        modalTitle.style.color = "#ff4444"; 
    } else {
        modalTitle.style.color = "#FFE773"; 
    }
    customModal.style.display = "flex";

    modalButton.onclick = function() {
        customModal.style.display = "none";
        if (actionType === "reload") {
            location.reload();
        } else if (actionType === "next") {
            generateMission();
        }
    };
}

// --- YENİ: GERİ SAYIM FONKSİYONU ---
function startCountdown(pCount, method) {
    // 1. Menüyü Gizle
    mainMenu.style.display = 'none';
    
    // 2. Geri Sayım Ekranını Göster
    countdownOverlay.style.display = 'flex';
    countdownText.innerText = "ARE YOU READY?";

    // Sesleri hazırla
    if(engineSound) {
        engineSound.volume = 0.4;
        engineSound.play().then(() => { engineSound.pause(); engineSound.currentTime = 0; }).catch(()=>{});
    }

    // Zamanlama Mantığı
    setTimeout(() => {
        let count = 3;
        countdownText.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.innerText = count;
            } else {
                clearInterval(interval);
                countdownText.innerText = "GO!";
                
                // "GO!" yazısını 1 saniye göster sonra oyunu başlat
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    gameContainer.style.display = 'flex';
                    // OYUNU BAŞLAT
                    initGameMap(pCount, method);
                }, 1000);
            }
        }, 1000); // Her 1 saniyede bir sayı düş
    }, 1500); // "Are you ready?" yazısı 1.5 saniye dursun
}

// --- 1. HARİTA BAŞLATMA ---
function initGameMap(pCount, method) {
    if (typeof ol === 'undefined') return;

    playerCount = parseInt(pCount);
    activeControlMethod = method; 

    planeSource = new ol.source.Vector();
    missionSource = new ol.source.Vector();
    routeSource = new ol.source.Vector();
    stormSource = new ol.source.Vector();
    waypointSource = new ol.source.Vector(); 

    const satelliteLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19
        })
    });
    
    satelliteLayer.on('postrender', function(event) {
        const context = event.context;
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalCompositeOperation = 'source-over';
    });

    const labelLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        })
    });

    const stormLayer = new ol.layer.Vector({
        source: stormSource,
        zIndex: 10,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(200, 0, 0, 0.4)' }), 
            stroke: new ol.style.Stroke({ color: '#ff0000', width: 2 }),
        })
    });

    const routeLayer = new ol.layer.Vector({ 
        source: routeSource,
        zIndex: 20,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: '#FFE773', width: 3, lineDash: [10, 10] })
        })
    });

    const waypointLayer = new ol.layer.Vector({
        source: waypointSource,
        zIndex: 30,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({ color: 'yellow' }),
                stroke: new ol.style.Stroke({ color: 'black', width: 1 })
            })
        })
    });

    const missionLayer = new ol.layer.Vector({ source: missionSource, zIndex: 100 });
    const planeLayer = new ol.layer.Vector({ source: planeSource, zIndex: 999 });

    gameMap = new ol.Map({
        target: 'map',
        layers: [satelliteLayer, labelLayer, stormLayer, routeLayer, waypointLayer, missionLayer, planeLayer],
        view: new ol.View({
            center: ol.proj.fromLonLat([35.0, 39.0]),
            zoom: 4
        }),
    });
    
    // Dashboard Ayarları
    const scoreSingle = document.getElementById('status-score');
    const scoreMulti = document.getElementById('multiplayer-scores');
    const missionText = document.getElementById('mission-info');
    const speedText = document.getElementById('status-speed');

    if (scoreSingle && scoreMulti) {
        if (playerCount === 2) {
            scoreSingle.style.display = 'none';
            scoreMulti.style.display = 'block';
            missionText.innerText = "RACE TO DESTINATION!";
            activeControlMethod = "wasd"; 
        } else {
            scoreMulti.style.display = 'none';
            scoreSingle.style.display = 'block';
            scoreSingle.innerText = "Score: 0"; 
            
            if (activeControlMethod === "mouse") {
                speedText.innerText = "Plan Route (Click Map)";
                gameMap.on('click', handleMapClick); 
            } else {
                speedText.innerText = "Mode: Manual Pilot";
            }
        }
    }

    window.addEventListener('keydown', (e) => keysPressed[e.key] = true);
    window.addEventListener('keyup', (e) => keysPressed[e.key] = false);

    requestAnimationFrame(gameLoop);

    setTimeout(() => {
        gameMap.updateSize();
        createPlanes();     
        generateMission();   
    }, 200);
}

// --- 2. UÇAKLARI OLUŞTURMA ---
function createPlanes() {
    const startCoords = ol.proj.fromLonLat(airports[0].coords); 

    plane1 = new ol.Feature({
        geometry: new ol.geom.Point(startCoords),
        name: 'plane1'
    });

    const p1StyleConfig = {
        anchor: [0.5, 0.5],
        src: 'assets/images/plane_icon.png',
        scale: 0.3,
        rotateWithView: true
    };

    if (playerCount === 2) {
        p1StyleConfig.color = '#0066FF'; 
    }

    plane1.setStyle(new ol.style.Style({
        image: new ol.style.Icon(p1StyleConfig)
    }));
    
    planeSource.addFeature(plane1);
    gameMap.getView().setCenter(startCoords);

    if (playerCount === 2) {
        const p2Start = [startCoords[0] + 100000, startCoords[1]]; 
        plane2 = new ol.Feature({
            geometry: new ol.geom.Point(p2Start),
            name: 'plane2'
        });
        
        plane2.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5],
                src: 'assets/images/plane_icon.png',
                scale: 0.3,
                color: '#FF3300', 
                rotateWithView: true
            })
        }));
        planeSource.addFeature(plane2);
    }
}

// --- 3. OYUN DÖNGÜSÜ ---
function gameLoop() {
    if (!plane1) {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!isGameActive && activeControlMethod !== "wasd") {
        requestAnimationFrame(gameLoop);
        return;
    }

    const speed = 40000; 

    if (activeControlMethod === "wasd" || playerCount === 2) {
        const coords1 = plane1.getGeometry().getCoordinates();
        let move1 = false;
        
        if (keysPressed['w'] || keysPressed['W']) { coords1[1] += speed; move1 = true; }
        if (keysPressed['s'] || keysPressed['S']) { coords1[1] -= speed; move1 = true; }
        if (keysPressed['a'] || keysPressed['A']) { coords1[0] -= speed; move1 = true; }
        if (keysPressed['d'] || keysPressed['D']) { coords1[0] += speed; move1 = true; }

        if (move1) {
            plane1.getGeometry().setCoordinates(coords1);
            checkCollision(coords1, 1);
            checkArrival(coords1, 1);
            
            if (engineSound && engineSound.paused) {
                engineSound.play().catch(e => console.log("Ses hatası:", e));
            }
        }
    }

    if (playerCount === 2) {
        const coords2 = plane2.getGeometry().getCoordinates();
        let move2 = false;
        if (keysPressed['ArrowUp']) { coords2[1] += speed; move2 = true; }
        if (keysPressed['ArrowDown']) { coords2[1] -= speed; move2 = true; }
        if (keysPressed['ArrowLeft']) { coords2[0] -= speed; move2 = true; }
        if (keysPressed['ArrowRight']) { coords2[0] += speed; move2 = true; }

        if (move2) {
            plane2.getGeometry().setCoordinates(coords2);
            checkCollision(coords2, 2);
            checkArrival(coords2, 2);
        }
    }
    
    if (playerCount === 2 && plane1 && plane2) {
        const c1 = plane1.getGeometry().getCoordinates();
        const c2 = plane2.getGeometry().getCoordinates();
        const midPoint = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2];
        gameMap.getView().setCenter(midPoint);
    } else if (activeControlMethod === "wasd") {
        gameMap.getView().setCenter(plane1.getGeometry().getCoordinates());
    }

    requestAnimationFrame(gameLoop);
}

// --- 4. MOUSE MODU ---
function handleMapClick(event) {
    if (!isGameActive || isFlying) return; 

    const clickedCoord = event.coordinate;
    const feature = gameMap.forEachFeatureAtPixel(event.pixel, function(feat) {
        return feat;
    }, { hitTolerance: 10 });
    
    if (feature && feature.get('name') === 'target') {
        startMouseFlight();
    } else {
        addWaypoint(clickedCoord);
    }
}

function addWaypoint(coord) {
    waypoints.push(coord); 
    const wpFeature = new ol.Feature({ geometry: new ol.geom.Point(coord) });
    waypointSource.addFeature(wpFeature);
    drawPreviewRoute();
    
    const cost = calculateRouteFuelCost();
    document.getElementById('status-fuel').innerText = `Est. Cost: ${cost}%`;
    if (cost > 100) document.getElementById('status-fuel').style.color = "red";
}

function drawPreviewRoute() {
    routeSource.clear();
    const startCoords = plane1.getGeometry().getCoordinates();
    const allPoints = [startCoords, ...waypoints];
    
    if (allPoints.length > 1) {
        const lineString = new ol.geom.LineString(allPoints);
        const routeFeat = new ol.Feature({ geometry: lineString });
        routeFeat.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({ color: 'white', width: 2, lineDash: [5, 5] })
        }));
        routeSource.addFeature(routeFeat);
    }
}

function startMouseFlight() {
    const estimatedCost = calculateRouteFuelCost();
    if (estimatedCost > 100) {
        showModal("WARNING", "Insufficient Fuel! Route is too long.", "REPLAN", false);
        waypoints = [];
        waypointSource.clear();
        routeSource.clear();
        return;
    }

    isFlying = true;
    if(engineSound) { engineSound.currentTime = 0; engineSound.play().catch(e => console.log(e)); }
    document.getElementById('status-speed').innerText = "Autopilot: ON";
    
    const startCoords = plane1.getGeometry().getCoordinates();
    const endCoords = ol.proj.fromLonLat(currentMission.coords);
    const flightPath = [startCoords, ...waypoints, endCoords];

    routeSource.clear();
    const lineString = new ol.geom.LineString(flightPath);
    routeSource.addFeature(new ol.Feature({ geometry: lineString }));

    const totalDuration = flightPath.length * 1000; 
    const startTime = Date.now();

    const animateFlight = () => {
        if (!isGameActive) return;

        const elapsed = Date.now() - startTime;
        const fraction = elapsed / totalDuration;

        if (fraction >= 1) {
            plane1.getGeometry().setCoordinates(endCoords);
            finishRound(1); 
            return;
        }

        const currentCoord = lineString.getCoordinateAt(fraction);
        plane1.getGeometry().setCoordinates(currentCoord);
        gameMap.getView().setCenter(currentCoord);

        const nextCoord = lineString.getCoordinateAt(fraction + 0.01);
        if (nextCoord) {
            const dx = nextCoord[0] - currentCoord[0];
            const dy = nextCoord[1] - currentCoord[1];
            const rotation = Math.atan2(dy, dx);
            plane1.getStyle().getImage().setRotation(-rotation + Math.PI / 2);
        }

        checkCollision(currentCoord, 1);
        requestAnimationFrame(animateFlight);
    };
    animateFlight();
}

// --- GÖREV YÖNETİMİ ---
function generateMission() {
    clearInterval(missionTimer);
    stopFlight(); 

    if (lives <= 0 || fuel <= 0) {
        let winnerMsg = "";
        if (playerCount === 2) {
            winnerMsg = scoreP1 > scoreP2 ? "Player 1 Wins!" : (scoreP2 > scoreP1 ? "Player 2 Wins!" : "Draw!");
        }
        showModal("GAME OVER", `Mission Aborted.\n${winnerMsg}`, "RESTART", "reload");
        return;
    }
    
    const WIN_MISSION_COUNT = 5;
    if (missionsCompleted >= WIN_MISSION_COUNT) {
        if(document.getElementById('victory-effect')) document.getElementById('victory-effect').style.display = 'flex';
        const coinSound = document.getElementById('coin-sound');
        if(coinSound) { coinSound.currentTime = 0; coinSound.play().catch(e => {}); }

        showModal("VICTORY!", `Completed ${WIN_MISSION_COUNT} Missions!\nFinal Score: ${scoreP1 + scoreP2}`, "PLAY AGAIN", "reload");
        return;
    }

    isGameActive = true; 
    isFlying = false; 

    missionSource.clear();
    stormSource.clear();
    waypointSource.clear();
    routeSource.clear();
    waypoints = []; 
    
    let target;
    let attempts = 0;
    do {
        target = airports[Math.floor(Math.random() * airports.length)];
        attempts++;
    } while (target === currentMission && attempts < 10);
    currentMission = target;

    updateFuelUI();
    generateStorms(12); 

    const goalText = playerCount === 2 ? `RACE TO: ${target.name}` : `GOAL: ${target.name}`;
    document.getElementById('mission-info').innerHTML = `<span style="color:#FFE773">${goalText}</span>`;

    const targetFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(target.coords)),
        name: 'target'
    });

    targetFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
            radius: 20, 
            fill: new ol.style.Fill({ color: 'rgba(0, 255, 0, 0.6)' }), 
            stroke: new ol.style.Stroke({ color: 'white', width: 3 })
        })
    }));

    missionSource.addFeature(targetFeature);
    
    const timeLimit = playerCount === 2 ? 20 : (activeControlMethod === "wasd" ? 15 : 20); 
    startTimer(timeLimit);
}

function generateStorms(count) {
    for (let i = 0; i < count; i++) {
        const lon = (Math.random() * 360) - 180; 
        const lat = (Math.random() * 140) - 70;
        const stormFeature = new ol.Feature({
            geometry: new ol.geom.Circle(ol.proj.fromLonLat([lon, lat]), 600000) 
        });
        stormSource.addFeature(stormFeature);
    }
}

function calculateRouteFuelCost() {
    if (waypoints.length === 0) return 0;
    let totalDistance = 0;
    let currentPos = plane1.getGeometry().getCoordinates();
    waypoints.forEach(wp => {
        const line = new ol.geom.LineString([currentPos, wp]);
        totalDistance += line.getLength();
        currentPos = wp;
    });
    const endCoords = ol.proj.fromLonLat(currentMission.coords);
    const lastLeg = new ol.geom.LineString([currentPos, endCoords]);
    totalDistance += lastLeg.getLength();
    return Math.floor(totalDistance / 300000); 
}

function checkCollision(coords, playerNum) {
    const features = stormSource.getFeaturesAtCoordinate(coords);
    if (features.length > 0) {
        consumeFuel(0.2); 
        if(playerCount === 1) {
             document.getElementById('mission-info').innerText = `⚠️ STORM ALERT!`;
             document.getElementById('mission-info').style.color = "red";
        }
    }
}

function checkArrival(coords, playerNum) {
    const targetCoords = ol.proj.fromLonLat(currentMission.coords);
    const dx = coords[0] - targetCoords[0];
    const dy = coords[1] - targetCoords[1];
    const distance = Math.sqrt(dx*dx + dy*dy);
    if (distance < 250000) finishRound(playerNum);
}

function finishRound(winnerNum) {
    isGameActive = false;
    isFlying = false;
    stopFlight(); 
    
    if (winnerNum === 1) scoreP1 += 100;
    if (winnerNum === 2) scoreP2 += 100;
    
    missionsCompleted++;
    
    if(playerCount === 1) {
        document.getElementById('status-score').innerText = `Score: ${scoreP1} | Missions: ${missionsCompleted}/${WIN_MISSION_COUNT}`;
    } else {
        document.getElementById('score-p1').innerText = `P1: ${scoreP1}`;
        document.getElementById('score-p2').innerText = `P2: ${scoreP2}`;
    }
    
    showModal("MISSION COMPLETE!", `Player ${winnerNum} arrived first!\n+100 Points`, "NEXT MISSION", "next");
}

function consumeFuel(amount) {
    fuel -= amount;
    if (fuel <= 0) {
        fuel = 0;
        updateFuelUI();
        handleMissionFail("FUEL EMPTY!");
        return false; 
    }
    updateFuelUI();
    return true; 
}

function updateFuelUI() {
    const fuelText = document.getElementById('status-fuel');
    if(fuelText) {
        fuelText.innerText = `Fuel: ${Math.floor(fuel)}%`;
        fuelText.style.color = fuel < 30 ? "red" : "white";
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
    const timerEl = document.getElementById('status-timer');
    if(timerEl) timerEl.innerText = `Time: ${timeLeft}s`;
    
    missionTimer = setInterval(() => {
        if (activeControlMethod === "mouse" && isFlying) return; 
        if (!isGameActive) return; 

        timeLeft--;
        if(timerEl) timerEl.innerText = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(missionTimer);
            handleMissionFail("Time's Up!");
        }
    }, 1000);
}

function handleMissionFail(reason) {
    isGameActive = false;
    isFlying = false;
    stopFlight();
    lives--;
    
    let hearts = "";
    for(let i=0; i<lives; i++) hearts += "❤️";
    const livesEl = document.getElementById('status-lives');
    if(livesEl) livesEl.innerText = `Lives: ${hearts}`;
    
    if (lives > 0) {
        showModal("MISSION FAILED", `${reason}\nYou lost 1 Life.`, "TRY AGAIN", "next");
    } else {
        generateMission(); // Game Over'a gider
    }
}

function stopFlight() {
    isFlying = false;
    if(engineSound) { 
        engineSound.pause(); 
        engineSound.currentTime = 0; 
    }
    routeSource.clear();
    waypointSource.clear();
    waypoints = [];
}

// --- BAŞLATMA ---
window.onload = function() {
    const pCountSelect = document.getElementById('player-count');
    const cMethodSelect = document.getElementById('control-method');
    
    if (pCountSelect) {
        pCountSelect.addEventListener('change', function() {
            if (this.value === "2") {
                cMethodSelect.value = "wasd";
                cMethodSelect.disabled = true; 
            } else {
                cMethodSelect.disabled = false; 
            }
        });
    }

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            const pCount = pCountSelect.value;
            const method = cMethodSelect.value;
            
            // GERİ SAYIM BAŞLAT
            startCountdown(pCount, method);
        });
    }
};