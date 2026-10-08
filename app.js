// 1. FIREBASE CONFIG
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

// 2. GEMINI API KEY
const GEMINI_API_KEY = "AQ.Ab8RN6LTxUX14Qh_IZp21wHetIOCQBukUhwiN0n7cj7iRl_KJA";
let currentRoom = "";
let currentRole = "";

// 3. HOST ROOM & GENERATE CASE
async function hostNewRoom() {
    currentRoom = Math.floor(1000 + Math.random() * 9000).toString(); 
    currentRole = "Prosecutor";
    alert(`Naya Room Ban Gaya! Code hai: ${currentRoom}. Game start ho raha hai...`);

    // AI API ki jagah humne ek fix Offline Case daal diya hai
    const dummyCaseDetails = {
      title: "The Digital Heist",
      police_report: "Raat 2 baje bank ka server hack hua aur $5M gayab ho gaye. Police ne server admin ko arrest kiya hai.",
      prosecutor_evidences: ["Server Logs me admin ka IP", "Admin ke account me $50k transfer"],
      defense_evidences: ["Admin us waqt public wifi par tha", "Admin ke laptop me Trojan Virus mila"]
    };

    try {
        // Seedha Firebase me case save karo aur room join karo (No API Call)
        await db.ref('courtrooms/' + currentRoom + '/case_details').set(dummyCaseDetails);
        joinRoom(currentRoom, currentRole);
    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Firebase me connect karne me error aayi!");
    }
}
        
        const data = await response.json();
        
        // Agar API fail hoti hai toh ye chalega
        if (!data.candidates) {
            console.error("API Error Response:", data);
            alert("API se data nahi aaya! Console me error detail check karo.");
            return;
        }

        let rawJson = data.candidates[0].content.parts[0].text;
        rawJson = rawJson.replace(/```json|```/g, "").trim();
        const caseDetails = JSON.parse(rawJson);

        await db.ref('courtrooms/' + currentRoom + '/case_details').set(caseDetails);
        joinRoom(currentRoom, currentRole);
    } catch (error) {
        console.error("FULL ERROR DETAILS:", error);
        alert("Case banne me problem aayi! Browser console check karo (Right Click > Inspect > Console).");
    }
}

// 4. JOIN ROOM LOGIC
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

    // Case Details Download & Show
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

// 5. SEND MESSAGE LOGIC
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

// 6. AI JUDGE LOGIC
async function callVerdict() {
    alert("AI Judge faisla soch raha hai... kripya pratiksha karein!");
    
    db.ref('courtrooms/' + currentRoom + '/arguments').once('value', async (snapshot) => {
        let chatHistory = "Court Transcript:\n";
        snapshot.forEach((child) => {
            chatHistory += `${child.val().role}: ${child.val().text}\n`;
        });

        const prompt = `Act as an AI Judge. Read this chat history of a courtroom game. Decide who won based on logic. 
        Return ONLY a JSON object: {"winner": "Prosecutor or Defense", "reason": "Short reason"}.
        History: ${chatHistory}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const data = await response.json();
            let rawJson = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
            const verdictData = JSON.parse(rawJson);

            alert(`VERDICT: ${verdictData.winner} WINS!\n\nReason: ${verdictData.reason}`);
        } catch(e) {
            alert("Judge is currently unavailable. Console me error check karein!");
            console.error(e);
        }
    });
}
