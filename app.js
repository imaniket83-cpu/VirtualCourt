// 1. FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCz9JOBFR95P9t0cjeT-WYbd90qEBkqRHU",
  authDomain: "virtualcourt.firebaseapp.com",
  databaseURL: https://virtualcourt-default-rtdb.firebaseio.com/
  projectId: "virtualcourt",
  storageBucket: "virtualcourt.firebasestorage.app",
  messagingSenderId: "265909339916",
  appId: "1:265909339916:web:66401e1630f014a7b46b29"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentRoom = "";
let currentRole = "";

// 2. HOST ROOM (Offline Dummy Case)
async function hostNewRoom() {
    currentRoom = Math.floor(1000 + Math.random() * 9000).toString(); 
    currentRole = "Prosecutor";
    alert(`Naya Room Ban Gaya! Code hai: ${currentRoom}. Game start ho raha hai...`);

    const dummyCaseDetails = {
      title: "The Digital Heist",
      police_report: "Raat 2 baje bank ka server hack hua aur $5M gayab ho gaye. Police ne server admin ko arrest kiya hai.",
      prosecutor_evidences: ["Server Logs me admin ka IP", "Admin ke account me $50k transfer"],
      defense_evidences: ["Admin us waqt public wifi par tha", "Admin ke laptop me Trojan Virus mila"]
    };

    try {
        await db.ref('courtrooms/' + currentRoom + '/case_details').set(dummyCaseDetails);
        joinRoom(currentRoom, currentRole);
    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Firebase me connect karne me error aayi!");
    }
}

// 3. JOIN ROOM LOGIC
function joinExistingRoom() {
    const code = prompt("Room Code daaliye (4-digits):");
    if (code && code.length === 4) {
        currentRoom = code;
        currentRole = "Defense";
        joinRoom(currentRoom, currentRole);
    }
}

function joinRoom(roomCode, role) {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('room-display').innerText = `Room Code: ${roomCode} | Your Role: ${role}`;

    // Show Case Briefing
    db.ref('courtrooms/' + roomCode + '/case_details').once('value', (snapshot) => {
        const caseData = snapshot.val();
        if(caseData) {
            alert(`CASE BRIEFING:\n\nTitle: ${caseData.title}\n\nReport: ${caseData.police_report}`);
        }
    });

    // Sync Chat Live
    db.ref('courtrooms/' + roomCode + '/arguments').on('child_added', (snapshot) => {
        const msg = snapshot.val();
        addMessageToUI(msg.role, msg.text);
    });
}

// 4. SEND MESSAGE LOGIC
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    db.ref('courtrooms/' + currentRoom + '/arguments').push({
        role: currentRole,
        text: text,
        timestamp: Date.now()
    });
    input.value = '';
}

function addMessageToUI(role, text) {
    const msgDiv = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `msg ${role.toLowerCase()}`;
    div.innerHTML = `<strong>${role}:</strong><br>${text}`;
    msgDiv.appendChild(div);
    msgDiv.scrollTop = msgDiv.scrollHeight;
}

// 5. JUDGE VERDICT (Offline Bypass)
function callVerdict() {
    alert("Judge faisla soch raha hai... kripya pratiksha karein!");
    
    // API bypass karke direct offline result taaki game test ho sake
    setTimeout(() => {
        alert("VERDICT: PROSECUTOR WINS!\n\nReason: Saboot saaf ishara karte hain ki admin ka account hack me istemal hua tha, aur public wifi ka excuse kafi nahi hai.");
    }, 2000);
}
