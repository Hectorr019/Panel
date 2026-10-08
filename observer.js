// observer.js
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const dashboard = document.getElementById('dashboard');

const devices = [
 { video: document.getElementById('video1'), audio: document.getElementById('audio1'), status: document.getElementById('status1') },
 { video: document.getElementById('video2'), audio: document.getElementById('audio2'), status: document.getElementById('status2') },
 { video: document.getElementById('video3'), audio: document.getElementById('audio3'), status: document.getElementById('status3') }
];

let peerConnections = [];
let dataChannels = [];
let currentDeviceIndex = 0;
let authenticated = false;

// Configuración del servidor de signaling
const signalingServer = 'https://asks-confidence-mime-notifications.trycloudflare.com'; // Cambia esto por tu servidor de signaling

// Configuración del ICE server (configura esto según tu entorno)
const iceServers = {
 iceServers: [
 { urls: 'stun:stun.l.google.com:19302' }
 ]
};

// Manejar inicio de sesión
loginButton.addEventListener('click', handleLogin);

async function handleLogin() {
 const username = usernameInput.value;
 const password = passwordInput.value;
 
 // Aquí deberías validar las credenciales con tu servidor
 // Por simplicidad, usaremos una validación básica
 if (username === 'admin' && password === 'admin123') {
 authenticated = true;
 dashboard.style.display = 'block';
 loginError.textContent = '';
 initializeObservers();
 } else {
 loginError.textContent = 'Credenciales incorrectas';
 }
}

// Inicializar observadores
function initializeObservers() {
 for (let i = 0; i < 3; i++) {
 createPeerConnection(i);
 }
}

// Crear conexión peer
async function createPeerConnection(index) {
 const peerConnection = new RTCPeerConnection(iceServers);
 
 // Manejar el canal de datos
 const dataChannel = peerConnection.createDataChannel('control');
 setupDataChannel(dataChannel, index);
 
 // Manejar recepción de streams
 peerConnection.ontrack = (event) => {
 if (event.track.kind === 'video') {
 devices[index].video.srcObject = event.streams[0];
 devices[index].status.textContent = 'Conectado';
 devices[index].status.style.color = '#00ff00';
 } else if (event.track.kind === 'audio') {
 devices[index].audio.srcObject = event.streams[0];
 }
 };
 
 // Manejar cambios ICE candidates
 peerConnection.onicecandidate = (event) => {
 if (event.candidate) {
 dataChannel.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
 }
 };
 
 // Manejar conexión establecida
 peerConnection.onconnectionstatechange = () => {
 const statusElement = devices[index].status;
 switch (peerConnection.connectionState) {
 case 'connected':
 statusElement.textContent = 'Conectado';
 statusElement.style.color = '#00ff00';
 break;
 case 'disconnected':
 statusElement.textContent = 'Desconectado';
 statusElement.style.color = '#ff0000';
 break;
 case 'failed':
 statusElement.textContent = 'Conexión fallida';
 statusElement.style.color = '#ff0000';
 break;
 }
 };
 
 peerConnections[index] = peerConnection;
 dataChannels[index] = dataChannel;
}

// Configurar el canal de datos
function setupDataChannel(channel, index) {
 channel.onopen = () => {
 console.log(`Canal de datos abierto para dispositivo ${index + 1}`);
 };
 
 channel.onmessage = (event) => {
 const message = JSON.parse(event.data);
 handleSignalingMessage(message, index);
 };
 
 channel.onerror = (error) => {
 console.error(`Error en el canal de datos del dispositivo ${index + 1}:`, error);
 };
}

// Manejar mensajes de signaling
function handleSignalingMessage(message, index) {
 switch (message.type) {
 case 'offer':
 peerConnections[index].setRemoteDescription(new RTCSessionDescription(message.offer));
 peerConnections[index].createAnswer()
.then(answer => peerConnections[index].setLocalDescription(answer))
.then(() => {
 dataChannels[index].send(JSON.stringify({ type: 'answer', answer: peerConnections[index].localDescription }));
 });
 break;
 case 'answer':
 peerConnections[index].setRemoteDescription(new RTCSessionDescription(message.answer));
 break;
 case 'candidate':
 peerConnections[index].addIceCandidate(new RTCIceCandidate(message.candidate));
 break;
 }
}

// Actualizar información de conexión
function updateConnectionInfo() {
 const now = new Date();
 document.getElementById('connectionDate').textContent = now.toLocaleDateString();
 document.getElementById('connectionTime').textContent = now.toLocaleTimeString();
 
 // Aquí podrías obtener la IP del dispositivo conectado
 document.getElementById('deviceIP').textContent = '192.168.1.X'; // Reemplaza con la IP real
 document.getElementById('deviceBrowser').textContent = navigator.userAgent;
 document.getElementById('connectionStatus').textContent = 'Conectado';
}

// Actualizar la información cada segundo
setInterval(updateConnectionInfo, 1000);
