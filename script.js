import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// in order to use an HDR image, we need to first load the RGBELoader
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";


// define movement/ratio parameters
const ground_radius = 200; // radius of the ground sphere
const view_length = 20; // the length of the tangent line (viewpoint)
const height = 2; // height of the camera to the groud surface
let camera_pos = {
  x: ground_radius + height,
  y: 0,
  z: 0,
}; // camera position
let camera_look = {
  x: 0,
  y: view_length,
  z: 0,
}; // camera look at
let currentAngle = 0; // starting rotation angle
let rotateSpeed = Math.PI / 4800; // rotation speed


let scene, camera, renderer;
// materail
let materialReflective, materialGround;
// geometry
let groundMesh;
let buildings = [];
// texture
let skyTexture;

// build the scene
function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
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

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // helper functions
    // add orbit control
    let controls = new OrbitControls(camera, renderer.domElement);

    // add skybox and environment map
    environmentMap();

    // add geometry
    createGeometry();

    loop();
}


function environmentMap(){

    let loader = new RGBELoader();
    loader.load("./textures/environment.hdr", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        skyTexture = texture;
        scene.background = skyTexture;
    });

}


function createGeometry(){
    // create material

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
    cubeLoader.setPath('./textures/');
    var textureCube = cubeLoader.load(imgArray);

    // create a texture loader:
    let textureLoader = new THREE.TextureLoader();

    let buildingNormal = textureLoader.load("./textures/010_normal.jpg");
    let buildingRoughness = textureLoader.load("./textures/010_roughness.jpg");
    let buildingHeight = textureLoader.load("./textures/010_height.png");
    let buildingAmbient = textureLoader.load("./textures/010_ambientOcclusion.jpg");

    buildingNormal.wrapS = THREE.RepeatWrapping;
    buildingNormal.wrapT = THREE.RepeatWrapping;
    buildingNormal.repeat.set(1, 30);

    buildingRoughness.wrapS = THREE.RepeatWrapping;
    buildingRoughness.wrapT = THREE.RepeatWrapping;
    buildingRoughness.repeat.set(1, 30);

    buildingHeight.wrapS = THREE.RepeatWrapping;
    buildingHeight.wrapT = THREE.RepeatWrapping;
    buildingHeight.repeat.set(1, 30);

    materialReflective = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0,
        metalness: 1,
        envMap: textureCube,
        transparent: true,
        opacity: 0.5,
        reflectivity: 1,
        normalMap: buildingNormal,
        roughnessMap: buildingRoughness,
        displacementMap: buildingHeight,
        displacementScale: 0
    });

    
    let groundTexture = textureLoader.load("./textures/Ice_001_COLOR.jpg");
    let groundSpec = textureLoader.load("./textures/Ice_001_SPEC.jpg")

    // change the texture parameters
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50);

    groundSpec.wrapS = THREE.RepeatWrapping;
    groundSpec.wrapT = THREE.RepeatWrapping;
    groundSpec.repeat.set(50, 50);

    materialGround = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0,
        metalness: 1,
        envMap: textureCube,
        transparent: true,
        opacity: 0.8,
        reflectivity: 1,
        map: groundTexture,
        specularMap: groundSpec,
    });


    // create ground
    groundMesh = new THREE.Mesh(new THREE.SphereGeometry(ground_radius, 64, 32), materialGround);
    scene.add(groundMesh);
    groundMesh.position.set(0, 0, 0);

    // create buildings
    // randomly generate 100 box as buildings
    for (let i = 0; i < 100; i++) {
        let x = Math.random() * 2 * Math.PI;
        let y = Math.random() * 2 * Math.PI;
        let z = Math.random() * 2 * Math.PI;
        let buildingHeight = Math.random(0, 1) * 30 + 20 + ground_radius;
        
        let building = new THREE.BoxGeometry(
            Math.random() * 4 + 4,
            buildingHeight * 2,
            Math.random() * 4 + 4
        );
        let buildingMesh = new THREE.Mesh(building, materialReflective);
        scene.add(buildingMesh);

        buildingMesh.position.set(0, 0, 0);
        buildingMesh.rotation.set(x, y, z);

        buildings.push(buildingMesh);
    }
}






function loop() {
  // update camera position and direction
  updateCamera();

  // render the scene
  renderer.render(scene, camera);

  // rinse and repeat
  window.requestAnimationFrame(loop);
}



// rotate camera and make the camera rotate around the sphere
function updateCamera() {
  currentAngle += rotateSpeed;

  // trying to figure out how to adjust camera angle
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

init();