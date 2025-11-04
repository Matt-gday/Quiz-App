// Game State
const gameState = {
    numPlayers: 0,
    players: [],
    currentRound: 0,
    rounds: [], // Store topic and questions for each round
    allTopics: [], // All topics from current CSV
    currentTopicIndex: 0, // Current topic being played
    currentQuestionIndex: 0,
    currentPlayerIndex: 0,
    questions: [],
    selectedAnswer: null
};

// Player colors
const playerColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#9D84B7', // Purple
    '#FDA769'  // Orange
];

// Available emojis
const availableEmojis = ['😀', '😎', '🤓', '🥳', '🤠', '🦸', '🧙', '🦊', '🐯', '🦁', '🐼', '🐨'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializePlayerCountScreen();
});

// Screen 1: Player Count Selection
function initializePlayerCountScreen() {
    const buttons = document.querySelectorAll('.player-count-btn');
    const playBtn = document.getElementById('play-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            buttons.forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            btn.classList.add('selected');
            // Store selected player count
            gameState.numPlayers = parseInt(btn.dataset.count);
            // Enable play button
            playBtn.disabled = false;
        });
    });
    
    // Play button starts the game
    playBtn.addEventListener('click', () => {
        if (gameState.numPlayers > 0) {
            showScreen('screen-player-setup');
            createPlayerForms();
        }
    });
}

// Screen 2: Player Setup
function createPlayerForms() {
    const container = document.getElementById('player-forms');
    container.innerHTML = '';
    
    for (let i = 0; i < gameState.numPlayers; i++) {
        const form = document.createElement('div');
        form.className = 'player-form';
        form.style.borderLeftColor = playerColors[i];
        
        form.innerHTML = `
            <div class="player-number" style="color: ${playerColors[i]}">Player ${i + 1}</div>
            <input type="text" placeholder="Enter name" data-player="${i}" class="player-name-input">
            <div class="emoji-selector" data-player="${i}">
                ${availableEmojis.map(emoji => `
                    <span class="emoji-option" data-emoji="${emoji}">${emoji}</span>
                `).join('')}
            </div>
        `;
        
        container.appendChild(form);
    }
    
    // Add event listeners for emoji selection
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', (e) => {
            if (e.target.style.opacity === '0.3') return; // Don't allow selecting disabled emojis
            
            const playerIndex = e.target.closest('.emoji-selector').dataset.player;
            const selector = document.querySelector(`.emoji-selector[data-player="${playerIndex}"]`);
            selector.querySelectorAll('.emoji-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            
            updateEmojiAvailability();
        });
    });
}

function updateEmojiAvailability() {
    // Get all selected emojis
    const selectedEmojis = new Set();
    document.querySelectorAll('.emoji-option.selected').forEach(option => {
        selectedEmojis.add(option.dataset.emoji);
    });
    
    // Grey out selected emojis for other players
    document.querySelectorAll('.emoji-selector').forEach(selector => {
        selector.querySelectorAll('.emoji-option').forEach(option => {
            const emoji = option.dataset.emoji;
            const isSelected = option.classList.contains('selected');
            
            if (selectedEmojis.has(emoji) && !isSelected) {
                option.style.opacity = '0.3';
                option.style.cursor = 'not-allowed';
            } else if (!isSelected) {
                option.style.opacity = '1';
                option.style.cursor = 'pointer';
            }
        });
    });
    
    // Start game button
    document.getElementById('start-game-btn').addEventListener('click', startGame);
}

function startGame() {
    gameState.players = [];
    
    for (let i = 0; i < gameState.numPlayers; i++) {
        const nameInput = document.querySelector(`input[data-player="${i}"]`);
        const selectedEmoji = document.querySelector(`.emoji-selector[data-player="${i}"] .emoji-option.selected`);
        
        if (!nameInput.value.trim()) {
            showErrorModal(`Please enter a name for <strong>Player ${i + 1}</strong>`);
            return;
        }
        
        if (!selectedEmoji) {
            showErrorModal(`Please select an emoji for <strong>Player ${i + 1}</strong>`);
            return;
        }
        
        gameState.players.push({
            name: nameInput.value.trim(),
            emoji: selectedEmoji.dataset.emoji,
            color: playerColors[i],
            totalScore: 0,
            roundScores: []
        });
    }
    
    gameState.currentRound = 1;
    showScreen('screen-round-setup');
    setupRoundUpload();
}

// Screen 3: Round Setup (CSV Upload)
function setupRoundUpload() {
    const csvUpload = document.getElementById('csv-upload');
    const uploadArea = document.getElementById('upload-area');
    const dropZone = document.getElementById('drop-zone');
    const csvPreview = document.getElementById('csv-preview');
    const startRoundBtn = document.getElementById('start-round-btn');
    const uploadHeader = document.getElementById('upload-header');
    
    // Reset
    csvUpload.value = '';
    uploadHeader.style.display = 'block';
    uploadArea.style.display = 'flex';
    csvPreview.classList.remove('active');
    csvPreview.innerHTML = '';
    startRoundBtn.style.display = 'none';
    
    // Update round number
    document.getElementById('round-number').textContent = gameState.currentRound;
    
    // Handle upload button click
    const uploadBtn = document.getElementById('upload-btn-trigger');
    uploadBtn.onclick = () => csvUpload.click();
    
    // Handle file input change
    csvUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            parseCSV(file);
        }
    });
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            parseCSV(file);
        } else {
            showErrorModal('Please drop a CSV file');
        }
    });
    
    startRoundBtn.addEventListener('click', startRound);
}

function parseCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            showErrorModal('CSV file is empty or invalid');
            return;
        }
        
        // Parse CSV (expecting: Topic,Question,Answer1,Answer2,Answer3,Answer4,CorrectAnswer)
        const headers = lines[0].split(',').map(h => h.trim());
        const allQuestions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length >= 7) {
                allQuestions.push({
                    topic: values[0].trim(),
                    question: values[1].trim(),
                    answers: [
                        values[2].trim(),
                        values[3].trim(),
                        values[4].trim(),
                        values[5].trim()
                    ],
                    correctAnswer: values[6].trim()
                });
            }
        }
        
        if (allQuestions.length === 0) {
            showErrorModal('No valid questions found in CSV');
            return;
        }
        
        // Group questions by topic
        const topicGroups = {};
        allQuestions.forEach(q => {
            if (!topicGroups[q.topic]) {
                topicGroups[q.topic] = [];
            }
            topicGroups[q.topic].push(q);
        });
        
        // Store all topics from this CSV
        gameState.allTopics = [];
        Object.keys(topicGroups).forEach(topic => {
            const questions = topicGroups[topic];
            // Randomize questions within each topic
            shuffleArray(questions);
            
            // Calculate how many questions per player (discard extras)
            const questionsPerPlayer = Math.floor(questions.length / gameState.numPlayers);
            const totalQuestions = questionsPerPlayer * gameState.numPlayers;
            
            gameState.allTopics.push({
                topic: topic,
                questions: questions.slice(0, totalQuestions),
                questionsPerPlayer: questionsPerPlayer
            });
        });
        
        // Validate that each topic has enough questions
        const invalidTopics = gameState.allTopics.filter(topicData => topicData.questions.length === 0);
        if (invalidTopics.length > 0) {
            const topicNames = invalidTopics.map(t => t.topic).join(', ');
            showErrorModal(`Not enough questions in the following topic(s): <strong>${topicNames}</strong><br><br>Each topic must have at least <strong>${gameState.numPlayers} questions</strong> (one per player). Please upload a different CSV file.`);
            
            // Reset upload area
            document.getElementById('csv-upload').value = '';
            return;
        }
        
        gameState.currentTopicIndex = 0;
        
        // Hide upload header and upload area, show attractive preview
        document.getElementById('upload-header').style.display = 'none';
        document.getElementById('upload-area').style.display = 'none';
        
        const preview = document.getElementById('csv-preview');
        let previewHTML = `
            <div class="csv-success-card">
                <div class="csv-filename">${file.name}</div>
                
                <div class="csv-rounds-container">
                    <div class="csv-rounds-title">Rounds Preview</div>
        `;
        
        gameState.allTopics.forEach((topicData, index) => {
            previewHTML += `
                <div class="csv-round-item">
                    <div class="csv-round-number">Round ${gameState.currentRound + index}</div>
                    <div class="csv-round-topic">${topicData.topic}</div>
                    <div class="csv-round-count">${topicData.questions.length} questions</div>
                </div>
            `;
        });
        
        previewHTML += `
                    <div class="csv-total-rounds">Total Rounds: ${gameState.allTopics.length}</div>
                </div>
            </div>
        `;
        
        preview.innerHTML = previewHTML;
        preview.classList.add('active');
        
        document.getElementById('start-round-btn').style.display = 'block';
    };
    reader.readAsText(file);
}

// Helper function to parse CSV line (handles commas in quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Show error modal
function showErrorModal(message) {
    const modal = document.getElementById('error-modal');
    const messageDiv = document.getElementById('error-message');
    messageDiv.innerHTML = message;
    modal.classList.add('active');
    
    document.getElementById('error-ok-btn').onclick = () => {
        modal.classList.remove('active');
    };
}

// Screen 4: Question Screen
function startRound() {
    // Get questions for current topic
    const topicData = gameState.allTopics[gameState.currentTopicIndex];
    gameState.questions = topicData.questions;
    
    // Store round info
    gameState.rounds.push({
        roundNumber: gameState.currentRound,
        topic: topicData.topic
    });
    
    // Initialize round scores
    gameState.players.forEach(player => {
        player.roundScores[gameState.currentRound - 1] = 0;
    });
    
    gameState.currentQuestionIndex = 0;
    gameState.currentPlayerIndex = 0;
    
    showScreen('screen-question');
    updateScoreboard();
    showQuestion();
}

function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard-content');
    scoreboard.innerHTML = '';
    
    gameState.players.forEach(player => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.style.backgroundColor = player.color + '80'; // Add transparency
        scoreItem.style.color = '#ffffff';
        
        scoreItem.innerHTML = `
            <span class="score-emoji">${player.emoji}</span>
            <span class="score-name">${player.name}</span>
            <span class="score-points">${player.totalScore} pts</span>
        `;
        
        scoreboard.appendChild(scoreItem);
    });
}

function showQuestion() {
    const question = gameState.questions[gameState.currentQuestionIndex];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Update player banner
    const banner = document.getElementById('current-player-banner');
    banner.style.backgroundColor = currentPlayer.color;
    document.getElementById('current-player-emoji').textContent = currentPlayer.emoji;
    document.getElementById('current-player-name').textContent = currentPlayer.name;
    
    // Update question
    document.getElementById('topic-badge').textContent = question.topic;
    document.getElementById('question-counter').textContent = `Question ${gameState.currentQuestionIndex + 1} of ${gameState.questions.length}`;
    document.getElementById('question-text').textContent = question.question;
    
    // Randomize answer order
    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);
    
    // Render answers
    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = '';
    
    shuffledAnswers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.textContent = answer;
        answerDiv.dataset.answer = answer;
        
        answerDiv.addEventListener('click', () => selectAnswer(answer));
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Reset buttons and container
    gameState.selectedAnswer = null;
    document.getElementById('submit-answer-btn').disabled = true;
    document.getElementById('submit-answer-btn').style.display = 'block';
    document.getElementById('next-question-btn').style.display = 'none';
    
    // Reset answer options pointer events
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.style.pointerEvents = 'auto';
    });
    
    // Add submit listener
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn.replaceWith(submitBtn.cloneNode(true)); // Remove old listeners
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
}

function selectAnswer(answer) {
    gameState.selectedAnswer = answer;
    
    // Update UI
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.answer === answer) {
            opt.classList.add('selected');
        }
    });
    
    document.getElementById('submit-answer-btn').disabled = false;
}

function submitAnswer() {
    const question = gameState.questions[gameState.currentQuestionIndex];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isCorrect = gameState.selectedAnswer === question.correctAnswer;
    
    // Disable submit button and answers during shake
    document.getElementById('submit-answer-btn').disabled = true;
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    
    // Start shake animation
    const questionContainer = document.querySelector('.question-container');
    questionContainer.classList.add('shaking');
    
    // Wait for shake to complete, then reveal answer
    setTimeout(() => {
        questionContainer.classList.remove('shaking');
        
        // Update score and trigger effects
        if (isCorrect) {
            currentPlayer.totalScore++;
            currentPlayer.roundScores[gameState.currentRound - 1]++;
            // Trigger massive confetti explosion with team color
            createConfetti(currentPlayer.color);
        } else {
            // Trigger smoke effect for wrong answer
            createSmoke();
        }
        
        // Show correct/incorrect
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.add('disabled');
            opt.style.cursor = 'not-allowed';
            
            if (opt.dataset.answer === question.correctAnswer) {
                opt.classList.add('correct');
            } else if (opt.dataset.answer === gameState.selectedAnswer && !isCorrect) {
                opt.classList.add('incorrect');
            }
        });
        
        // Update UI
        document.getElementById('submit-answer-btn').style.display = 'none';
        const nextBtn = document.getElementById('next-question-btn');
        nextBtn.style.display = 'block';
        
        // Check if this is the last question
        const isLastQuestion = gameState.currentQuestionIndex >= gameState.questions.length - 1;
        nextBtn.textContent = isLastQuestion ? 'Round Results' : 'Next Question';
        
        // Add next question listener
        nextBtn.replaceWith(nextBtn.cloneNode(true)); // Remove old listeners
        const newNextBtn = document.getElementById('next-question-btn');
        newNextBtn.addEventListener('click', nextQuestion);
        
        // Update scoreboard
        updateScoreboard();
    }, 1800); // Match the shake animation duration
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        // Round complete
        showRoundResults();
    } else {
        showQuestion();
    }
}

// Round Results Modal
function showRoundResults() {
    const modal = document.getElementById('round-results-modal');
    const content = document.getElementById('round-results-content');
    
    content.innerHTML = '<h3>Round ' + gameState.currentRound + ' Results</h3>';
    
    gameState.players.forEach(player => {
        const roundScore = player.roundScores[gameState.currentRound - 1];
        const resultItem = document.createElement('div');
        resultItem.className = 'round-result-item';
        resultItem.style.backgroundColor = player.color + '33';
        resultItem.style.borderLeft = `5px solid ${player.color}`;
        
        resultItem.innerHTML = `
            <div class="player-info">
                <span class="result-emoji">${player.emoji}</span>
                <span class="result-name">${player.name}</span>
            </div>
            <span class="result-score">${roundScore} points</span>
        `;
        
        content.appendChild(resultItem);
    });
    
    modal.classList.add('active');
    
    // Button listeners
    document.getElementById('next-round-btn').onclick = nextRound;
    document.getElementById('end-game-btn').onclick = endGame;
}

function nextRound() {
    document.getElementById('round-results-modal').classList.remove('active');
    gameState.currentRound++;
    gameState.currentTopicIndex++;
    
    // Check if there are more topics available from the current CSV
    if (gameState.currentTopicIndex < gameState.allTopics.length) {
        // More topics available, start next round immediately
        startRound();
    } else {
        // No more topics, need to upload new CSV
        showScreen('screen-round-setup');
        setupRoundUpload();
    }
}

function endGame() {
    document.getElementById('round-results-modal').classList.remove('active');
    showGameResults();
}

// Game Results Modal
function showGameResults() {
    const modal = document.getElementById('game-results-modal');
    const content = document.getElementById('game-results-content');
    
    content.innerHTML = '';
    
    // Find winner(s) - handle ties
    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
    const highestScore = sortedPlayers[0].totalScore;
    const winners = sortedPlayers.filter(player => player.totalScore === highestScore);
    
    // Winner announcement
    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'winner';
    
    if (winners.length === 1) {
        // Single winner
        winnerDiv.innerHTML = `
            <span class="winner-emoji">${winners[0].emoji}</span>
            🏆 ${winners[0].name} Wins! 🏆
            <div style="margin-top: 10px; font-size: 0.8em;">${winners[0].totalScore} points</div>
        `;
    } else {
        // Tie for first place
        const winnerEmojis = winners.map(w => w.emoji).join(' ');
        const winnerNames = winners.map(w => w.name).join(' & ');
        winnerDiv.innerHTML = `
            <div class="winner-emoji" style="font-size: 2em;">${winnerEmojis}</div>
            🏆 Tie for First Place! 🏆
            <div style="margin-top: 15px; font-size: 0.9em;">${winnerNames}</div>
            <div style="margin-top: 5px; font-size: 0.8em;">${highestScore} points each</div>
        `;
    }
    
    content.appendChild(winnerDiv);
    
    // Final standings (moved above round breakdown)
    const standingsDiv = document.createElement('div');
    standingsDiv.className = 'final-standings';
    standingsDiv.innerHTML = '<h3>Final Standings</h3>';
    
    sortedPlayers.forEach((player, index) => {
        const standingItem = document.createElement('div');
        standingItem.className = 'standing-item';
        standingItem.style.backgroundColor = player.color + '33';
        
        standingItem.innerHTML = `
            <span class="standing-position">${index + 1}.</span>
            <div class="standing-player">
                <span class="standing-emoji">${player.emoji}</span>
                <span>${player.name}</span>
            </div>
            <span class="standing-total">${player.totalScore} pts</span>
        `;
        
        standingsDiv.appendChild(standingItem);
    });
    
    content.appendChild(standingsDiv);
    
    // Round summaries
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'game-summary';
    summaryDiv.innerHTML = '<h3>Round Breakdown</h3>';
    
    for (let i = 0; i < gameState.currentRound; i++) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-summary';
        const roundInfo = gameState.rounds[i];
        const topicText = roundInfo ? ` - ${roundInfo.topic}` : '';
        roundDiv.innerHTML = `<h3>Round ${i + 1}${topicText}</h3>`;
        
        const scoresDiv = document.createElement('div');
        scoresDiv.className = 'round-scores';
        
        gameState.players.forEach(player => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'round-score-item';
            scoreItem.innerHTML = `
                <span>${player.emoji} ${player.name}</span>
                <span style="font-weight: bold;">${player.roundScores[i] || 0} pts</span>
            `;
            scoresDiv.appendChild(scoreItem);
        });
        
        roundDiv.appendChild(scoresDiv);
        summaryDiv.appendChild(roundDiv);
    }
    content.appendChild(summaryDiv);
    
    modal.classList.add('active');
    
    document.getElementById('new-game-btn').onclick = () => location.reload();
}

// Confetti Animation - Huge explosion from center with rainbow colors
function createConfetti(color) {
    const confettiCount = 150; // Massive explosion
    // Rainbow colors
    const rainbowColors = [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3', // Violet
        '#FF1493', // Deep Pink
        '#00CED1', // Dark Turquoise
        '#FFD700', // Gold
        '#FF69B4', // Hot Pink
        '#00FF7F'  // Spring Green
    ];
    const shapes = ['square', 'circle', 'rectangle-h', 'rectangle-v', 'star'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti explode';
        
        // Add random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.classList.add(shape);
        
        // Random rainbow color
        confetti.style.backgroundColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        
        // Calculate random explosion direction (full 360 degrees)
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 300 + Math.random() * 600; // Distance from center
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;
        
        // Random rotation
        const rotation = Math.random() * 1080 - 540; // -540 to 540 degrees
        
        // Set CSS variables for animation
        confetti.style.setProperty('--x', `${x}px`);
        confetti.style.setProperty('--y', `${y}px`);
        confetti.style.setProperty('--rotate', `${rotation}deg`);
        confetti.style.setProperty('--duration', `${1.5 + Math.random() * 1}s`);
        
        // Slight delay for wave effect
        confetti.style.animationDelay = `${Math.random() * 0.1}s`;
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// Smoke Animation - Radiating smoke for wrong answers
function createSmoke() {
    const smokeCount = 80; // Number of smoke puffs
    // Dark gray and purple smoke colors
    const smokeColors = [
        '#4a4a4a', // Dark gray
        '#5a5a5a', // Medium gray
        '#6a5f7a', // Gray purple
        '#7a6f8a', // Light purple gray
        '#505050', // Charcoal
        '#604070'  // Deep purple
    ];
    
    for (let i = 0; i < smokeCount; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke radiate';
        
        // Random smoke color
        smoke.style.backgroundColor = smokeColors[Math.floor(Math.random() * smokeColors.length)];
        
        // Radiate outward in all directions (full 360 degrees)
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const distance = 150 + Math.random() * 400; // Distance from center
        
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        // Random size variation - expand as it moves out
        const scale = 2 + Math.random() * 2.5;
        
        // Set CSS variables for animation
        smoke.style.setProperty('--x', `${x}px`);
        smoke.style.setProperty('--y', `${y}px`);
        smoke.style.setProperty('--scale', scale);
        smoke.style.setProperty('--duration', `${0.6 + Math.random() * 0.4}s`);
        
        // Staggered start for wave effect
        smoke.style.animationDelay = `${Math.random() * 0.1}s`;
        
        document.body.appendChild(smoke);
        
        // Remove smoke after animation
        setTimeout(() => {
            smoke.remove();
        }, 1200);
    }
}

// Helper function to lighten/darken colors
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// Utility Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Move characters to top when not on start screen
    const characterLeft = document.querySelector('.character-left');
    const characterRight = document.querySelector('.character-right');
    
    if (screenId === 'screen-player-count') {
        characterLeft.classList.remove('at-top');
        characterRight.classList.remove('at-top');
    } else {
        characterLeft.classList.add('at-top');
        characterRight.classList.add('at-top');
    }
}

