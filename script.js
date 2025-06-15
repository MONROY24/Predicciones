const ADMIN_PASSWORD = "2022";
const PARTICIPANT_STORAGE_KEY = 'mundialClubesParticipants';
const PARTIDOS_STORAGE_KEY = 'mundialClubesPartidos';

document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const enterAppBtn = document.getElementById('enter-app-btn');

    const partidosTableBody = document.querySelector('#partidos-table tbody');
    const participantSelect = document.getElementById('participant-select');
    const newParticipantNameInput = document.getElementById('new-participant-name');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const puntuacionDisplay = document.getElementById('puntuacion-display');
    const addMatchBtn = document.getElementById('add-match-btn');
    const matchModal = document.getElementById('match-modal');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmitBtn = document.getElementById('password-submit-btn');
    const passwordCancelBtn = document.getElementById('password-cancel-btn');
    const closeButtons = document.querySelectorAll('.close-button');
    const matchForm = document.getElementById('match-form');
    const backgroundMusic = document.getElementById('background-music');

    const matchSelectorForPredictions = document.getElementById('match-selector-for-predictions');
    const predictionsForSelectedMatchDiv = document.getElementById('predictions-for-selected-match');

    let participants = [];
    let partidos = [];
    let currentParticipant = null;
    let editingMatchId = null;
    let currentPasswordCallback = null;

    // --- Utility and Data Persistence Functions (using localStorage) ---

    async function fetchData() {
        try {
            participants = JSON.parse(localStorage.getItem(PARTICIPANT_STORAGE_KEY)) || [];
            partidos = JSON.parse(localStorage.getItem(PARTIDOS_STORAGE_KEY)) || [];
        } catch (error) {
            console.error('Error fetching data from localStorage:', error);
            participants = [];
            partidos = [];
        }
    }

    async function saveData() {
        try {
            localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(participants));
            localStorage.setItem(PARTIDOS_STORAGE_KEY, JSON.stringify(partidos));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }

    // --- Participant Management ---

    function renderParticipantsSelect() {
        participantSelect.innerHTML = '<option value="">Selecciona un participante</option>';
        participants.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            participantSelect.appendChild(option);
        });
        if (currentParticipant) {
            participantSelect.value = currentParticipant.id;
        }
    }

    function addParticipant(name) {
        if (!name.trim()) {
            alert('El nombre del participante no puede estar vacío.');
            return;
        }
        if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            alert('Este participante ya existe.');
            return;
        }
        const newParticipant = {
            id: Date.now().toString(),
            name: name.trim()
        };
        participants.push(newParticipant);
        renderParticipantsSelect();
        saveData();
        newParticipantNameInput.value = '';
        alert(`Participante "${name}" añadido.`);
    }

    addParticipantBtn.addEventListener('click', () => {
        currentPasswordCallback = () => {
            addParticipant(newParticipantNameInput.value);
            closePasswordModal();
            renderPartidos();
            renderPuntuacion();
            renderMatchSelectorForPredictions();
        };
        openPasswordModal();
    });

    participantSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        currentParticipant = participants.find(p => p.id === selectedId) || null;
        renderPartidos();
        renderPuntuacion();
    });

    // --- Match and Prediction Management ---

    function renderPartidos() {
        partidosTableBody.innerHTML = '';
        partidos.forEach(match => {
            const row = partidosTableBody.insertRow();
            row.dataset.id = match.id;

            const participantPrediction = match.predictions.find(p => p.participantId === (currentParticipant ? currentParticipant.id : ''));
            const predictionText = participantPrediction ? participantPrediction.score : '';

            let predictionCellContent;
            if (currentParticipant) {
                if (predictionText) {
                    predictionCellContent = `<span>${predictionText}</span> <button class="btn btn-predict" data-id="${match.id}" data-action="edit-prediction">Editar</button>`;
                } else {
                    predictionCellContent = `<input type="text" class="prediction-input" placeholder="Ej: 1-0" data-id="${match.id}"><button class="btn btn-predict" data-id="${match.id}" data-action="save-prediction">Guardar</button>`;
                }
            } else {
                predictionCellContent = `<span>Selecciona un usuario</span>`;
            }

            row.innerHTML = `
                <td>${match.date}</td>
                <td>${match.time}</td>
                <td>${match.homeTeam}</td>
                <td>${match.awayTeam}</td>
                <td class="final-score-cell">
                    ${match.finalScore ? `<span>${match.finalScore}</span> <button class="btn btn-set-score" data-id="${match.id}" data-action="edit-score">Editar Marcador</button>` : `<input type="text" class="score-input" placeholder="Ej: 2-1" data-id="${match.id}"><button class="btn btn-set-score" data-id="${match.id}" data-action="set-score">Establecer Marcador</button>`}
                </td>
                <td class="prediction-cell">
                    ${predictionCellContent}
                </td>
                <td>
                    <button class="btn btn-edit" data-id="${match.id}" data-action="edit-match">Editar</button>
                    <button class="btn btn-delete" data-id="${match.id}" data-action="delete-match">Eliminar</button>
                </td>
            `;

            if (match.finalScore && participantPrediction) {
                const cell = row.querySelector('.prediction-cell');
                if (match.finalScore === participantPrediction.score) {
                    cell.classList.add('prediction-correct');
                    cell.classList.remove('prediction-incorrect');
                } else {
                    cell.classList.add('prediction-incorrect');
                    cell.classList.remove('prediction-correct');
                }
            }
        });
        renderPuntuacion();
        renderMatchSelectorForPredictions();
        saveData();
    }

    partidosTableBody.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const match = partidos.find(m => m.id === id);
        const action = e.target.dataset.action;

        if (!match) return;

        if (action === 'save-prediction' || action === 'edit-prediction') {
            if (!currentParticipant) {
                alert('Por favor, selecciona un participante para hacer una predicción.');
                return;
            }
            const predictionInput = e.target.parentNode.querySelector('.prediction-input');
            const prediction = predictionInput ? predictionInput.value.trim() : '';

            if (predictionInput && prediction) {
                let existingPredictionIndex = match.predictions.findIndex(p => p.participantId === currentParticipant.id);
                if (existingPredictionIndex !== -1) {
                    match.predictions[existingPredictionIndex].score = prediction;
                } else {
                    match.predictions.push({ participantId: currentParticipant.id, score: prediction });
                }
                renderPartidos();
                renderPredictionsForSelectedMatch(matchSelectorForPredictions.value);
            } else if (action === 'edit-prediction') {
                const currentPredictionSpan = e.target.parentNode.querySelector('span');
                const currentPrediction = currentPredictionSpan.textContent;
                e.target.parentNode.innerHTML = `<input type="text" class="prediction-input" value="${currentPrediction}" data-id="${id}"><button class="btn btn-predict" data-id="${id}" data-action="save-prediction">Guardar</button>`;
            } else {
                alert('Por favor, ingresa una predicción.');
            }

        } else if (action === 'set-score' || action === 'edit-score') {
            const scoreInput = e.target.parentNode.querySelector('.score-input');
            const finalScore = scoreInput ? scoreInput.value.trim() : '';

            currentPasswordCallback = () => {
                if (scoreInput && finalScore) {
                    match.finalScore = finalScore;
                    renderPartidos();
                    renderPredictionsForSelectedMatch(matchSelectorForPredictions.value);
                } else if (action === 'edit-score') {
                    const currentScoreSpan = e.target.parentNode.querySelector('span');
                    const currentScore = currentScoreSpan.textContent;
                    e.target.parentNode.innerHTML = `<input type="text" class="score-input" value="${currentScore}" data-id="${id}"><button class="btn btn-set-score" data-id="${id}" data-action="set-score">Establecer Marcador</button>`;
                } else {
                    alert('Por favor, ingresa el marcador final.');
                }
                closePasswordModal();
            };
            openPasswordModal();
        } else if (action === 'edit-match') {
            currentPasswordCallback = () => {
                editingMatchId = id;
                document.getElementById('match-date').value = match.date;
                document.getElementById('match-time').value = match.time;
                document.getElementById('home-team').value = match.homeTeam;
                document.getElementById('away-team').value = match.awayTeam;
                matchModal.style.display = 'block';
                closePasswordModal();
            };
            openPasswordModal();
        } else if (action === 'delete-match') {
            currentPasswordCallback = () => {
                if (confirm('¿Estás seguro de que quieres eliminar este partido?')) {
                    partidos = partidos.filter(m => m.id !== id);
                    renderPartidos();
                    renderPredictionsForSelectedMatch(matchSelectorForPredictions.value);
                }
                closePasswordModal();
            };
            openPasswordModal();
        }
    });

    addMatchBtn.addEventListener('click', () => {
        currentPasswordCallback = () => {
            editingMatchId = null;
            matchForm.reset();
            matchModal.style.display = 'block';
            closePasswordModal();
        };
        openPasswordModal();
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === matchModal) {
            matchModal.style.display = 'none';
        }
        if (event.target === passwordModal) {
            passwordModal.style.display = 'none';
        }
    });

    matchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('match-date').value;
        const time = document.getElementById('match-time').value;
        const homeTeam = document.getElementById('home-team').value;
        const awayTeam = document.getElementById('away-team').value;

        if (editingMatchId) {
            const match = partidos.find(m => m.id === editingMatchId);
            if (match) {
                match.date = date;
                match.time = time;
                match.homeTeam = homeTeam;
                match.awayTeam = awayTeam;
            }
        } else {
            const newMatch = {
                id: Date.now().toString(),
                date,
                time,
                homeTeam,
                awayTeam,
                finalScore: null,
                predictions: []
            };
            partidos.push(newMatch);
        }
        matchModal.style.display = 'none';
        renderPartidos();
        renderMatchSelectorForPredictions();
    });

    // --- Scoring System ---

    function renderPuntuacion() {
        puntuacionDisplay.innerHTML = '';
        const scores = {};

        participants.forEach(p => {
            scores[p.id] = 0;
        });

        partidos.forEach(match => {
            if (match.finalScore) {
                const correctPredictionsForThisMatch = match.predictions.filter(p => p.score === match.finalScore);
                const numCorrect = correctPredictionsForThisMatch.length;

                if (numCorrect > 0) {
                    const pointsPerPerson = 1 / numCorrect;
                    correctPredictionsForThisMatch.forEach(p => {
                        scores[p.participantId] += pointsPerPerson;
                    });
                }
            }
        });

        participants.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

        participants.forEach(p => {
            const participantScoreDiv = document.createElement('div');
            participantScoreDiv.innerHTML = `
                <strong>${p.name}:</strong> <span>${(scores[p.id] || 0).toFixed(2)} puntos</span>
            `;
            puntuacionDisplay.appendChild(participantScoreDiv);
        });

        saveData();
    }

    // --- Password Modal Logic ---

    function openPasswordModal() {
        passwordInput.value = '';
        passwordModal.style.display = 'block';
        passwordInput.focus();
    }

    function closePasswordModal() {
        passwordModal.style.display = 'none';
        passwordInput.value = '';
        currentPasswordCallback = null;
    }

    passwordSubmitBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            if (currentPasswordCallback) {
                currentPasswordCallback();
            }
        } else {
            alert('Contraseña incorrecta.');
            closePasswordModal();
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordSubmitBtn.click();
        }
    });

    passwordCancelBtn.addEventListener('click', () => {
        closePasswordModal();
    });

    // --- All Predictions per Match Section ---

    function renderMatchSelectorForPredictions() {
        matchSelectorForPredictions.innerHTML = '<option value="">Selecciona un partido</option>';
        partidos.forEach(match => {
            const option = document.createElement('option');
            option.value = match.id;
            option.textContent = `${match.homeTeam} vs ${match.awayTeam} (${match.date})`;
            matchSelectorForPredictions.appendChild(option);
        });
        const currentSelectedMatchId = predictionsForSelectedMatchDiv.dataset.currentMatchId;
        if (currentSelectedMatchId && partidos.some(m => m.id === currentSelectedMatchId)) {
            matchSelectorForPredictions.value = currentSelectedMatchId;
            renderPredictionsForSelectedMatch(currentSelectedMatchId);
        } else {
            predictionsForSelectedMatchDiv.innerHTML = `<p class="placeholder-text">Selecciona un partido para ver las predicciones de todos los participantes.</p>`;
            predictionsForSelectedMatchDiv.removeAttribute('data-current-match-id');
        }
    }

    matchSelectorForPredictions.addEventListener('change', (e) => {
        const selectedMatchId = e.target.value;
        renderPredictionsForSelectedMatch(selectedMatchId);
    });

    function renderPredictionsForSelectedMatch(matchId) {
        predictionsForSelectedMatchDiv.innerHTML = '';
        predictionsForSelectedMatchDiv.dataset.currentMatchId = matchId;

        if (!matchId) {
            predictionsForSelectedMatchDiv.innerHTML = `<p class="placeholder-text">Selecciona un partido para ver las predicciones de todos los participantes.</p>`;
            return;
        }

        const selectedMatch = partidos.find(m => m.id === matchId);
        if (!selectedMatch) {
            predictionsForSelectedMatchDiv.innerHTML = `<p class="placeholder-text">Partido no encontrado.</p>`;
            return;
        }

        const matchSummary = document.createElement('p');
        matchSummary.classList.add('match-summary');
        matchSummary.textContent = `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`;
        if (selectedMatch.finalScore) {
            matchSummary.textContent += ` - Marcador Final: ${selectedMatch.finalScore}`;
            matchSummary.style.color = '#28a745';
        } else {
             matchSummary.textContent += ` (Pendiente)`;
             matchSummary.style.color = '#ffc107';
        }
        predictionsForSelectedMatchDiv.appendChild(matchSummary);

        if (selectedMatch.predictions.length === 0 && participants.length === 0) {
            const noPredictionsText = document.createElement('p');
            noPredictionsText.classList.add('placeholder-text');
            noPredictionsText.textContent = 'Aún no hay participantes o predicciones para este partido.';
            predictionsForSelectedMatchDiv.appendChild(noPredictionsText);
            return;
        }

        participants.forEach(p => {
            const predictionEntry = document.createElement('div');
            predictionEntry.classList.add('prediction-entry');

            const participantName = document.createElement('strong');
            participantName.textContent = p.name;
            predictionEntry.appendChild(participantName);

            const participantPrediction = selectedMatch.predictions.find(pred => pred.participantId === p.id);
            const predictionScoreSpan = document.createElement('span');
            predictionScoreSpan.textContent = participantPrediction ? participantPrediction.score : 'N/A';

            if (selectedMatch.finalScore && participantPrediction) {
                if (participantPrediction.score === selectedMatch.finalScore) {
                    predictionEntry.classList.add('correct-prediction');
                } else {
                    predictionEntry.classList.add('incorrect-prediction');
                }
            }
            predictionEntry.appendChild(predictionScoreSpan);
            predictionsForSelectedMatchDiv.appendChild(predictionEntry);
        });
    }

    // --- Music Playback and Welcome Screen Logic ---

    // Function to start music
    function startMusic() {
        backgroundMusic.volume = 0.3;
        backgroundMusic.play().then(() => {
            console.log("Música iniciada por interacción del usuario.");
        }).catch(error => {
            console.warn("Autoplay de audio bloqueado por el navegador:", error);
            alert("No se pudo reproducir la música automáticamente. Tu navegador puede requerir una interacción adicional.");
        });
    }

    // Event listener for the "Enter" button on the welcome screen
    enterAppBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden'); // Add class to hide with animation
        setTimeout(() => {
            welcomeScreen.style.display = 'none'; // Completely hide after animation
            startMusic(); // Start music after screen fades out
        }, 800); // Match this with your fadeOutWelcome animation duration
    });


    // --- Initialization ---

    async function initialize() {
        await fetchData();
        renderParticipantsSelect();
        renderPartidos();
        renderPuntuacion();
        renderMatchSelectorForPredictions();

        // Initially hide the main content until the welcome screen is dismissed
        // This is implicitly handled by the welcome screen being fixed on top.
        // If you had main content hidden by default, you'd unhide it here.
    }

    initialize();
});