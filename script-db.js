// YouTube API is loaded by the parent page

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
let timelineMarkers = [];
let collectedAnswers = [];
let sessionId = 'session_' + Date.now();

if (timelineTrack) {
    timelineTrack.addEventListener('click', onTimelineClick);
}

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
function onYouTubeIframeAPIReady() {
    initializeVideoPlayer();
}

function initializeVideoPlayer() {
    console.log('initializeVideoPlayer called');
    console.log('videoConfig type:', typeof videoConfig);
    console.log('videoConfig value:', window.videoConfig);
    
    // Use global videoConfig object
    if (typeof videoConfig !== 'undefined') {
        config = videoConfig;
        if (config.checkpoints) {
            config.checkpoints.sort((a, b) => a.timestamp - b.timestamp);
        }
        console.log('Initializing player with config:', config);
        console.log('Number of checkpoints:', config.checkpoints ? config.checkpoints.length : 0);
        initializePlayer(config.videoId);
    } else {
        console.error("Config not found. VideoConfig:", typeof videoConfig);
        // Retry after a short delay
        setTimeout(initializeVideoPlayer, 100);
    }
}

// Initialize when script loads if YouTube API is already ready
if (window.YT && window.YT.Player) {
    initializeVideoPlayer();
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
    console.log('Player ready, starting monitoring');
    duration = player.getDuration();
    console.log('Video duration:', duration);
    
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
        alert("This video cannot be played in an embedded player. The video owner has restricted it. Please try a different video ID in config.js.");
    } else {
        alert("An error occurred with the video player. Error code: " + event.data);
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
    console.log('Starting time monitoring');
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

    // Debug logging for first few seconds
    if (currentTime < 10) {
        console.log(`Time: ${currentTime.toFixed(1)}s, Next checkpoint: ${nextCheckpoint ? nextCheckpoint.timestamp : 'none'}, Index: ${currentCheckpointIndex}`);
    }

    // Check if we passed the checkpoint
    if (nextCheckpoint && currentTime >= nextCheckpoint.timestamp && !activeCheckpoints.has(currentCheckpointIndex)) {
        console.log('Triggering checkpoint:', nextCheckpoint);
        triggerCheckpoint(nextCheckpoint, currentCheckpointIndex);
    }
}

function triggerCheckpoint(checkpoint, index) {
    console.log('=== TRIGGERING CHECKPOINT ===');
    console.log('Checkpoint:', checkpoint);
    console.log('Index:', index);
    console.log('Question type:', checkpoint.type);
    console.log('Question text:', checkpoint.question);
    
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

    if (checkpoint.type === 'single_choice' && ratingContainer) {
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
                <span>Not Important</span>
                <span>Very Important</span>
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
    } else {
        // Default text question
        if (questionTextEl) {
            questionTextEl.textContent = checkpoint.question || 'Please answer this question:';
            questionTextEl.style.display = 'block';
        }
        if (answerInputEl) {
            answerInputEl.style.display = 'block';
        }
    }

    // Show overlay
    formOverlay.classList.remove('hidden');
    body.classList.add('form-active');
}

function setupTimeline() {
    console.log('=== SETTING UP TIMELINE ===');
    console.log('Config:', config);
    console.log('Checkpoints:', config?.checkpoints);
    console.log('Timeline track element:', timelineTrack);
    
    if (!config || !config.checkpoints) {
        console.log('No config or checkpoints, skipping timeline setup');
        return;
    }

    duration = player.getDuration();
    console.log('Video duration for timeline:', duration);
    
    // Clear existing markers
    const existingMarkers = timelineTrack.querySelectorAll('.timeline-marker');
    console.log('Removing existing markers:', existingMarkers.length);
    existingMarkers.forEach(marker => marker.remove());
    
    timelineMarkers = [];

    config.checkpoints.forEach((checkpoint, index) => {
        const percentage = (checkpoint.timestamp / duration) * 100;
        console.log(`Creating marker ${index}: ${checkpoint.timestamp}s = ${percentage.toFixed(1)}%`);
        
        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        marker.style.left = percentage + '%';
        marker.title = `Question at ${formatTime(checkpoint.timestamp)}`;
        
        console.log('Marker element:', marker);
        console.log('Appending to timeline track');
        timelineTrack.appendChild(marker);
        timelineMarkers.push(marker);
    });
    
    console.log('Timeline markers created:', timelineMarkers.length);
}

function updateTimelineLabels(currentTime) {
    if (timelineWatchedLabel) {
        timelineWatchedLabel.textContent = `Watched: ${formatTime(currentTime)}`;
    }
    if (timelineQuestionsLabel) {
        const answered = activeCheckpoints.size;
        const total = config ? config.checkpoints.length : 0;
        timelineQuestionsLabel.textContent = `Questions: ${answered} / ${total}`;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function onTimelineClick(event) {
    if (!player || !duration) return;
    
    const rect = timelineTrack.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * duration;
    
    player.seekTo(seekTime);
}

// Submit answer functionality - modified to use database
if (submitAnswerBtn) {
    submitAnswerBtn.addEventListener('click', async function() {
        submitAnswerBtn.disabled = true;

        // Get current checkpoint
        const currentCheckpoint = config.checkpoints[currentCheckpointIndex - 1];
        if (!currentCheckpoint) return;

        // Collect answer data
        let answer = '';
        const inputs = formOverlay.querySelectorAll('input, textarea');
        const selectedAnswers = [];
        
        inputs.forEach(input => {
            if (input.type === 'radio' && input.checked) {
                answer = input.value;
            } else if (input.type === 'checkbox' && input.checked) {
                selectedAnswers.push(input.value);
            } else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value) {
                answer = input.value;
            }
        });
        
        if (selectedAnswers.length > 0) {
            answer = selectedAnswers.join(', ');
        }

        // Get form ID from URL
        const pathParts = window.location.pathname.split('/');
        const formId = pathParts[pathParts.length - 1];

        try {
            // Submit to database
            const response = await fetch('/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_id: formId,
                    question_id: currentCheckpoint.id,
                    session_id: sessionId,
                    answer_data: { answer: answer },
                    video_timestamp: player && player.getCurrentTime ? Math.floor(player.getCurrentTime()) : currentCheckpoint.timestamp
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save response:', result.error);
            }

        } catch (error) {
            console.error('Error saving response:', error);
        }

        // Hide Overlay
        formOverlay.classList.add('hidden');
        body.classList.remove('form-active');

        // Resume Video
        if (player && player.playVideo) {
            player.playVideo();
        }

        submitAnswerBtn.disabled = false;
    });
}
