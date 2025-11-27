// Load YouTube IFrame API asynchronously
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let config = null;
let activeCheckpoints = new Set();
let currentCheckpointIndex = 0;
let timeCheckInterval;
let duration = 0;
const formOverlay = document.getElementById('formOverlay');
const body = document.body;
const timelineTrack = document.getElementById('timelineTrack');
const timelineProgress = document.getElementById('timelineProgress');
const timelineWatchedLabel = document.getElementById('timelineWatchedLabel');
const timelineQuestionsLabel = document.getElementById('timelineQuestionsLabel');
const ratingContainer = document.getElementById('ratingContainer');
const questionTextEl = document.getElementById('questionText');
const answerInputEl = document.getElementById('answerInput');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const GETFORM_ENDPOINT = 'https://formbold.com/s/oylaA';
let timelineMarkers = [];
let collectedAnswers = [];

if (timelineTrack) {
    timelineTrack.addEventListener('click', onTimelineClick);
}

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
function onYouTubeIframeAPIReady() {
    // Use global videoConfig object from config.js
    if (typeof videoConfig !== 'undefined') {
        config = videoConfig;
        if (config.checkpoints) {
            config.checkpoints.sort((a, b) => a.timestamp - b.timestamp);
        }
        initializePlayer(config.videoId);
    } else {
        console.error("Config not found. Make sure config.js is loaded.");
        alert("Fehler beim Laden der Videokonfiguration.");
    }
}

function initializePlayer(videoId) {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'fs': 0,
            'rel': 0,
            'disablekb': 1,
            'modestbranding': 1,
            'origin': (window.location.protocol === 'file:') ? undefined : window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    // Player is ready
    startMonitoring();
    setupTimeline();
    
    // Disable right-click context menu on video player
    const playerElement = document.getElementById('player');
    if (playerElement) {
        playerElement.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Also disable on the iframe inside
        const iframe = playerElement.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
        }
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    if (event.data === 150 || event.data === 101 || event.data === 153) {
        alert("Dieses Video kann nicht im eingebetteten Player abgespielt werden. Der Videobesitzer hat es eingeschränkt. Bitte versuchen Sie eine andere Video-ID in config.js.");
    } else {
        alert("Ein Fehler ist beim Videoplayer aufgetreten. Fehlercode: " + event.data);
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        startMonitoring();
    } else {
        stopMonitoring();
    }
}

function startMonitoring() {
    stopMonitoring(); // Clear existing interval if any
    timeCheckInterval = setInterval(checkTime, 500); // Check every 500ms
}

function stopMonitoring() {
    if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
        timeCheckInterval = null;
    }
}

function checkTime() {
    if (!player || !player.getCurrentTime || !config || !config.checkpoints) return;

    const currentTime = player.getCurrentTime();
    if (duration && timelineProgress) {
        const pct = Math.min(100, (currentTime / duration) * 100);
        timelineProgress.style.width = pct + '%';
    }

    updateTimelineLabels(currentTime);
    const nextCheckpoint = config.checkpoints[currentCheckpointIndex];

    // Check if we passed the checkpoint
    if (nextCheckpoint && currentTime >= nextCheckpoint.timestamp && !activeCheckpoints.has(currentCheckpointIndex)) {
        triggerCheckpoint(nextCheckpoint, currentCheckpointIndex);
    }
}

function triggerCheckpoint(checkpoint, index) {
    player.pauseVideo();
    activeCheckpoints.add(index);
    currentCheckpointIndex++;

    if (timelineMarkers[index]) {
        timelineMarkers[index].classList.add('completed');
    }

    if (player && player.getCurrentTime) {
        updateTimelineLabels(player.getCurrentTime());
    }

    // Clear and set question UI based on checkpoint type
    if (answerInputEl) {
        answerInputEl.value = '';
    }

    // Default: hide rating container
    if (ratingContainer) {
        ratingContainer.innerHTML = '';
    }

    if (checkpoint.type === 'rating_block' && ratingContainer) {
        // Build a small table-like layout with rating options
        const title = document.createElement('h3');
        title.className = 'rating-title';
        title.textContent = checkpoint.title || '';
        ratingContainer.appendChild(title);

        if (checkpoint.description) {
            const desc = document.createElement('p');
            desc.className = 'rating-description';
            desc.textContent = checkpoint.description;
            ratingContainer.appendChild(desc);
        }

        const headerRow = document.createElement('div');
        headerRow.className = 'rating-row rating-header-row';
        headerRow.innerHTML = '<span class="rating-label"></span><span class="rating-option">Würde ich nicht nutzen</span><span class="rating-option">Neutral</span><span class="rating-option">Gefällt mir sehr</span>';
        ratingContainer.appendChild(headerRow);

        if (Array.isArray(checkpoint.features)) {
            checkpoint.features.forEach(feature => {
                const row = document.createElement('div');
                row.className = 'rating-row';

                const safeId = String(feature.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
                const name = `rating_${checkpoint.id || 'block'}_${safeId}`;

                row.innerHTML = `
                    <span class="rating-label">${feature.label || ''}</span>
                    <label class="rating-option"><input type="radio" name="${name}" value="would_not_use">Würde ich nicht nutzen</label>
                    <label class="rating-option"><input type="radio" name="${name}" value="neutral">Neutral</label>
                    <label class="rating-option"><input type="radio" name="${name}" value="love_it">Gefällt mir sehr</label>
                `;

                ratingContainer.appendChild(row);
            });
        }

        if (questionTextEl) {
            questionTextEl.textContent = checkpoint.freeTextLabel || 'Haben Sie weitere Gedanken zu dieser Kategorie?';
        }
    } else if (checkpoint.type === 'scale_1_to_5' && ratingContainer) {
        // Build a 1-5 scale rating
        const title = document.createElement('h3');
        title.className = 'rating-title';
        title.textContent = checkpoint.question || '';
        ratingContainer.appendChild(title);

        const scaleRow = document.createElement('div');
        scaleRow.className = 'scale-row';
        
        const name = `scale_${checkpoint.id || 'question'}`;
        scaleRow.innerHTML = `
            <div class="scale-labels">
                <span>Nicht wichtig</span>
                <span>Sehr wichtig</span>
            </div>
            <div class="scale-options">
                <label class="scale-option"><input type="radio" name="${name}" value="1"><span>1</span></label>
                <label class="scale-option"><input type="radio" name="${name}" value="2"><span>2</span></label>
                <label class="scale-option"><input type="radio" name="${name}" value="3"><span>3</span></label>
                <label class="scale-option"><input type="radio" name="${name}" value="4"><span>4</span></label>
                <label class="scale-option"><input type="radio" name="${name}" value="5"><span>5</span></label>
            </div>
        `;
        ratingContainer.appendChild(scaleRow);

        // Hide the text input for scale questions
        if (answerInputEl) {
            answerInputEl.style.display = 'none';
        }
        if (questionTextEl) {
            questionTextEl.style.display = 'none';
        }
    } else if (checkpoint.type === 'single_choice' && ratingContainer) {
        // Build single choice options
        const title = document.createElement('h3');
        title.className = 'rating-title';
        title.textContent = checkpoint.question || '';
        ratingContainer.appendChild(title);

        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'choice-container';
        
        const name = `choice_${checkpoint.id || 'question'}`;
        if (Array.isArray(checkpoint.options)) {
            checkpoint.options.forEach((option, index) => {
                const choiceRow = document.createElement('div');
                choiceRow.className = 'choice-row';
                choiceRow.innerHTML = `
                    <label class="choice-option">
                        <input type="radio" name="${name}" value="${option}">
                        <span>${option}</span>
                    </label>
                `;
                choiceContainer.appendChild(choiceRow);
            });
        }
        ratingContainer.appendChild(choiceContainer);

        // Hide the text input for choice questions
        if (answerInputEl) {
            answerInputEl.style.display = 'none';
        }
        if (questionTextEl) {
            questionTextEl.style.display = 'none';
        }
    } else if (checkpoint.type === 'matrix' && ratingContainer) {
        // Build matrix rating
        const title = document.createElement('h3');
        title.className = 'rating-title';
        title.textContent = checkpoint.question || '';
        ratingContainer.appendChild(title);

        // Create header row
        const headerRow = document.createElement('div');
        headerRow.className = 'rating-row rating-header-row';
        let headerHtml = '<span class="rating-label"></span>';
        if (Array.isArray(checkpoint.columns)) {
            checkpoint.columns.forEach(col => {
                headerHtml += `<span class="rating-option">${col}</span>`;
            });
        }
        headerRow.innerHTML = headerHtml;
        ratingContainer.appendChild(headerRow);

        // Create rows for each item
        if (Array.isArray(checkpoint.rows)) {
            checkpoint.rows.forEach(row => {
                const matrixRow = document.createElement('div');
                matrixRow.className = 'rating-row';
                
                const safeId = String(row || '').replace(/[^a-zA-Z0-9_-]/g, '_');
                const name = `matrix_${checkpoint.id || 'question'}_${safeId}`;
                
                let rowHtml = `<span class="rating-label">${row}</span>`;
                if (Array.isArray(checkpoint.columns)) {
                    checkpoint.columns.forEach(col => {
                        const safeCol = String(col || '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
                        rowHtml += `<label class="rating-option"><input type="radio" name="${name}" value="${safeCol}">${col}</label>`;
                    });
                }
                matrixRow.innerHTML = rowHtml;
                ratingContainer.appendChild(matrixRow);
            });
        }

        if (questionTextEl) {
            questionTextEl.textContent = checkpoint.freeTextLabel || 'Haben Sie zusätzliche Kommentare?';
        }
    } else {
        // Simple text question
        if (answerInputEl) {
            answerInputEl.style.display = 'block';
        }
        if (questionTextEl) {
            questionTextEl.style.display = 'block';
            questionTextEl.textContent = checkpoint.question || 'Bitte beantworten Sie diese Frage:';
        }
    }

    // Store context on the submit button
    if (submitAnswerBtn) {
        submitAnswerBtn.dataset.questionId = checkpoint.id || `q${index + 1}`;
        submitAnswerBtn.dataset.checkpointIndex = index;
        submitAnswerBtn.dataset.videoTime = player && player.getCurrentTime ? String(player.getCurrentTime()) : '0';
    }

    // Show Overlay
    formOverlay.classList.remove('hidden');
    body.classList.add('form-active');

    // On mobile, scroll to form
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            formOverlay.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

function onTimelineClick(event) {
    if (!player || !player.seekTo || !duration || !timelineTrack) return;

    const rect = timelineTrack.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width || 1;
    let pct = clickX / width;
    pct = Math.max(0, Math.min(1, pct));

    const newTime = pct * duration;
    if (isNaN(newTime)) return;

    const state = player.getPlayerState ? player.getPlayerState() : null;

    player.seekTo(newTime, true);

    // If the video was playing before, keep it playing after seek
    if (typeof YT !== 'undefined' && YT.PlayerState && state === YT.PlayerState.PLAYING) {
        player.playVideo();
    }

    // Update UI immediately for responsiveness
    if (timelineProgress) {
        timelineProgress.style.width = (pct * 100) + '%';
    }
    updateTimelineLabels(newTime);
}

function setupTimeline() {
    if (!player || !player.getDuration || !config || !config.checkpoints || !timelineTrack) return;

    const d = player.getDuration();
    if (!d || isNaN(d) || d === Infinity) {
        setTimeout(setupTimeline, 500);
        return;
    }

    duration = d;

    timelineMarkers.forEach(marker => marker.remove());
    timelineMarkers = [];

    const totalCheckpoints = config.checkpoints.length;

    config.checkpoints.forEach((checkpoint, index) => {
        const position = Math.min(100, (checkpoint.timestamp / duration) * 100);
        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        marker.style.left = position + '%';
        timelineTrack.appendChild(marker);
        timelineMarkers.push(marker);
    });

    updateTimelineLabels(0);
}

function updateTimelineLabels(currentTime) {
    if (timelineWatchedLabel) {
        timelineWatchedLabel.textContent = 'Angesehen: ' + formatTime(currentTime);
    }

    if (timelineQuestionsLabel && config && config.checkpoints) {
        const total = config.checkpoints.length;
        const answered = activeCheckpoints.size;
        timelineQuestionsLabel.textContent = 'Fragen: ' + answered + ' / ' + total;
    }
}

function formatTime(seconds) {
    const totalSeconds = Math.floor(seconds || 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins + ':' + (secs < 10 ? '0' + secs : secs);
}

function csvEscape(value) {
    const v = value == null ? '' : String(value);
    const needsQuotes = /[",\n]/.test(v);
    const escaped = v.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

function answersToCsv(entries) {
    const ratingKeysSet = new Set();
    entries.forEach(entry => {
        if (entry && entry.ratings) {
            Object.keys(entry.ratings).forEach(key => ratingKeysSet.add(key));
        }
    });

    const ratingKeys = Array.from(ratingKeysSet).sort();
    const headers = ['session_id', 'question_id', 'checkpoint_index', 'video_time', 'answer'].concat(ratingKeys);
    const lines = [];
    lines.push(headers.map(csvEscape).join(','));

    entries.forEach(entry => {
        const base = [
            entry.session_id,
            entry.question_id,
            entry.checkpoint_index,
            entry.video_time,
            entry.answer
        ];
        const ratingValues = ratingKeys.map(key => (entry.ratings && entry.ratings[key]) || '');
        const row = base.concat(ratingValues);
        lines.push(row.map(csvEscape).join(','));
    });

    return lines.join('\n');
}

// Submit Answer Button Logic
if (submitAnswerBtn && answerInputEl) {
    submitAnswerBtn.addEventListener('click', async () => {
        submitAnswerBtn.disabled = true;
        const answer = answerInputEl.value.trim();

        const questionId = submitAnswerBtn.dataset.questionId || '';
        const checkpointIndex = submitAnswerBtn.dataset.checkpointIndex || '';
        const videoTime = submitAnswerBtn.dataset.videoTime || '';

        // Collect rating values if present into an object
        const ratings = {};
        if (ratingContainer) {
            const ratingInputs = ratingContainer.querySelectorAll('input[type="radio"]');
            const seenNames = new Set();
            ratingInputs.forEach(input => {
                if (!input.name || seenNames.has(input.name)) return;
                seenNames.add(input.name);
                const selected = ratingContainer.querySelector(`input[name="${input.name}"]:checked`);
                if (selected) {
                    ratings[input.name] = selected.value;
                }
            });
        }

        if (!window._sessionId) {
            window._sessionId = Math.random().toString(36).slice(2);
        }

        const entry = {
            question_id: questionId,
            answer,
            checkpoint_index: checkpointIndex,
            video_time: videoTime,
            ratings,
            session_id: window._sessionId
        };
        collectedAnswers.push(entry);

        const isLastCheckpoint =
            config &&
            Array.isArray(config.checkpoints) &&
            Number(checkpointIndex) === config.checkpoints.length - 1;

        if (isLastCheckpoint) {
            const formData = new FormData();
            formData.append('session_id', window._sessionId);

            const fields = {};

            collectedAnswers.forEach(entry => {
                const qId = entry.question_id || '';
                if (!qId) {
                    return;
                }

                if (entry.answer) {
                    fields[`${qId}_answer`] = entry.answer;
                }

                if (entry.ratings) {
                    Object.keys(entry.ratings).forEach(key => {
                        const value = entry.ratings[key];
                        if (!value) return;

                        const expectedPrefix = `rating_${qId}_`;
                        let featurePart;
                        if (key.startsWith(expectedPrefix)) {
                            featurePart = key.slice(expectedPrefix.length);
                        } else if (key.startsWith('rating_')) {
                            featurePart = key.slice('rating_'.length);
                        } else {
                            featurePart = key;
                        }

                        const fieldName = `${qId}_rating_${featurePart}`;
                        fields[fieldName] = value;
                    });
                }
            });

            Object.keys(fields).forEach(name => {
                formData.append(name, fields[name]);
            });

            try {
                await fetch(GETFORM_ENDPOINT, {
                    method: 'POST',
                    body: formData
                });

                collectedAnswers = [];
            } catch (e) {
                console.error('Error submitting answers to Formbold', e);
                alert('Beim Übermitteln Ihrer Antworten ist ein Problem aufgetreten. Bitte versuchen Sie es erneut.');
                submitAnswerBtn.disabled = false;
                return;
            }
        } else {
            // Not the last checkpoint: allow button to be used again on the next overlay
            submitAnswerBtn.disabled = false;
        }

        // Hide Overlay
        formOverlay.classList.add('hidden');
        body.classList.remove('form-active');

        // Resume Video
        if (player && player.playVideo) {
            player.playVideo();
        }
    });
}
