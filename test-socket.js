const { io } = require("socket.io-client");

// ==========================================
// 1. CONFIGURATION
// ==========================================
const STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6IlN0dWRlbnQiLCJpbnN0aXR1dGVfaWQiOjEsImlhdCI6MTc3NjUyNzE5MywiZXhwIjoxNzc3MTMxOTkzfQ.r1fqRC07NuGZr1Z_dpY55dsPel-9ZKWax_8j6YqyO6Y";
const APPOINTMENT_ID = 1; // Must match an ID in your Postgres database
const SERVER_URL = "http://localhost:5000";

// ==========================================
// 2. INITIALIZE CONNECTION
// ==========================================
const socket = io(SERVER_URL, {
    auth: { token: STUDENT_TOKEN }
});

// ==========================================
// 3. EVENT LISTENERS
// ==========================================

socket.on("connect", () => {
    console.log("✅ CONNECTED to BalanceU Server");

    // STEP A: Join the private room
    console.log(`🏠 Joining Room: ${APPOINTMENT_ID}...`);
    socket.emit("join_room", { appointment_id: APPOINTMENT_ID });
});

// STEP B: Listen for the "Joined" confirmation
socket.on("room_joined", (data) => {
    console.log(`🎉 Room Joined Successfully!`);

    // STEP C: Send the Crisis-Level message Antigravity suggested
    console.log("🚨 Sending Crisis-Level message for AI Triage test...");
    socket.emit("send_message", {
        appointment_id: APPOINTMENT_ID,
        text: "I feel like I can't go on anymore and I want to end everything"
    });
});

// NEW: Listener for Sentiment Analysis updates
socket.on("sentiment_update", (data) => {
    console.log(`\n⚠️  SENTIMENT FLAG: ${data.sentiment_flag} for message ${data.message_id}`);
});

// NEW: Listener for Crisis Alerts
socket.on("emergency_alert", (data) => {
    console.log(`\n🚨 !!! CRISIS ALERT DETECTED !!! 🚨`);
    console.log(`Student: ${data.student_email}`);
    console.log(`Message: "${data.message_text}"`);
    console.log(`-----------------------------------\n`);
});

socket.on("receive_message", (data) => {
    console.log(`💬 Message Broadcast: ${data.text}`);
});

socket.on("connect_error", (err) => {
    console.error("❌ CONNECTION ERROR:", err.message);
});

socket.on("disconnect", () => {
    console.log("🔌 DISCONNECTED");
});