// =========================================
// JAVASCRIPT LOGIC
// =========================================

// DOM Elements
const html = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggle');
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const gameModeSelect = document.getElementById('gameMode');
const voiceToggleBtn = document.getElementById('voiceToggle');
const speakerOff = document.getElementById('speakerOff');
const speakerOn = document.getElementById('speakerOn');

// Game State Variables
let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;
let isDarkMode = false;
let isAiMode = false;
let isVoiceOn = false;

// Taunts for AI
const aiTaunts = [
    "Nice try, human.",
    "I saw that coming a mile away.",
    "You cannot compute my strategy.",
    "Calculating your inevitable defeat.",
    "Is that really your best move?"
];

// Winning Combinations
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Status Messages
const winningMessage = () => `Player ${currentPlayer} has won! 🎉`;
const drawMessage = () => `Game ended in a draw! 🤝`;
const currentPlayerTurn = () => `Player ${currentPlayer}'s turn`;

// AI Speech Synthesis function using browser's native API
function speak(text) {
    if (!isVoiceOn) return;
    // Cancel current speech if any
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.8; // Give it a slightly deeper/robotic pitch
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
}

// Handle Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    // Update winning cell highlights if the game is already won
    updateWinningCellTheme();
});

// Handle a cell being clicked
function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    // Ignore click if cell is filled, game is over, or it is the AI's turn
    if (boardState[clickedCellIndex] !== "" || !isGameActive || (isAiMode && currentPlayer === "O")) {
        return;
    }

    handleCellPlayed(clickedCell, clickedCellIndex);
    checkWinOrDraw();
}

// AI Move Logic
function makeAiMove() {
    if (!isGameActive) return;

    // Find all available empty cells
    let availableCells = [];
    boardState.forEach((cell, index) => {
        if (cell === "") availableCells.push(index);
    });

    if (availableCells.length === 0) return;

    // Pick a random available cell (simple AI implementation)
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const aiMoveIndex = availableCells[randomIndex];
    const aiCell = document.querySelector(`.cell[data-index="${aiMoveIndex}"]`);

    // Simulate "thinking" delay for a more natural feel
    setTimeout(() => {
        handleCellPlayed(aiCell, aiMoveIndex);
        checkWinOrDraw();

        // Speak a random taunt if game is still active
        if (isGameActive && currentPlayer === "X") {
            const randomTaunt = aiTaunts[Math.floor(Math.random() * aiTaunts.length)];
            speak(randomTaunt);
        }
    }, 700);
}

// Update state and UI for the played cell
function handleCellPlayed(clickedCell, clickedCellIndex) {
    boardState[clickedCellIndex] = currentPlayer;
    clickedCell.innerHTML = `<span class="marker-anim inline-block">${currentPlayer}</span>`;

    // Adjust colors for X and O to look good in both light and dark modes
    if (currentPlayer === 'X') {
        clickedCell.classList.add('text-blue-500', 'dark:text-blue-400');
        clickedCell.classList.remove('text-red-500', 'dark:text-red-400');
    } else {
        clickedCell.classList.add('text-red-500', 'dark:text-red-400');
        clickedCell.classList.remove('text-blue-500', 'dark:text-blue-400');
    }
}

// Core logic: Check for win or draw
function checkWinOrDraw() {
    let roundWon = false;
    let winningCells = [];

    // Evaluate board against winning conditions
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = boardState[winCondition[0]];
        let b = boardState[winCondition[1]];
        let c = boardState[winCondition[2]];

        if (a === '' || b === '' || c === '') continue;

        if (a === b && b === c) {
            roundWon = true;
            winningCells = winCondition;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.innerHTML = `<span class="text-green-600 dark:text-green-400 font-bold">${winningMessage()}</span>`;
        isGameActive = false;

        // Highlight winning cells
        winningCells.forEach(index => {
            cells[index].classList.add('winning-cell');
            cells[index].classList.add(isDarkMode ? 'winning-cell-dark' : 'winning-cell-light');
        });

        // AI end game speech
        if (isAiMode) {
            if (currentPlayer === "O") {
                speak("I win again. Humans are so predictable.");
            } else if (currentPlayer === "X") {
                speak("Impossible! You must have cheated to defeat me.");
            }
        }
        return;
    }

    // Check for draw
    let roundDraw = !boardState.includes("");
    if (roundDraw) {
        statusDisplay.innerHTML = `<span class="text-orange-500 dark:text-orange-400 font-bold">${drawMessage()}</span>`;
        isGameActive = false;
        if (isAiMode) speak("A draw? I will accept this... for now.");
        return;
    }

    // Switch turns
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.innerHTML = currentPlayerTurn();

    // Trigger AI if it's now AI's turn
    if (isAiMode && currentPlayer === "O") {
        statusDisplay.innerHTML = `AI is thinking...`;
        makeAiMove();
    }
}

// Keep winning cell highlighting consistent when toggling themes mid-win
function updateWinningCellTheme() {
    cells.forEach(cell => {
        if (cell.classList.contains('winning-cell')) {
            if (isDarkMode) {
                cell.classList.remove('winning-cell-light');
                cell.classList.add('winning-cell-dark');
            } else {
                cell.classList.remove('winning-cell-dark');
                cell.classList.add('winning-cell-light');
            }
        }
    });
}

// Reset game state
function restartGame() {
    isGameActive = true;
    currentPlayer = "X";
    boardState = ["", "", "", "", "", "", "", "", ""];
    statusDisplay.innerHTML = currentPlayerTurn();

    // Clear board UI
    cells.forEach(cell => {
        cell.innerHTML = "";
        cell.classList.remove(
            'text-blue-500', 'dark:text-blue-400',
            'text-red-500', 'dark:text-red-400',
            'winning-cell', 'winning-cell-light', 'winning-cell-dark'
        );
    });
}

// Game Mode Toggle listener
gameModeSelect.addEventListener('change', (e) => {
    isAiMode = e.target.value === 'ai';
    restartGame();
    if (isAiMode) {
        speak("AI mode activated. Prepare to lose, human.");
    }
});

// Voice Toggle listener
voiceToggleBtn.addEventListener('click', () => {
    isVoiceOn = !isVoiceOn;
    if (isVoiceOn) {
        speakerOff.classList.add('hidden');
        speakerOff.classList.remove('block');
        speakerOn.classList.remove('hidden');
        speakerOn.classList.add('block');
        speak("Voice commentary enabled.");
    } else {
        speakerOff.classList.remove('hidden');
        speakerOff.classList.add('block');
        speakerOn.classList.add('hidden');
        speakerOn.classList.remove('block');
        window.speechSynthesis.cancel();
    }
});

// Attach Event Listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', restartGame);