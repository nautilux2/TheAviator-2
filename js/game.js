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
  green: 0x7ec850
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
    distanceForEnnemiesSpawn: 50,

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
    const planeTypes = ['orange', 'blue', 'green', 'yellow', 'purple'];
    const currentIndex = planeTypes.indexOf(selectedPlaneType);
    const nextIndex = (currentIndex + 1) % planeTypes.length;
    switchPlane(planeTypes[nextIndex]);
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

  // Cabin
  var geomCabin;
  switch (selectedPlaneType) {
    case 'orange':
      // F-22 Raptor - Tiêm kích hiện đại
      geomCabin = new THREE.BoxGeometry(120, 20, 35, 1, 1, 1);
      geomCabin.vertices[4].y -= 2;
      geomCabin.vertices[4].z += 10;
      geomCabin.vertices[5].y -= 2;
      geomCabin.vertices[5].z -= 10;
      geomCabin.vertices[6].y += 5;
      geomCabin.vertices[6].z += 10;
      geomCabin.vertices[7].y += 5;
      geomCabin.vertices[7].z -= 10;
      break;
    case 'blue':
      // Apache Helicopter - Trực thăng tấn công
      geomCabin = new THREE.BoxGeometry(70, 40, 40, 1, 1, 1);
      geomCabin.vertices[4].y -= 5;
      geomCabin.vertices[4].z += 15;
      geomCabin.vertices[5].y -= 5;
      geomCabin.vertices[5].z -= 15;
      geomCabin.vertices[6].y += 10;
      geomCabin.vertices[6].z += 15;
      geomCabin.vertices[7].y += 10;
      geomCabin.vertices[7].z -= 15;
      break;
    case 'green':
      // UFO - Đĩa bay
      geomCabin = new THREE.BoxGeometry(50, 15, 50, 1, 1, 1);
      for (var i = 0; i < 8; i++) {
        if (i < 4) {
          geomCabin.vertices[i].y -= 5;
        } else {
          geomCabin.vertices[i].y += 2;
        }
      }
      break;
    case 'yellow':
      // B-2 Spirit - Máy bay ném bom tàng hình
      geomCabin = new THREE.BoxGeometry(100, 10, 120, 1, 1, 1);
      for (var i = 0; i < 8; i++) {
        if (i < 4) {
          geomCabin.vertices[i].y -= 2;
        }
      }
      break;
    case 'purple':
      // V-22 Osprey - Máy bay cánh xoay
      geomCabin = new THREE.BoxGeometry(90, 30, 30, 1, 1, 1);
      geomCabin.vertices[4].y -= 8;
      geomCabin.vertices[4].z += 12;
      geomCabin.vertices[5].y -= 8;
      geomCabin.vertices[5].z -= 12;
      geomCabin.vertices[6].y += 15;
      geomCabin.vertices[6].z += 12;
      geomCabin.vertices[7].y += 15;
      geomCabin.vertices[7].z -= 12;
      break;
  }

  var matCabin = new THREE.MeshPhongMaterial({ color: this.getPlaneColor(), shading: THREE.FlatShading });
  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Engine/Rotors
  var geomEngine;
  this.propeller = new THREE.Object3D(); // Initialize propeller as empty Object3D by default
  
  switch (selectedPlaneType) {
    case 'orange':
      // F-22 Twin Engines
      geomEngine = new THREE.BoxGeometry(20, 15, 15, 1, 1, 1);
      var engine = new THREE.Mesh(geomEngine, new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading }));
      engine.position.x = 50;
      engine.position.z = 15;
      var engine2 = engine.clone();
      engine2.position.z = -15;
      this.mesh.add(engine);
      this.mesh.add(engine2);
      this.mesh.add(this.propeller); // Add empty propeller
      break;
    case 'blue':
      // Apache Main Rotor
      geomEngine = new THREE.BoxGeometry(5, 10, 100, 1, 1, 1);
      var rotor = new THREE.Mesh(geomEngine, new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading }));
      rotor.position.y = 25;
      this.propeller.add(rotor);
      this.mesh.add(this.propeller);
      break;
    case 'green':
      // UFO Glow
      geomEngine = new THREE.BoxGeometry(40, 5, 40, 1, 1, 1);
      var glow = new THREE.Mesh(geomEngine, new THREE.MeshPhongMaterial({ color: Colors.white, transparent: true, opacity: 0.5, shading: THREE.FlatShading }));
      glow.position.y = -5;
      this.propeller.add(glow);
      this.mesh.add(this.propeller);
      break;
    case 'yellow':
      // B-2 Engines
      geomEngine = new THREE.BoxGeometry(20, 5, 20, 1, 1, 1);
      var engine = new THREE.Mesh(geomEngine, new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading }));
      engine.position.x = -30;
      engine.position.z = 40;
      var engine2 = engine.clone();
      engine2.position.z = -40;
      this.mesh.add(engine);
      this.mesh.add(engine2);
      this.mesh.add(this.propeller); // Add empty propeller
      break;
    case 'purple':
      // Osprey Rotors
      geomEngine = new THREE.BoxGeometry(5, 10, 80, 1, 1, 1);
      var rotorLeft = new THREE.Mesh(geomEngine, new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading }));
      rotorLeft.position.set(30, 20, 40);
      var rotorRight = rotorLeft.clone();
      rotorRight.position.z = -40;
      this.propeller.add(rotorLeft);
      this.propeller.add(rotorRight);
      this.mesh.add(this.propeller);
      break;
  }

  // Wings
  var geomWing;
  switch (selectedPlaneType) {
    case 'orange':
      // F-22 Delta Wings
      geomWing = new THREE.BoxGeometry(40, 5, 130, 1, 1, 1);
      for (var i = 0; i < 8; i++) {
        if (i < 4) geomWing.vertices[i].x -= 20;
      }
      break;
    case 'blue':
      // Apache Wings (Stub Wings)
      geomWing = new THREE.BoxGeometry(30, 3, 60, 1, 1, 1);
      break;
    case 'green':
      // UFO no traditional wings
      return;
    case 'yellow':
      // B-2 Flying Wing
      geomWing = new THREE.BoxGeometry(100, 3, 200, 1, 1, 1);
      for (var i = 0; i < 8; i++) {
        if (i < 4) geomWing.vertices[i].x -= 30;
      }
      break;
    case 'purple':
      // Osprey Wings
      geomWing = new THREE.BoxGeometry(30, 3, 100, 1, 1, 1);
      break;
  }

  if (geomWing) {
    var matWing = new THREE.MeshPhongMaterial({ color: this.getPlaneColor(), shading: THREE.FlatShading });
    var wing = new THREE.Mesh(geomWing, matWing);
    wing.position.set(0, 15, 0);
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);
  }

  // Tail
  var geomTail;
  switch (selectedPlaneType) {
    case 'orange':
      // F-22 Twin Tails
      geomTail = new THREE.BoxGeometry(15, 25, 5, 1, 1, 1);
      var tail1 = new THREE.Mesh(geomTail, matCabin);
      tail1.position.set(-40, 15, 15);
      tail1.rotation.z = Math.PI * 0.1;
      var tail2 = tail1.clone();
      tail2.position.z = -15;
      this.mesh.add(tail1);
      this.mesh.add(tail2);
      break;
    case 'blue':
      // Apache Tail Rotor
      geomTail = new THREE.BoxGeometry(40, 3, 3, 1, 1, 1);
      var tailRotor = new THREE.Mesh(geomTail, matCabin);
      tailRotor.position.set(-45, 10, 0);
      this.mesh.add(tailRotor);
      break;
    case 'yellow':
      // B-2 No Vertical Tail
      break;
    case 'purple':
      // Osprey Tail
      geomTail = new THREE.BoxGeometry(20, 20, 5, 1, 1, 1);
      var tail = new THREE.Mesh(geomTail, matCabin);
      tail.position.set(-45, 10, 0);
      this.mesh.add(tail);
      break;
  }

  // Thêm các thuộc tính đặc biệt cho từng loại máy bay
  switch (selectedPlaneType) {
    case 'orange': // F-22 Raptor
      this.mesh.scale.set(.25, .25, .25);
      game.planeSpeed = 1.4;
      game.planeMinSpeed = 1.6;
      game.planeMaxSpeed = 2.0;
      break;
    case 'blue': // Apache Helicopter
      this.mesh.scale.set(.3, .3, .3);
      game.planeSpeed = 0.9;
      game.planeMinSpeed = 1.1;
      game.planeMaxSpeed = 1.5;
      break;
    case 'green': // UFO
      this.mesh.scale.set(.2, .2, .2);
      game.planeSpeed = 1.6;
      game.planeMinSpeed = 1.8;
      game.planeMaxSpeed = 2.2;
      break;
    case 'yellow': // B-2 Spirit
      this.mesh.scale.set(.35, .35, .35);
      game.planeSpeed = 0.8;
      game.planeMinSpeed = 1.0;
      game.planeMaxSpeed = 1.4;
      break;
    case 'purple': // V-22 Osprey
      this.mesh.scale.set(.28, .28, .28);
      game.planeSpeed = 1.1;
      game.planeMinSpeed = 1.3;
      game.planeMaxSpeed = 1.7;
      break;
  }

  // Add pilot
  this.pilot = new Pilot();
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
  }
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
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
  var nEnnemies = 1;

  for (var i = 0; i < nEnnemies; i++) {
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i * 0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
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

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
    ennemy.mesh.rotation.z += Math.random() * .1;
    ennemy.mesh.rotation.y += Math.random() * .1;

    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.ennemyDistanceTolerance) {
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      // Kết thúc game ngay khi va chạm với enemy
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
  for (var i = 0; i < 10; i++) {
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
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
  // Tính toán thời gian đã chơi (tính bằng giây)
  var currentTime = new Date().getTime();
  var playTime = (currentTime - game.gameStartTime) / 1000;

  // Hiển thị thời gian sống sót
  fieldLevel.innerHTML = Math.floor(playTime) + "s";

  // Tăng độ khó theo thời gian
  game.difficultyFactor = 1 + (playTime / 30);

  // Cập nhật tốc độ game
  game.targetBaseSpeed = game.initSpeed * game.difficultyFactor;

  // Cập nhật tốc độ enemies và coins
  game.ennemiesSpeed = 0.6 * game.difficultyFactor;
  game.coinsSpeed = 0.5 * game.difficultyFactor;

  // Giảm khoảng cách spawn của enemies và coins theo độ khó
  game.distanceForEnnemiesSpawn = Math.max(30, 50 / game.difficultyFactor);
  game.distanceForCoinsSpawn = Math.max(50, 100 / game.difficultyFactor);
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

  // Thiết lập trạng thái active cho nút máy bay đầu tiên
  document.querySelector(`.plane-button[data-plane="${selectedPlaneType}"]`).classList.add('active');

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
    default: return Colors.orange;
  }
};

// Thêm hàm chuyển đổi máy bay trong game
function switchPlane(type) {
  if (game.status !== "playing") return; // Chỉ cho phép đổi khi đang chơi

  selectedPlaneType = type;

  // Cập nhật giao diện nút
  document.querySelectorAll('.plane-button').forEach(button => {
    button.classList.remove('active');
  });
  document.querySelector(`.plane-button[data-plane="${type}"]`).classList.add('active');

  // Lưu vị trí và hướng hiện tại của máy bay
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

  // Lưu pilot hiện tại
  var currentPilot = airplane.pilot;

  // Xóa máy bay cũ
  scene.remove(airplane.mesh);

  // Tạo máy bay mới
  airplane = new AirPlane();

  // Khôi phục vị trí và hướng
  airplane.mesh.position.set(currentPos.x, currentPos.y, currentPos.z);
  airplane.mesh.rotation.set(currentRot.x, currentRot.y, currentRot.z);

  // Khôi phục pilot
  if (currentPilot) {
    airplane.pilot = currentPilot;
    // Cập nhật vị trí pilot dựa trên loại máy bay mới
    switch(type) {
      case 'orange': // F-22 Raptor
        airplane.pilot.mesh.position.set(-10, 27, 0);
        break;
      case 'blue': // Apache Helicopter
        airplane.pilot.mesh.position.set(-5, 30, 0);
        break;
      case 'green': // UFO
        airplane.pilot.mesh.position.set(0, 15, 0);
        break;
      case 'yellow': // B-2 Spirit
        airplane.pilot.mesh.position.set(-20, 25, 0);
        break;
      case 'purple': // V-22 Osprey
        airplane.pilot.mesh.position.set(-15, 27, 0);
        break;
    }
    airplane.mesh.add(airplane.pilot.mesh);
  }

  // Thêm vào scene
  scene.add(airplane.mesh);
}
