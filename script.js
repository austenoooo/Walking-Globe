const ground_radius = 200;
const view_length = 20;
const height = 2;
let camera_pos = {
  x: ground_radius + height,
  y: 0,
  z: 0,
};
let camera_look = {
  x: 0,
  y: view_length,
  z: 0,
};
let currentAngle = 0;
let rotateSpeed = Math.PI / 1200;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

// for debug
camera.position.set(300, 300, 300);
camera.lookAt(0, 0, 0);

// camera.position.set(camera_pos.x, camera_pos.y, camera_pos.z);
// camera.lookAt(camera_look.x, camera_look.y, camera_look.z);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



const imgArray = [
  "px.png",
  "nx.png",
  "py.png",
  "ny.png",
  "pz.png",
  "nz.png",
];

// load cubemap
var cubeLoader = new THREE.CubeTextureLoader();
cubeLoader.setPath('textures/');
var textureCube = cubeLoader.load(imgArray);


let ground = new THREE.SphereGeometry(ground_radius, 64, 32);
let materialOne = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0,
  metalness: 1,
  envMap: textureCube,
});
let groundMesh = new THREE.Mesh(ground, materialOne);
scene.add(groundMesh);
groundMesh.position.set(0, 0, 0);

// randomly generate 100 buildings
for (let i = 0; i < 100; i++) {
  let x = Math.random() * 2 * Math.PI;
  let y = Math.random() * 2 * Math.PI;
  // make building stay together
  let z = Math.random() * 2 * Math.PI;

  let buildingHeight = Math.random(0, 1) * 30 + 20 + ground_radius;

  let building = new THREE.BoxGeometry(
    Math.random() * 4 + 4,
    buildingHeight * 2,
    Math.random() * 4 + 4
  );
  

  let buildingMesh = new THREE.Mesh(building, materialOne);
  scene.add(buildingMesh);
  buildingMesh.position.set(0, 0, 0);
  buildingMesh.rotation.set(x, y, z);
}




function loop() {
  // update camera position and direction
  updateCamera();

  // render the scene
  renderer.render(scene, camera);

  // rinse and repeat
  window.requestAnimationFrame(loop);
}

loop();




function updateCamera() {
  currentAngle += rotateSpeed;

  // if (currentAngle % (Math.PI * 2) > Math.PI) {
  //   camera.up.set(0, -1, 0);
  // } else {
  //   camera.up.set(0, 1, 0);
  // }
  
  camera.up.set(0, 0, 0);

  camera_pos.x = (ground_radius + height) * Math.cos(currentAngle);
  camera_pos.y = (ground_radius + height) * Math.sin(currentAngle);
  camera.position.set(camera_pos.x, camera_pos.y, camera_pos.z);

  let addAngle = Math.atan(view_length / (ground_radius + height));
  let longRadius = Math.sqrt(
    Math.pow(view_length, 2) + Math.pow(ground_radius + 1, 2)
  );

  camera_look.x = longRadius * Math.cos(currentAngle + addAngle);
  camera_look.y = longRadius * Math.sin(currentAngle + addAngle);
  camera.lookAt(camera_look.x, camera_look.y, camera_look.z);
}
