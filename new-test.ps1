$ErrorActionPreference = "Stop"

# --- Configuration ---
$baseUrl = "http://localhost:5000"
$cEmail = "counselor_new@iiitn.ac.in"
$sEmail = "student_new@iiitn.ac.in"
$password = "12345"
$instituteId = 1

echo "🚀 STARTING ULTIMATE INTEGRATION TEST: Assessment + Chat + AI"
echo "------------------------------------------------------------------"

# 1. AUTH & USER PREP
echo "1️⃣  Ensuring Users & Tokens..."
# (Login logic remains same to get $sToken and $cToken)
$sLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$sEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$sToken = $sLogin.token
$cLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{email=$cEmail; password=$password} | ConvertTo-Json) -ContentType "application/json"
$cToken = $cLogin.token
$cId = $cLogin.user.id

# 2. THE MISSING PART: THE ASSESSMENT
echo "2️⃣  Taking Clinical Assessment (PHQ-9)..."
$assessmentData = @{
    assessment_type = "PHQ-9"
    total_score = 22
    responses = @(
        @{question="Feeling nervous"; score=3; text="I feel very tense during my Operating Systems lectures."}
        @{question="Suicidal thoughts"; score=3; text="I feel like I cannot go on anymore."}
    )
}

try {
    $quiz = Invoke-RestMethod -Uri "$baseUrl/api/assessment/submit" -Method Post `
        -Headers @{Authorization="Bearer $sToken"} `
        -Body ($assessmentData | ConvertTo-Json -Depth 5) `
        -ContentType "application/json"
    echo "   -> Assessment Submitted! AI is analyzing..."
} catch {
    echo "   -> Assessment submission failed. Check /api/assessment/submit route."
}

# 3. APPOINTMENT FLOW
echo "3️⃣  Booking & Accepting Appointment..."
# (Booking and Patch logic remains same to get $appId)
# ... [Insert Booking/Accept Logic here] ...

# 4. CHAT SENTIMENT (PHASE 12C)
echo "4️⃣  Sending CRISIS Chat Message..."
# (Node script remains same)
# ... [Insert Node Socket Logic here] ...

# 5. THE FINAL AUDIT (THE TRUTH)
echo "5️⃣  Running Deep Verification..."
try {
    # Check Assessment AI
    $assessments = Invoke-RestMethod -Uri "$baseUrl/api/assessment/my-history" -Method Get -Headers @{Authorization="Bearer $sToken"}
    $lastAI = $assessments.history[0].ai_sentiment_analysis
    
    # Check Chat AI
    $history = Invoke-RestMethod -Uri "$baseUrl/api/chat/$appId/history" -Method Get -Headers @{Authorization="Bearer $sToken"}
    $lastChatFlag = $history.messages[-1].sentiment_flag

    echo ""
    echo "================ FINAL AUDIT REPORT ================"
    echo "1. Assessment AI : $(if ($lastAI) {$lastAI} else {"❌ STILL NULL"})"
    echo "2. Chat Sentiment : $(if ($lastChatFlag -eq 'CRISIS') {"✅ CRISIS"} else {"❌ $lastChatFlag"})"
    echo "----------------------------------------------------"
    
    if ($lastAI -and $lastChatFlag -eq "CRISIS") {
        echo "🏆 OVERALL SYSTEM STATUS: ALL GREEN"
    } else {
        echo "⚠️ SYSTEM STATUS: AI DEGRADED (Check Logs)"
    }
    echo "===================================================="
} catch {
    echo "❌ Audit failed to retrieve data."
}