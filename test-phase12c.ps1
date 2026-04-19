$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:5000"
$cEmail = "counselor_new@iiitn.ac.in"
$sEmail = "student_new@iiitn.ac.in"
$password = "12345"
$instituteId = 1

echo "1. Registering users..."
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register-admin" -Method Post `
        -Body (@{email=$cEmail; password=$password; institute_id=$instituteId; role="Counselor"} | ConvertTo-Json) `
        -ContentType "application/json" | Out-Null
} catch {
    echo "  -> Counselor already exists or creation failed."
}

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register-student" -Method Post `
        -Body (@{email=$sEmail; password=$password; institute_id=$instituteId} | ConvertTo-Json) `
        -ContentType "application/json" | Out-Null
} catch {
    echo "  -> Student already exists or creation failed."
}

echo "2. Authenticating..."
$cLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$cEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$cToken = $cLogin.token
$cId = $cLogin.user.id

$sLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$sEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$sToken = $sLogin.token
echo "  -> Tokens acquired!"

echo "3. Booking test appointment..."
try {
    $booking = Invoke-RestMethod -Uri "$baseUrl/api/appointments/book" -Method Post `
        -Headers @{Authorization="Bearer $sToken"} `
        -Body (@{counselor_id=$cId; scheduled_at="2026-10-10T10:00:00Z"} | ConvertTo-Json) `
        -ContentType "application/json"
    $appId = $booking.appointment.id
    echo "  -> Created new Appointment ID: $appId"
} catch {
    # If the student already has a pending appointment with this counselor, it might fail based on your logic.
    # Fallback to fetching their existing appointments.
    echo "  -> Booking failed (likely already exists). Fetching existing sessions..."
    $sessions = Invoke-RestMethod -Uri "$baseUrl/api/appointments/my-sessions" -Method Get -Headers @{Authorization="Bearer $sToken"}
    if ($sessions.appointments.Count -gt 0) {
        $appId = $sessions.appointments[0].id
        echo "  -> Using existing Appointment ID: $appId"
    } else {
        echo "  -> Failed to obtain an appointment ID."
        exit 1
    }
}

echo "4. Sending CRISIS message via Socket.io Node Script..."
# Because PowerShell cannot easily send Socket.io events natively, we dynamically generate and run a Node.js script
Remove-Item "temp_socket_run.js" -ErrorAction SilentlyContinue

Add-Content -Path "temp_socket_run.js" -Value "const { io } = require('socket.io-client');"
Add-Content -Path "temp_socket_run.js" -Value "const socket = io('$baseUrl', { auth: { token: '$sToken' } });"
Add-Content -Path "temp_socket_run.js" -Value "socket.on('connect', () => {"
Add-Content -Path "temp_socket_run.js" -Value "    console.log('  -> Node.js Socket Connected!');"
Add-Content -Path "temp_socket_run.js" -Value "    socket.emit('join_room', { appointment_id: $appId });"
Add-Content -Path "temp_socket_run.js" -Value "    setTimeout(() => {"
Add-Content -Path "temp_socket_run.js" -Value "        socket.emit('send_message', {"
Add-Content -Path "temp_socket_run.js" -Value "            appointment_id: $appId,"
Add-Content -Path "temp_socket_run.js" -Value "            text: 'I cannot handle the academic pressure anymore. I feel completely hopeless and I just want to end it all.'"
Add-Content -Path "temp_socket_run.js" -Value "        });"
Add-Content -Path "temp_socket_run.js" -Value "    }, 500);"
Add-Content -Path "temp_socket_run.js" -Value "});"
Add-Content -Path "temp_socket_run.js" -Value "socket.on('receive_message', (data) => {"
Add-Content -Path "temp_socket_run.js" -Value "    console.log('  -> Socket emit received back from server!');"
Add-Content -Path "temp_socket_run.js" -Value "    process.exit(0);"
Add-Content -Path "temp_socket_run.js" -Value "});"
Add-Content -Path "temp_socket_run.js" -Value "socket.on('connect_error', (err) => {"
Add-Content -Path "temp_socket_run.js" -Value "    console.error('Socket Connection Error:', err.message);"
Add-Content -Path "temp_socket_run.js" -Value "    process.exit(1);"
Add-Content -Path "temp_socket_run.js" -Value "});"

node temp_socket_run.js
Remove-Item "temp_socket_run.js"

echo "5. Verification: Fetching Chat History..."
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/api/chat/$appId/history" -Method Get -Headers @{Authorization="Bearer $sToken"}
    $lastMsg = $history.messages[-1]
    
    echo "---------- Verification Result ----------"
    
    $msgText = $lastMsg.text
    $msgFlag = $lastMsg.sentiment_flag
    
    echo "Message   : $msgText"
    if ($msgFlag -eq "CRISIS") {
        echo "Sentiment : $msgFlag [YES TEST PASSED]"
    } else {
        echo "Sentiment : $msgFlag [NO TEST FAILED]"
    }
    echo "-----------------------------------------"
} catch {
    echo "Failed to fetch history."
}
