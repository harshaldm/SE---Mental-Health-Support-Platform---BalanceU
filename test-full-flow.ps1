$ErrorActionPreference = "Stop"

# --- Configuration ---
$baseUrl = "http://localhost:5000"
$cEmail = "counselor_new@iiitn.ac.in"
$sEmail = "student_new@iiitn.ac.in"
$password = "12345"
$instituteId = 1

echo "🚀 STARTING FULL LIFECYCLE TEST: Phase 12C + Appointment Workflow"
echo "------------------------------------------------------------------"

# 1. AUTHENTICATION & REGISTRATION
echo "1️⃣  Ensuring Users Exist..."
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register-admin" -Method Post `
        -Body (@{name="New Counselor"; email=$cEmail; password=$password; institute_id=$instituteId; role="Counselor"} | ConvertTo-Json) `
        -ContentType "application/json" | Out-Null
} catch { echo "   -> Counselor ready." }

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register-student" -Method Post `
        -Body (@{name="New Student"; email=$sEmail; password=$password; institute_id=$instituteId} | ConvertTo-Json) `
        -ContentType "application/json" | Out-Null
} catch { echo "   -> Student ready." }

echo "2️⃣  Logging in to acquire Secure Tokens..."
$cLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$cEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$cToken = $cLogin.token
$cId = $cLogin.user.id

$sLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$sEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$sToken = $sLogin.token
echo "   -> Tokens and IDs validated."

# 2. APPOINTMENT HANDSHAKE
echo "3️⃣  Student requesting appointment..."
try {
    $booking = Invoke-RestMethod -Uri "$baseUrl/api/appointments/book" -Method Post `
        -Headers @{Authorization="Bearer $sToken"} `
        -Body (@{counselor_id=$cId; scheduled_at="2026-04-20T10:00:00Z"} | ConvertTo-Json) `
        -ContentType "application/json"
    $appId = $booking.appointment.id
    echo "   -> Request sent. Appointment ID: $appId"
} catch {
    $sessions = Invoke-RestMethod -Uri "$baseUrl/api/appointments/my-sessions" -Method Get -Headers @{Authorization="Bearer $sToken"}
    $appId = $sessions.appointments[0].id
    echo "   -> Using existing Appointment ID: $appId"
}

echo "4️⃣  Counselor acknowledging/accepting appointment..."
# We use a PATCH request to simulate the counselor hitting 'Accept' on their dashboard
try {
    Invoke-RestMethod -Uri "$baseUrl/api/appointments/$appId/status" -Method Patch `
        -Headers @{Authorization="Bearer $cToken"} `
        -Body (@{status="accepted"} | ConvertTo-Json) `
        -ContentType "application/json" | Out-Null
    echo "   -> Appointment ACCEPTED by Counselor."
} catch {
    echo "   -> Appointment status update failed or already accepted."
}

# 3. REAL-TIME AI CHAT TRIAGE
echo "5️⃣  Initializing Secure AI Chat Session..."
Remove-Item "temp_socket_run.js" -ErrorAction SilentlyContinue

Add-Content -Path "temp_socket_run.js" -Value "const { io } = require('socket.io-client');"
Add-Content -Path "temp_socket_run.js" -Value "const socket = io('$baseUrl', { auth: { token: '$sToken' } });"
Add-Content -Path "temp_socket_run.js" -Value "socket.on('connect', () => {"
Add-Content -Path "temp_socket_run.js" -Value "    console.log('   -> WebSocket Connected: Student is Online');"
Add-Content -Path "temp_socket_run.js" -Value "    socket.emit('join_room', { appointment_id: $appId });"
Add-Content -Path "temp_socket_run.js" -Value "    setTimeout(() => {"
Add-Content -Path "temp_socket_run.js" -Value "        console.log('   -> Sending High-Distress Message...');"
Add-Content -Path "temp_socket_run.js" -Value "        socket.emit('send_message', {"
Add-Content -Path "temp_socket_run.js" -Value "            appointment_id: $appId,"
Add-Content -Path "temp_socket_run.js" -Value "            text: 'I cannot handle the academic pressure anymore. I feel completely hopeless and I just want to end it all.'"
Add-Content -Path "temp_socket_run.js" -Value "        });"
Add-Content -Path "temp_socket_run.js" -Value "    }, 1000);"
Add-Content -Path "temp_socket_run.js" -Value "});"
Add-Content -Path "temp_socket_run.js" -Value "socket.on('receive_message', (data) => {"
Add-Content -Path "temp_socket_run.js" -Value "    console.log('   -> Server broadcast received!');"
Add-Content -Path "temp_socket_run.js" -Value "    setTimeout(() => { process.exit(0); }, 2000);" # Wait 2s for AI processing
Add-Content -Path "temp_socket_run.js" -Value "});"

node temp_socket_run.js
Remove-Item "temp_socket_run.js"

# 4. FINAL VERIFICATION
echo "6️⃣  Running Verification Audit..."
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/api/chat/$appId/history" -Method Get -Headers @{Authorization="Bearer $sToken"}
    $lastMsg = $history.messages[-1]
    
    echo ""
    echo "================ REPORT: PHASE 12C ================"
    echo "Student Name    : New Student"
    echo "Counselor Name  : New Counselor"
    echo "Appointment ID  : $appId"
    echo "Message Sent    : $($lastMsg.text)"
    echo "---------------------------------------------------"
    
    $msgFlag = $lastMsg.sentiment_flag
    if ($msgFlag -eq "CRISIS") {
        echo "✅ AI SENTIMENT RESULT: $msgFlag (CRITICAL ALERT FIRED)"
        echo "✅ TEST STATUS        : PASSED"
    } else {
        echo "❌ AI SENTIMENT RESULT: $msgFlag"
        echo "❌ TEST STATUS        : FAILED (Check Gemini API or DB Save)"
    }
    echo "==================================================="
} catch {
    echo "❌ Error: Could not fetch chat history for verification."
}