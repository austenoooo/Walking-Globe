import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// in order to use an HDR image, we need to first load the RGBELoader
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';



// define movement/ratio parameters
const ground_radius = 400; // radius of the ground sphere
const view_length = 80; // the length of the tangent line (viewpoint)
const height = 4; // height of the camera to the groud surface
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
let rotateSpeed = Math.PI / 2000; // rotation speed


let scene, camera, renderer;
// material
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
    camera.position.set(500, 500, 500);
    camera.lookAt(0, 0, 0);

    
    // camera.position.set(camera_pos.x, camera_pos.y, camera_pos.z);
    // camera.lookAt(camera_look.x, camera_look.y, camera_look.z);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // helper functions
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add(axesHelper);

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
    buildingNormal.repeat.set(1, 1);

    buildingRoughness.wrapS = THREE.RepeatWrapping;
    buildingRoughness.wrapT = THREE.RepeatWrapping;
    buildingRoughness.repeat.set(1, 1);

    buildingHeight.wrapS = THREE.RepeatWrapping;
    buildingHeight.wrapT = THREE.RepeatWrapping;
    buildingHeight.repeat.set(1, 1);

    materialReflective = new THREE.MeshPhysicalMaterial({
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
        // transparent: true,
        // opacity: 0.9,
        reflectivity: 0.5,
        map: groundTexture,
        specularIntensityMap: groundSpec,
    });


    // create ground
    groundMesh = new THREE.Mesh(new THREE.SphereGeometry(ground_radius, 64, 32), materialGround);
    scene.add(groundMesh);
    groundMesh.position.set(0, 0, 0);
    //declared once at the top of your code
    let axis = new THREE.Vector3(1, 0, 0);//tilted a bit on x
    //in your update/draw function
    groundMesh.rotateOnAxis(axis, Math.PI / 2);

    // create buildings
    // randomly generate 100 box as buildings
    // for (let i = 0; i < 100; i++) {
    //     let x = Math.random() * 2 * Math.PI;
    //     let y = Math.random() * 2 * Math.PI;
    //     let z = Math.random() * 2 * Math.PI;
    //     let buildingHeight = Math.random(0, 1) * 30 + 20 + ground_radius;
        
    //     let building = new THREE.BoxGeometry(
    //         Math.random() * 4 + 4,
    //         buildingHeight * 2,
    //         Math.random() * 4 + 4
    //     );
    //     let buildingMesh = new THREE.Mesh(building, materialReflective);
    //     scene.add(buildingMesh);

    //     buildingMesh.position.set(0, 0, 0);
    //     buildingMesh.rotation.set(x, y, z);

    //     buildings.push(buildingMesh);
    // }


    // test out building model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'jsm/libs/draco/gltf/' );

    

    const loader = new GLTFLoader();
    loader.setDRACOLoader( dracoLoader );
    for (var n = 0; n < 100; n++){
        loader.load( './models/building.glb', function (gltf) {
            const model = gltf.scene;
            model.traverse((o) => {
                if (o.isMesh) o.material = materialReflective;
            });

            // change the origin of each building model to be (0,0,0)
            let pivot = new THREE.Group();
            pivot.position.set(0, 0, 0);
    
            let xRotate = Math.random() * 2 * Math.PI;
            let yRotate = Math.random() * 2 * Math.PI;
            let zRotate = Math.random() * 2 * Math.PI;
    
            // scale dimension x0.5-x1.5
            let xScale = 0.3 + Math.random();
            let yScale = 1.5 + Math.random();
            let zScale = 0.3 + Math.random();
    
            let newBuilding = model;
    
            buildings.push(newBuilding);
            // make the origin of rotation to be the senter of the sphere
            pivot.add(newBuilding);
    
            newBuilding.position.y = ground_radius - 10;
            newBuilding.scale.set(xScale, yScale, zScale);

            pivot.rotation.set(xRotate, yRotate, zRotate);

             // adding pivot point to the scene;
            scene.add(pivot);
        
    
        }, undefined, function (e) {
            console.error(e);
        } );
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

//   trying to figure out how to adjust camera angle
//   TODO: the view will be flipped upside down for a very short slipt of second for some reasons...
//   if (currentAngle % (Math.PI * 2) >= Math.PI) {
//     camera.up.set(0, -1, 0);
//   } else {
//     camera.up.set(0, 1, 0);
//   }
  
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