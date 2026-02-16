
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/PointerLockControls.js';

const canvas = document.getElementById('gameCanvas');
const menu = document.getElementById('menu');
const playBtn = document.getElementById('playBtn');
const weaponSelect = document.getElementById('weaponSelect');
const hud = document.getElementById('hud');
const scoreDiv = document.getElementById('score');
const killsDiv = document.getElementById('kills');
const respawnMenu = document.getElementById('respawnMenu');
const respawnBtn = document.getElementById('respawnBtn');

let selectedWeapon = null;
let playerAlive = true;
let score = 0;
let kills = 0;

// =======================
// SCENE SETUP
// =======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,2,10);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);

// LIGHT
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-10,20,10);
scene.add(dirLight);

// =======================
// CONTROLS
// =======================
const controls = new PointerLockControls(camera, document.body);

document.body.addEventListener('click', ()=>{
    if(selectedWeapon && playerAlive) controls.lock();
});

const move = { forward:0, backward:0, left:0, right:0 };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

document.addEventListener('keydown', e=>{
    switch(e.code){
        case "KeyW": move.forward=1; break;
        case "KeyS": move.backward=1; break;
        case "KeyA": move.left=1; break;
        case "KeyD": move.right=1; break;
    }
});
document.addEventListener('keyup', e=>{
    switch(e.code){
        case "KeyW": move.forward=0; break;
        case "KeyS": move.backward=0; break;
        case "KeyA": move.left=0; break;
        case "KeyD": move.right=0; break;
    }
});

// =======================
// LOAD MODELS
// =======================
const loader = new GLTFLoader();
const mixers = [];
const clock = new THREE.Clock();

const modelFiles = [
    { file:'model/map.glb', name:'Map' },
    { file:'model/hands.glb', name:'Hands' },
    { file:'model/sniper.glb', name:'Sniper' },
    { file:'model/ak47.glb', name:'AK47' },
    { file:'model/mp40.glb', name:'MP40' }
];

const models = {};

modelFiles.forEach(obj=>{
    loader.load(obj.file, gltf=>{
        const model = gltf.scene;
        scene.add(model);
        models[obj.name] = model;
        model.visible = (obj.name==='Map'); // Map langsung terlihat

        // Animasi jika ada
        if(gltf.animations && gltf.animations.length>0){
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip=>{
                mixer.clipAction(clip).play();
            });
            mixers.push(mixer);
        }
    }, undefined, error=>{console.error(error);});
});

// =======================
// FLOOR fallback
const floorGeo = new THREE.PlaneGeometry(200,200);
const floorMat = new THREE.MeshStandardMaterial({color:0x228B22});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// =======================
// PLAY BUTTON / WEAPON SELECTION
playBtn.addEventListener('click', ()=>{
    playBtn.style.display = 'none';
    weaponSelect.style.display = 'block';
});

weaponSelect.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
        selectedWeapon = btn.dataset.weapon;
        weaponSelect.style.display = 'none';
        canvas.style.display = 'block';
        hud.style.display = 'block';
        spawnPlayer();
    });
});

function spawnPlayer(){
    playerAlive = true;
    // Spawn ujung map random
    const spawnPoints = [
        [-90,2,-90],
        [90,2,90],
        [-90,2,90],
        [90,2,-90]
    ];
    const sp = spawnPoints[Math.floor(Math.random()*spawnPoints.length)];
    camera.position.set(sp[0], sp[1], sp[2]);

    // Tampilkan senjata di tangan
    for(let key in models){
        if(key.includes('Hands') || key.toLowerCase() === selectedWeapon){
            models[key].visible = true;
            models[key].position.set(camera.position.x, camera.position.y, camera.position.z);
        } else {
            if(models[key]) models[key].visible = false;
        }
    }
}

// =======================
// SIMULASI PLAYER MATI
function playerDie(){
    playerAlive = false;
    respawnMenu.style.display = 'flex';
    canvas.style.display = 'none';
}

// Tombol respawn
respawnBtn.addEventListener('click', ()=>{
    respawnMenu.style.display = 'none';
    canvas.style.display = 'block';
    spawnPlayer();
});

// =======================
// SIMULASI KILL (untuk demo)
function addKill(){
    kills++;
    killsDiv.innerText = "Kills: "+kills;
    score += 100;
    scoreDiv.innerText = "Score: "+score;
}

// =======================
// ANIMATE LOOP
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    mixers.forEach(m=>m.update(delta));

    if(controls.isLocked && playerAlive){
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = move.forward - move.backward;
        direction.x = move.right - move.left;
        direction.normalize();

        if(move.forward || move.backward) velocity.z -= direction.z * 50.0 * delta;
        if(move.left || move.right) velocity.x -= direction.x * 50.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    renderer.render(scene, camera);
}
animate();

// =======================
// RESIZE
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
