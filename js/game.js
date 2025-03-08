// Thêm biến để lưu loại máy bay được chọn
var selectedPlaneType = 'orange';

// Thêm các màu sắc mới
var Colors = {
  orange: 0xff7f27,
  purple: 0x9b59b6,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  pink: 0xF5986E,
  yellow: 0xf4ce93,
  blue: 0x68c3c0,
  green: 0x7ec850,
  red: 0xff0000,
  silver: 0xc0c0c0,
  black: 0x000000,
  gold: 0xffd700,
  navy: 0x000080,
  crimson: 0xdc143c,
  teal: 0x008080,
  maroon: 0x800000,
  olive: 0x808000,
  indigo: 0x4b0082,
  // Add gradient colors
  gradientBlue: {
    top: 0x00bfff,
    bottom: 0x0000ff
  },
  gradientRed: {
    top: 0xff6b6b,
    bottom: 0xff0000
  },
  gradientGold: {
    top: 0xffd700,
    bottom: 0xffa500
  }
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

// Add variable for available planes
var availablePlanes = [];
var allPlaneTypes = [
  'orange', 'blue', 'green', 'yellow', 'purple',
  'stealth', 'biplane', 'seaplane', 'vtol', 'glider',
  'drone', 'jet', 'cargo', 'supersonic', 'spyplane'
];

function resetGame() {
  game = {
    speed: 0,
    initSpeed: .00035,
    baseSpeed: .00035,
    targetBaseSpeed: .00035,
    incrementSpeedByTime: .000005,
    distanceForSpeedUpdate: 50,
    speedLastUpdate: 0,

    distance: 0,
    ratioSpeedDistance: 50,

    planeDefaultHeight: 100,
    planeAmpHeight: 80,
    planeAmpWidth: 75,
    planeMoveSensivity: 0.005,
    planeRotXSensivity: 0.0008,
    planeRotZSensivity: 0.0004,
    planeFallSpeed: .001,
    planeMinSpeed: 1.2,
    planeMaxSpeed: 1.6,
    planeSpeed: 0,
    planeCollisionDisplacementX: 0,
    planeCollisionSpeedX: 0,

    planeCollisionDisplacementY: 0,
    planeCollisionSpeedY: 0,

    seaRadius: 600,
    seaLength: 800,
    wavesMinAmp: 5,
    wavesMaxAmp: 20,
    wavesMinSpeed: 0.001,
    wavesMaxSpeed: 0.003,

    cameraFarPos: 500,
    cameraNearPos: 150,
    cameraSensivity: 0.002,

    coinDistanceTolerance: 15,
    coinValue: 3,
    coinsSpeed: .5,
    coinLastSpawn: 0,
    distanceForCoinsSpawn: 100,

    ennemyDistanceTolerance: 10,
    ennemyValue: 10,
    ennemiesSpeed: .6,
    ennemyLastSpawn: 0,
    distanceForEnnemiesSpawn: 10,
    initialEnnemiesCount: 12,
    maxEnemiesAtOnce: 15,
    baseEnemySpawnCount: 3,

    gameStartTime: new Date().getTime(),
    difficultyFactor: 1,

    status: "playing",
  };
  fieldLevel.innerHTML = "1";
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleTouchMove(event) {
    event.preventDefault();
  var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
  var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
  if (game.status == "waitingReplay") {
    resetGame();
    hideReplay();
  }
}

// Thêm hàm xử lý phím
function handleKeyPress(event) {
  if (event.key.toLowerCase() === 'q' && game.status === "playing") {
    const currentIndex = availablePlanes.indexOf(selectedPlaneType);
    const nextIndex = (currentIndex + 1) % availablePlanes.length;
    selectedPlaneType = availablePlanes[nextIndex];
    switchPlane(availablePlanes[nextIndex]);
  } else if (event.key.toLowerCase() === 'r' && game.status === "playing") {
    // Press R to get new random selection of planes
    selectRandomPlanes();
    switchPlane(selectedPlaneType);
  }
}

function handleTouchEnd(event) {
  if (game.status == "waitingReplay") {
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}


var Pilot = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs = 0;

  var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
  var bodyMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2, -12, 0);

  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10, 10, 10);
  var faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  var hairGeom = new THREE.BoxGeometry(4, 4, 4);
  var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6);
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0)
  hairs.add(hairBack);
  hairs.position.set(-5, 5, 0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5, 5, 5);
  var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function () {
  //*
   var hairs = this.hairsTop.children;

   var l = hairs.length;
  for (var i = 0; i < l; i++) {
      var h = hairs[i];
    h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
   }
  this.angleHairs += game.speed * deltaTime * 40;
  //*/
}

var AirPlane = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // Initialize propeller
  this.propeller = new THREE.Object3D();

  // Cabin
  var geomCabin;
  var matCabin;
  
  switch (selectedPlaneType) {
    case 'orange': // F-22 Raptor - Low poly jet fighter
      geomCabin = new THREE.BoxGeometry(80, 15, 30, 1, 1, 1);
      // Create angular nose
      geomCabin.vertices[4].y -= 2;
      geomCabin.vertices[5].y -= 2;
      geomCabin.vertices[4].x += 15;
      geomCabin.vertices[5].x += 15;
      
      // Create twin engines
      var geomEngine = new THREE.BoxGeometry(20, 10, 10);
      var engine1 = new THREE.Mesh(geomEngine, matCabin);
      var engine2 = engine1.clone();
      engine1.position.set(0, -5, 15);
      engine2.position.set(0, -5, -15);
      this.mesh.add(engine1);
      this.mesh.add(engine2);
      break;

    case 'blue': // Apache - Low poly helicopter
      geomCabin = new THREE.BoxGeometry(50, 20, 20, 1, 1, 1);
      
      // Main rotor
      var geomRotor = new THREE.BoxGeometry(5, 2, 100);
      var rotor = new THREE.Mesh(geomRotor, matCabin);
      rotor.position.y = 20;
      this.propeller.add(rotor);
      
      // Tail rotor
      var geomTailRotor = new THREE.BoxGeometry(20, 2, 2);
      var tailRotor = new THREE.Mesh(geomTailRotor, matCabin);
      tailRotor.position.set(-30, 10, 0);
      tailRotor.rotation.y = Math.PI/2;
      this.propeller.add(tailRotor);
      break;

    case 'biplane': // Classic biplane with propeller
      geomCabin = new THREE.BoxGeometry(40, 15, 15, 1, 1, 1);
      
      // Propeller
      var geomPropeller = new THREE.BoxGeometry(5, 30, 2);
      var propeller = new THREE.Mesh(geomPropeller, matCabin);
      propeller.position.set(25, 0, 0);
      this.propeller.add(propeller);
      
      // Double wings
      var geomWing = new THREE.BoxGeometry(20, 3, 60);
      var topWing = new THREE.Mesh(geomWing, matCabin);
      var bottomWing = topWing.clone();
      topWing.position.y = 12;
      bottomWing.position.y = -5;
      this.mesh.add(topWing);
      this.mesh.add(bottomWing);
      break;

    case 'seaplane': // Seaplane with floats and propeller
      geomCabin = new THREE.BoxGeometry(50, 20, 20, 1, 1, 1);
      
      // Propeller
      var geomPropeller = new THREE.BoxGeometry(5, 30, 2);
      var propeller = new THREE.Mesh(geomPropeller, matCabin);
      propeller.position.set(30, 0, 0);
      this.propeller.add(propeller);
      
      // Floats
      var geomFloat = new THREE.BoxGeometry(40, 5, 8);
      var float1 = new THREE.Mesh(geomFloat, matCabin);
      var float2 = float1.clone();
      float1.position.set(0, -15, 15);
      float2.position.set(0, -15, -15);
      this.mesh.add(float1);
      this.mesh.add(float2);
      break;

    case 'cargo': // Large cargo plane with propellers
      geomCabin = new THREE.BoxGeometry(100, 35, 35, 1, 1, 1);
      
      // Four propellers
      var geomPropeller = new THREE.BoxGeometry(5, 25, 2);
      for(var i = 0; i < 4; i++) {
        var prop = new THREE.Mesh(geomPropeller, matCabin);
        prop.position.set(i < 2 ? -20 : 20, 0, i%2 === 0 ? 20 : -20);
        this.propeller.add(prop);
      }
      break;

    case 'vtol': // VTOL aircraft with tiltable propellers
      geomCabin = new THREE.BoxGeometry(60, 20, 20, 1, 1, 1);
      
      // Tilt rotors
      var geomRotor = new THREE.BoxGeometry(5, 30, 2);
      var rotor1 = new THREE.Mesh(geomRotor, matCabin);
      var rotor2 = rotor1.clone();
      rotor1.position.set(0, 15, 15);
      rotor2.position.set(0, 15, -15);
      this.propeller.add(rotor1);
      this.propeller.add(rotor2);
      break;

    case 'drone': // Small drone with quad rotors
      geomCabin = new THREE.BoxGeometry(30, 5, 30, 1, 1, 1);
      
      // Four rotors
      var geomRotor = new THREE.BoxGeometry(2, 20, 2);
      for(var i = 0; i < 4; i++) {
        var rotor = new THREE.Mesh(geomRotor, matCabin);
        rotor.position.set(i < 2 ? -10 : 10, 5, i%2 === 0 ? 10 : -10);
        this.propeller.add(rotor);
      }
      break;

    default: // Default low-poly aircraft
      geomCabin = new THREE.BoxGeometry(60, 20, 20, 1, 1, 1);
      geomCabin.vertices[4].y -= 5;
      geomCabin.vertices[5].y -= 5;
      geomCabin.vertices[4].x += 10;
      geomCabin.vertices[5].x += 10;
  }

  // Create cabin
  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Add wings for most aircraft types (except drone)
  if (selectedPlaneType !== 'drone') {
    var geomWing = new THREE.BoxGeometry(40, 3, 100);
    var wing = new THREE.Mesh(geomWing, matCabin);
    wing.position.set(0, 5, 0);
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);
  }

  // Add tail for most aircraft types (except drone and UFO)
  if (selectedPlaneType !== 'drone' && selectedPlaneType !== 'green') {
    var geomTail = new THREE.BoxGeometry(20, 15, 5);
    var tail = new THREE.Mesh(geomTail, matCabin);
    tail.position.set(-30, 10, 0);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);
  }

  // Add propeller to mesh
  this.mesh.add(this.propeller);

  // Create pilot
  this.pilot = new Pilot();
  this.updatePilotPosition();
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};

// Add method to update pilot position
AirPlane.prototype.updatePilotPosition = function() {
  switch(selectedPlaneType) {
    case 'orange': // F-22 Raptor
      this.pilot.mesh.position.set(-10, 27, 0);
      break;
    case 'blue': // Apache Helicopter
      this.pilot.mesh.position.set(-5, 30, 0);
      break;
    case 'green': // UFO
      this.pilot.mesh.position.set(0, 15, 0);
      break;
    case 'yellow': // B-2 Spirit
      this.pilot.mesh.position.set(-20, 25, 0);
      break;
    case 'purple': // V-22 Osprey
      this.pilot.mesh.position.set(-15, 27, 0);
      break;
    case 'stealth':
      this.pilot.mesh.position.set(-15, 25, 0);
      break;
    case 'biplane':
      this.pilot.mesh.position.set(-8, 28, 0);
      break;
    case 'seaplane':
      this.pilot.mesh.position.set(-12, 30, 0);
      break;
    case 'vtol':
      this.pilot.mesh.position.set(-10, 32, 0);
      break;
    case 'glider':
      this.pilot.mesh.position.set(-15, 22, 0);
      break;
    case 'drone':
      this.pilot.mesh.position.set(-8, 20, 0);
      break;
    case 'jet':
      this.pilot.mesh.position.set(-20, 28, 0);
      break;
    case 'cargo':
      this.pilot.mesh.position.set(-25, 35, 0);
      break;
    case 'supersonic':
      this.pilot.mesh.position.set(-30, 25, 0);
      break;
    case 'spyplane':
      this.pilot.mesh.position.set(-18, 23, 0);
      break;
    default:
      this.pilot.mesh.position.set(-10, 27, 0);
  }
};

Sky = function () {
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI * 2 / this.nClouds;
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle * i;
    var h = game.seaRadius + 150 + Math.random() * 200;
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;
    c.mesh.position.z = -300 - Math.random() * 500;
    c.mesh.rotation.z = a + Math.PI / 2;
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function () {
  for (var i = 0; i < this.nClouds; i++) {
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed * deltaTime;

}

Sea = function () {
  var geom = new THREE.CylinderGeometry(game.seaRadius, game.seaRadius, game.seaLength, 40, 10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i = 0; i < l; i++) {
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: game.wavesMinAmp + Math.random() * (game.wavesMaxAmp - game.wavesMinAmp),
      speed: game.wavesMinSpeed + Math.random() * (game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: .8,
    shading: THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function () {
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i = 0; i < l; i++) {
    var v = verts[i];
    var vprops = this.waves[i];
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    vprops.ang += vprops.speed * deltaTime;
    this.mesh.geometry.verticesNeedUpdate = true;
  }
}

Cloud = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20, 20, 20);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white,

  });

  //*
  var nBlocs = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;
    var s = .1 + Math.random() * .9;
    m.scale.set(s, s, s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function () {
  var l = this.mesh.children.length;
  for (var i = 0; i < l; i++) {
    var m = this.mesh.children[i];
    m.rotation.z += Math.random() * .005 * (i + 1);
    m.rotation.y += Math.random() * .002 * (i + 1);
  }
}

Ennemy = function () {
  var geom = new THREE.TetrahedronGeometry(8, 2);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function () {
  // Calculate number of enemies based on game time
  var playTime = (new Date().getTime() - game.gameStartTime) / 1000;
  var timeBonus = Math.floor(playTime / 15); // Every 15 seconds increase spawn count (changed from 30)
  var nEnnemies = game.baseEnemySpawnCount + timeBonus;
  nEnnemies = Math.min(nEnnemies, game.maxEnemiesAtOnce); // Cap at maximum
  
  for (var i = 0; i < nEnnemies; i++) {
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    // Increase sea enemy probability over time
    var seaEnemyChance = 0.4 + (timeBonus * 0.08); // Increases by 8% every 15 seconds (increased from 5%)
    seaEnemyChance = Math.min(seaEnemyChance, 0.7); // Cap at 70% chance (increased from 60%)
    
    var isSeaEnemy = Math.random() < seaEnemyChance;
    
    if (isSeaEnemy) {
      // Sea enemy - starts below sea level and moves up
      ennemy.angle = - (i * 0.1);
      ennemy.distance = game.seaRadius - 50 - Math.random() * 100;
      ennemy.mesh.material.color = new THREE.Color(Colors.blue);
      ennemy.mesh.scale.set(1.5, 1.5, 1.5);
    } else {
      // Air enemy - now with varying heights
      ennemy.angle = - (i * 0.1);
      var heightVariation = Math.random(); // Random height variation
      if (heightVariation < 0.4) {
        // Low altitude
        ennemy.distance = game.seaRadius + 50 + Math.random() * 50;
      } else if (heightVariation < 0.7) {
        // Medium altitude
        ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
      } else {
        // High altitude
        ennemy.distance = game.seaRadius + game.planeDefaultHeight + game.planeAmpHeight + Math.random() * 50;
      }
      ennemy.mesh.material.color = new THREE.Color(Colors.red);
      ennemy.mesh.scale.set(1, 1, 1);
    }

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function () {
  for (var i = 0; i < this.ennemiesInUse.length; i++) {
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

    if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

    // Add vertical movement for sea enemies
    if (ennemy.mesh.material.color.getHex() === Colors.blue) {
      // Sea enemies move up and down
      var verticalMovement = Math.sin(ennemy.angle * 3) * 50;
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance + verticalMovement;
    } else {
      ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    }
    
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
    ennemy.mesh.rotation.z += Math.random() * .1;
    ennemy.mesh.rotation.y += Math.random() * .1;

    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.ennemyDistanceTolerance) {
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, ennemy.mesh.material.color.getHex(), 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      game.status = "gameover";
      i--;
    } else if (ennemy.angle > Math.PI) {
      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function () {
  var geom = new THREE.TetrahedronGeometry(3, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xffffff,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function (pos, color, scale) {
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color(color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random() * 2) * 50;
  var targetY = pos.y + (-1 + Math.random() * 2) * 50;
  var speed = .6 + Math.random() * .2;
  TweenMax.to(this.mesh.rotation, speed, { x: Math.random() * 12, y: Math.random() * 12 });
  TweenMax.to(this.mesh.scale, speed, { x: .1, y: .1, z: .1 });
  TweenMax.to(this.mesh.position, speed, {
    x: targetX, y: targetY, delay: Math.random() * .1, ease: Power2.easeOut, onComplete: function () {
      if (_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1, 1, 1);
      particlesPool.unshift(_this);
    }
  });
}

ParticlesHolder = function () {
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function (pos, density, color, scale) {

  var nPArticles = density;
  for (var i = 0; i < nPArticles; i++) {
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    } else {
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos, color, scale);
  }
}

Coin = function () {
  var geom = new THREE.TetrahedronGeometry(5, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xffffff,

    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins) {
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i = 0; i < nCoins; i++) {
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function () {

  var nCoins = 1 + Math.floor(Math.random() * 10);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
  var amplitude = 10 + Math.round(Math.random() * 10);
  for (var i = 0; i < nCoins; i++) {
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    } else {
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i * 0.02);
    coin.distance = d + Math.cos(i * .5) * amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function () {
  for (var i = 0; i < this.coinsInUse.length; i++) {
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed * deltaTime * game.coinsSpeed;
    if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    coin.mesh.rotation.z += Math.random() * .1;
    coin.mesh.rotation.y += Math.random() * .1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.coinDistanceTolerance) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      i--;
    } else if (coin.angle > Math.PI) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}


// 3D Models
var sea;
var airplane;

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25, .25, .25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins() {

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies() {
  // Increase pool size to handle more enemies
  for (var i = 0; i < 30; i++) {
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  scene.add(ennemiesHolder.mesh);

  // Spawn initial enemies in different positions
  for (var i = 0; i < game.initialEnnemiesCount; i++) {
    spawnInitialEnemies();
  }
}

// New function to spawn initial enemies in different positions
function spawnInitialEnemies() {
  var ennemy;
  if (ennemiesPool.length) {
    ennemy = ennemiesPool.pop();
  } else {
    ennemy = new Ennemy();
  }

  // Randomize enemy type and position
  var position = Math.random();
  
  if (position < 0.4) { // Sea enemy
    ennemy.angle = Math.random() * Math.PI * 2;
    ennemy.distance = game.seaRadius - 50 - Math.random() * 100;
    ennemy.mesh.material.color = new THREE.Color(Colors.blue);
    ennemy.mesh.scale.set(1.5, 1.5, 1.5);
  } else if (position < 0.7) { // Low altitude enemy
    ennemy.angle = Math.random() * Math.PI * 2;
    ennemy.distance = game.seaRadius + 50 + Math.random() * 50;
    ennemy.mesh.material.color = new THREE.Color(Colors.red);
    ennemy.mesh.scale.set(1, 1, 1);
  } else { // High altitude enemy
    ennemy.angle = Math.random() * Math.PI * 2;
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + Math.random() * game.planeAmpHeight;
    ennemy.mesh.material.color = new THREE.Color(Colors.red);
    ennemy.mesh.scale.set(0.8, 0.8, 0.8);
  }

  // Set initial position
  ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
  ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

  // Add to scene
  ennemiesHolder.mesh.add(ennemy.mesh);
  ennemiesHolder.ennemiesInUse.push(ennemy);
}

function createParticles() {
  for (var i = 0; i < 10; i++) {
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}

function updateDifficulty() {
  var currentTime = new Date().getTime();
  var playTime = (currentTime - game.gameStartTime) / 1000;

  fieldLevel.innerHTML = Math.floor(playTime) + "s";

  // Dynamic difficulty scaling
  game.difficultyFactor = 1 + Math.log(1 + playTime / 20);
  game.targetBaseSpeed = game.initSpeed * game.difficultyFactor;

  // Adaptive enemy speed and spawn rate
  var baseSpawnInterval = Math.max(2, 10 - Math.floor(playTime / 30));
  game.distanceForEnnemiesSpawn = baseSpawnInterval;
  
  // Dynamic enemy speed
  game.ennemiesSpeed = Math.min(2.5, 0.6 + (playTime / 60));
  
  // Adjust spawn counts based on time
  game.baseEnemySpawnCount = Math.min(5, 2 + Math.floor(playTime / 45));
  game.maxEnemiesAtOnce = Math.min(20, 12 + Math.floor(playTime / 30));
}

function loop() {

  newTime = new Date().getTime();
  deltaTime = newTime - oldTime;
  oldTime = newTime;

  if (game.status == "playing") {

    // Cập nhật độ khó
    updateDifficulty();

    // Add coins every 100m;
    if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
    }


    if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn) {
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    updatePlane();
    updateDistance();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

    // Add sea waves
    sea.mesh.rotation.z += .005;
    sea.mesh.rotation.x += .005;

  } else if (game.status == "gameover") {
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * .0002 * deltaTime;
    airplane.mesh.rotation.x += 0.0003 * deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

    if (airplane.mesh.position.y < -200) {
      showReplay();
      game.status = "waitingReplay";
    }
  } else if (game.status == "waitingReplay") {

  }


  airplane.propeller.rotation.x += .2 + game.planeSpeed * deltaTime * .005;
  sea.mesh.rotation.z += game.speed * deltaTime;//*game.seaRotationSpeed;

  if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance() {
  game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
}

function updatePlane() {

  game.planeSpeed = normalize(mousePos.x, -.5, .5, game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
  var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * .7, -game.planeAmpWidth);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;


  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

  airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
  targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
  camera.updateProjectionMatrix()
  camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;

  game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
  game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

  airplane.pilot.updateHairs();
}

function showReplay() {
  replayMessage.style.display = "block";
}

function hideReplay() {
  replayMessage.style.display = "none";
}

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + (pc * dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event) {
  // UI
  fieldDistance = document.getElementById("distValue");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('keypress', handleKeyPress, false);

  loop();
}

window.addEventListener('load', init, false);

// Thêm method để lấy màu máy bay
AirPlane.prototype.getPlaneColor = function () {
  switch (selectedPlaneType) {
    case 'orange': return Colors.orange;
    case 'blue': return Colors.blue;
    case 'green': return Colors.green;
    case 'yellow': return Colors.yellow;
    case 'purple': return Colors.purple;
    case 'stealth': return Colors.black;
    case 'biplane': return Colors.red;
    case 'seaplane': return Colors.silver;
    case 'vtol': return Colors.navy;
    case 'glider': return Colors.white;
    case 'drone': return Colors.olive;
    case 'jet': return Colors.gold;
    case 'cargo': return Colors.maroon;
    case 'supersonic': return Colors.crimson;
    case 'spyplane': return Colors.teal;
    default: return Colors.orange;
  }
};

// Thêm hàm chuyển đổi máy bay trong game
function switchPlane(type) {
  if (game.status !== "playing") return;

  selectedPlaneType = type;

  // Store current position and rotation
  var currentPos = {
    x: airplane.mesh.position.x,
    y: airplane.mesh.position.y,
    z: airplane.mesh.position.z
  };
  var currentRot = {
    x: airplane.mesh.rotation.x,
    y: airplane.mesh.rotation.y,
    z: airplane.mesh.rotation.z
  };

  // Store current pilot
  var currentPilot = airplane.pilot;

  // Remove old airplane
  scene.remove(airplane.mesh);

  // Create new airplane
  airplane = new AirPlane();

  // Restore position and rotation
  airplane.mesh.position.set(currentPos.x, currentPos.y, currentPos.z);
  airplane.mesh.rotation.set(currentRot.x, currentRot.y, currentRot.z);

  // Update scale and speed based on plane type
  switch(type) {
    case 'orange': // F-22 Raptor
      airplane.mesh.scale.set(.25, .25, .25);
      game.planeSpeed = 1.4;
      game.planeMinSpeed = 1.6;
      game.planeMaxSpeed = 2.0;
      break;
    case 'blue': // Apache Helicopter
      airplane.mesh.scale.set(.3, .3, .3);
      game.planeSpeed = 0.9;
      game.planeMinSpeed = 1.1;
      game.planeMaxSpeed = 1.5;
      break;
    case 'green': // UFO
      airplane.mesh.scale.set(.2, .2, .2);
      game.planeSpeed = 1.6;
      game.planeMinSpeed = 1.8;
      game.planeMaxSpeed = 2.2;
      break;
    case 'yellow': // B-2 Spirit
      airplane.mesh.scale.set(.35, .35, .35);
      game.planeSpeed = 0.8;
      game.planeMinSpeed = 1.0;
      game.planeMaxSpeed = 1.4;
      break;
    case 'purple': // V-22 Osprey
      airplane.mesh.scale.set(.28, .28, .28);
      game.planeSpeed = 1.1;
      game.planeMinSpeed = 1.3;
      game.planeMaxSpeed = 1.7;
      break;
    case 'stealth':
      airplane.mesh.scale.set(.25, .25, .25);
      game.planeSpeed = 1.5;
      game.planeMinSpeed = 1.7;
      game.planeMaxSpeed = 2.1;
      break;
    case 'biplane':
      airplane.mesh.scale.set(.3, .3, .3);
      game.planeSpeed = 0.8;
      game.planeMinSpeed = 1.0;
      game.planeMaxSpeed = 1.4;
      break;
    case 'seaplane':
      airplane.mesh.scale.set(.32, .32, .32);
      game.planeSpeed = 0.9;
      game.planeMinSpeed = 1.1;
      game.planeMaxSpeed = 1.5;
      break;
    case 'vtol':
      airplane.mesh.scale.set(.28, .28, .28);
      game.planeSpeed = 1.2;
      game.planeMinSpeed = 1.4;
      game.planeMaxSpeed = 1.8;
      break;
    case 'glider':
      airplane.mesh.scale.set(.27, .27, .27);
      game.planeSpeed = 0.7;
      game.planeMinSpeed = 0.9;
      game.planeMaxSpeed = 1.3;
      break;
    case 'drone':
      airplane.mesh.scale.set(.22, .22, .22);
      game.planeSpeed = 1.6;
      game.planeMinSpeed = 1.8;
      game.planeMaxSpeed = 2.2;
      break;
    case 'jet':
      airplane.mesh.scale.set(.3, .3, .3);
      game.planeSpeed = 1.3;
      game.planeMinSpeed = 1.5;
      game.planeMaxSpeed = 1.9;
      break;
    case 'cargo':
      airplane.mesh.scale.set(.4, .4, .4);
      game.planeSpeed = 0.6;
      game.planeMinSpeed = 0.8;
      game.planeMaxSpeed = 1.2;
      break;
    case 'supersonic':
      airplane.mesh.scale.set(.26, .26, .26);
      game.planeSpeed = 1.8;
      game.planeMinSpeed = 2.0;
      game.planeMaxSpeed = 2.4;
      break;
    case 'spyplane':
      airplane.mesh.scale.set(.24, .24, .24);
      game.planeSpeed = 1.4;
      game.planeMinSpeed = 1.6;
      game.planeMaxSpeed = 2.0;
      break;
  }

  // Add to scene
  scene.add(airplane.mesh);
}

// Function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to select random planes
function selectRandomPlanes() {
  availablePlanes = shuffleArray([...allPlaneTypes]).slice(0, 5);
  selectedPlaneType = availablePlanes[0];
}
