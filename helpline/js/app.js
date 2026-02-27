// ===============================
// NATIONAL HELPLINES DATA
// ===============================
// Already loaded from data.js as nationalHelplines

// ===============================
// ICONS FOR HELPLINE CARDS
// ===============================
const helplineIcons = {
    emergency: "🚨",
    police: "👮‍♂️",
    ambulance: "🚑",
    fire: "🔥",
    women: "♀️",
    child: "🧒",
    cybercrime: "💻",
    disaster: "🌪️",
    senior: "🧓"
};

// ===============================
// KEYWORDS FOR SEARCH + FUZZY MATCH
// ===============================
const keywords = {
    emergency: ["help", "emergency", "save me", "danger"],
    police: ["police", "cop", "crime", "attack", "robbery"],
    ambulance: ["ambulance", "hospital", "accident", "injury", "bleeding"],
    fire: ["fire", "burn", "smoke"],
    women: ["women", "woman", "harassment", "domestic violence"],
    child: ["child", "kid", "missing child", "child abuse"],
    cybercrime: ["cyber", "online fraud", "scam", "upi fraud"],
    disaster: ["flood", "earthquake", "disaster"],
    senior: ["senior", "elder", "old age"]
};

// ===============================
// TRIGGER CALL BUTTON
// ===============================
let countdownTimer = null;
function triggerCall(number, type, auto = false) {
    if (!auto) {
        document.getElementById("result").innerHTML =
            `<a href="tel:${number}" class="call-btn">
                📞 Call ${type.toUpperCase()} (${number})
            </a>`;
        return;
    }

    let seconds = 3;
    document.getElementById("result").innerHTML = `
        <div class="countdown-box">
            🚨 Calling ${type.toUpperCase()} in 
            <span id="countdown">${seconds}</span> seconds...
            <br><br>
            <button onclick="cancelAutoCall()">Cancel</button>
        </div>
    `;

    countdownTimer = setInterval(() => {
        seconds--;
        document.getElementById("countdown").innerText = seconds;
        if (seconds <= 0) {
            clearInterval(countdownTimer);
            window.location.href = `tel:${number}`;
        }
    }, 1000);
}

function cancelAutoCall() {
    clearInterval(countdownTimer);
    document.getElementById("result").innerHTML = "<p>Call cancelled.</p>";
}

// ===============================
// LEVENSHTEIN DISTANCE FOR FUZZY MATCH
// ===============================
function getSimilarity(a, b) {
    const distance = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
}
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
            );
        }
    }
    return matrix[b.length][a.length];
}

// ===============================
// GPS LOCATION
// ===============================
function getUserLocation(callback) {
    if (!navigator.geolocation) { callback(null); return; }
    navigator.geolocation.getCurrentPosition(
        function(position){
            callback({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        function() { callback(null); }
    );
}

// ===============================
// NEAREST POLICE / HOSPITAL
// ===============================
function openNearest(type) {
    window.open(`https://www.google.com/maps/search/nearest+${type}`, "_blank");
}

// ===============================
// VOICE INPUT
// ===============================
function startVoice() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-IN";
    recognition.start();
    recognition.onresult = function(event) {
        document.getElementById("searchInput").value = event.results[0][0].transcript;
        detectEmergency();
    };
}

// ===============================
// SHOW CRITICAL EMERGENCY BUTTONS
// ===============================
function showCriticalButtons() {
    const container = document.getElementById("criticalButtons");
    container.innerHTML = "";
    const critical = ["emergency","police","ambulance","fire"];
    for (let key of critical) {
        const btn = document.createElement("button");
        btn.innerText = `${helplineIcons[key]} ${key.toUpperCase()} - ${nationalHelplines["All India"][key]}`;
        btn.onclick = () => { window.location.href = `tel:${nationalHelplines["All India"][key]}`; };
        container.appendChild(btn);
    }
}

// ===============================
// SHOW ALL INDIA HELPLINE CARDS
// ===============================
function showAllIndiaHelplines() {
    const container = document.getElementById("nationalHelplines");
    const helplines = nationalHelplines["All India"];
    container.innerHTML = "";
    for (const [service, number] of Object.entries(helplines)) {
        const div = document.createElement("div");
        div.className = "call-card";
        if (["emergency","police","ambulance","fire"].includes(service)) div.classList.add("critical");
        div.setAttribute("data-service", service.toLowerCase());
        div.innerHTML = `<span class="icon">${helplineIcons[service] || "☎️"}</span>
                         <strong>${service.toUpperCase()}</strong><br>${number}`;
        container.appendChild(div);
    }
}

// ===============================
// HIGHLIGHT HELPLINE CARD
// ===============================
function highlightCard(service) {
    service = service.toLowerCase();
    document.querySelectorAll(".call-card").forEach(card => {
        if (card.getAttribute("data-service") === service) {
            card.style.boxShadow = "0 0 20px #f1c40f";
            card.scrollIntoView({behavior:"smooth", block:"center"});
            setTimeout(()=>{ card.style.boxShadow = ""; }, 2000);
        }
    });
}

// ===============================
// DETECT EMERGENCY (SEARCH LOGIC)
// ===============================
function detectEmergency() {
    let input = document.getElementById("searchInput").value.toLowerCase().trim();
    let bestMatch = "emergency"; 
    let highestScore = 0;

    for (let service in keywords) {
        for (let word of keywords[service]) {
            if (input.includes(word)) { bestMatch = service; highestScore = 1; break; }
            let score = getSimilarity(input, word);
            if (score > highestScore) { highestScore = score; bestMatch = service; }
        }
    }

    // highlight the corresponding card
    highlightCard(bestMatch);

    // Get GPS and trigger call
  getUserLocation(function(location){
    let number = nationalHelplines["All India"][bestMatch];

    if (location) {
        const message =
            "Emergency detected: " + bestMatch +
            "\nLocation: https://maps.google.com/?q=" +
            location.lat + "," + location.lon;

        const contact = "91XXXXXXXXXX"; // trusted contact
        window.location.href =
            "sms:" + contact + "?body=" + encodeURIComponent(message);
    }

    if (highestScore > 0.8)
        triggerCall(number, bestMatch, true);
    else
        triggerCall(number, bestMatch, false);
});
}

// ===============================
// ENTER KEY SUPPORT & AUTO SEARCH
// ===============================
document.addEventListener("DOMContentLoaded", function(){
    const input = document.getElementById("searchInput");

    input.addEventListener("keypress", function(event){
        if(event.key === "Enter"){ event.preventDefault(); detectEmergency(); }
    });

    input.addEventListener("input", function(){
        if(input.value.trim().length > 1) detectEmergency();
    });
});

// ===============================
// INITIALIZE PAGE
// ===============================
document.addEventListener("DOMContentLoaded", function(){
    showCriticalButtons();
    showAllIndiaHelplines();
});
function activatePanic() {
    getUserLocation(function(location) {
        if (!location) {
            alert("Location not available");
            return;
        }

        const message =
            "🚨 EMERGENCY! I need help.\n" +
            "My location: https://maps.google.com/?q=" +
            location.lat + "," + location.lon;

        const phone = "91XXXXXXXXXX"; // Put trusted contact number here

        // 🔴 ADD THIS BLOCK HERE
        if (!navigator.onLine) {
            saveOfflineEmergency({ phone: phone, message: message });
            alert("No network. Will auto-send when back online.");
            return;
        }

        // If online → send SMS immediately
        window.location.href =
            "sms:" + phone + "?body=" + encodeURIComponent(message);
    });
}

function saveOfflineEmergency(data) {
    localStorage.setItem("pendingEmergency", JSON.stringify(data));
}

function checkPendingEmergency() {
    const data = localStorage.getItem("pendingEmergency");
    if (data && navigator.onLine) {
        const emergency = JSON.parse(data);
        window.location.href =
            "sms:" + emergency.phone +
            "?body=" + encodeURIComponent(emergency.message);
        localStorage.removeItem("pendingEmergency");
    }
}

window.addEventListener("online", checkPendingEmergency);