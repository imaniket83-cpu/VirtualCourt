// ==========================================
// 1. CONFIGURATIONS
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCz9JOBFR95P9t0cjeT-WYbd90qEBkqRHU",
  authDomain: "virtualcourt.firebaseapp.com",
  databaseURL: "https://virtualcourt-default-rtdb.firebaseio.com",
  projectId: "virtualcourt",
  storageBucket: "virtualcourt.firebasestorage.app",
  messagingSenderId: "265909339916",
  appId: "1:265909339916:web:66401e1630f014a7b46b29"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Tumhari Gemini API Key (Note: Agar error aaye toh ensure karna ki key 'AIza' se shuru ho)
const GEMINI_API_KEY = "AQ.Ab8RN6I0zkNys6g1sl5IZ7LnG0DZ_erhhsw2mjdZBZXWHcTW-w"; 
let currentRoom = "";
let currentRole = "";

// ==========================================
// 2. ROOM & AI CASE GENERATION
// ==========================================
async function hostNewRoom() {
    currentRoom = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
    currentRole = "Prosecutor";
    alert(`Naya Room Ban Gaya! Code hai: ${currentRoom}. Case generate ho raha hai...`);

    // AI se naya case banwana
    const prompt = `Create a short fictional crime case for a 2-player courtroom game. 
    Return ONLY a raw JSON object with no markdown formatting. Structure:
    {
      "title": "Case Name",
      "police_report": "Short 2 line FIR",
      "prosecutor_evidences": ["Ev 1", "Ev 2"],
      "defense_evidences": ["Ev 1", "Ev 2"]
    }`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        
        // JSON clean karke parse karna
        let rawJson = data.candidates[0].content.parts[0].text;
        rawJson = rawJson.replace(/```json|```/g, "").trim();
        const caseDetails = JSON.parse(rawJson);

        // Firebase me case save karna
        db.ref('courtrooms/' + currentRoom + '/case_details').set(caseDetails);
        joinRoom(currentRoom, currentRole);
    } catch (error) {
        console.error("AI Case Generation Failed:", error);
        alert("Case banne me error aayi. API key check karein.");
    }
}

function joinExistingRoom() {
    const code = prompt("Room Code daaliye (4-digits):");
    if (code && code.length === 4) {
        currentRoom = code;
        currentRole = "Defense";
        joinRoom(currentRoom, currentRole);
    }
}

function joinRoom(roomCode, role) {
    // Screen switch logic (Apne HTML ke hisaab se id adjust karein)
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    // Case Details UI me load karna
    db.ref('courtrooms/' + roomCode + '/case_details').once('value', (snapshot) => {
        const caseData = snapshot.val();
        if(caseData) {
            alert(`CASE BRIEFING:\nTitle: ${caseData.title}\nReport: ${caseData.police_report}`);
            // Console me evidences print kar rahe hain, inko UI bag me map kiya ja sakta hai
            console.log("Your Evidences:", role === "Prosecutor" ? caseData.prosecutor_evidences : caseData.defense_evidences);
        }
    });

    // Live Messages Sync
    db.ref('courtrooms/' + roomCode + '/arguments').on('child_added', (snapshot) => {
        const msg = snapshot.val();
        addMessageToUI(msg.role, msg.text);
    });
}

// ==========================================
// 3. CHAT & GAMEPLAY LOGIC
// ==========================================
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Firebase me bhejna
    db.ref('courtrooms/' + currentRoom + '/arguments').push({
        role: currentRole,
        text: text,
        timestamp: Date.now()
    });
    input.value = '';
}

function addMessageToUI(role, text) {
    // HTML me <div id="messages"></div> hona chahiye
    const msgDiv = document.getElementById('messages');
    if(!msgDiv) return;

    const align = (role === currentRole) ? "right" : "left";
    const color = (role === "Prosecutor") ? "#ff4d4d" : "#4da6ff";
    
    msgDiv.innerHTML += `<div style="text-align: ${align}; color: ${color}; margin: 5px;">
        <strong>${role}:</strong> ${text}
    </div>`;
    msgDiv.scrollTop = msgDiv.scrollHeight;
}

// ==========================================
// 4. AI JUDGE VERDICT
// ==========================================
async function callVerdict() {
    alert("AI Judge faisla soch raha hai...");
    
    // Firebase se saari chat history nikalna
    db.ref('courtrooms/' + currentRoom + '/arguments').once('value', async (snapshot) => {
        let chatHistory = "Court Transcript:\n";
        snapshot.forEach((child) => {
            chatHistory += `${child.val().role}: ${child.val().text}\n`;
        });

        const prompt = `Act as an AI Judge. Read this chat history of a courtroom game. Decide who won based on logic. 
        Return ONLY a JSON object: {"winner": "Prosecutor or Defense", "reason": "Short reason"}.
        History: ${chatHistory}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        let rawJson = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const verdictData = JSON.parse(rawJson);

        alert(`VERDICT: ${verdictData.winner} WINS!\nReason: ${verdictData.reason}`);
    });
}