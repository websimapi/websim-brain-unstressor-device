document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('interactive-canvas');
    const ctx = canvas.getContext('2d');
    const statusValue = document.getElementById('status-value');
    const statusLight = document.querySelector('.status-light');
    const headerTitle = document.querySelector('.device-header h1');
    const addParticleBtn = document.getElementById('add-particle');
    const removeParticleBtn = document.getElementById('remove-particle');
    const particleCountSpan = document.getElementById('particle-count');
    const notificationEl = document.getElementById('notification');
    const discoveredShapesGallery = document.getElementById('discovered-shapes-gallery');
    const shapeControlsContainer = document.getElementById('shape-controls');

    let particlesArray = [];
    let animationFrameId;
    let hue = 0;
    let isDragging = false;

    // --- Shape Discovery ---
    const SHAPE_ANALYSIS_COOLDOWN = 10000; // 10 seconds
    const MIN_CLUSTER_SIZE = 5;
    let lastAnalysisTime = -SHAPE_ANALYSIS_COOLDOWN;
    let isAnalyzing = false;
    const discoveredShapeNames = new Set();
    const availableShapes = ['square', 'triangle', 'hexagon'];
    const unlockedShapes = ['circle'];
    let currentParticleShape = 'circle';
    
    // --- Particle Colors ---
    const colors = [
        '#00ffff', // Cyan
        '#ff00ff', // Magenta
        '#ffff00', // Yellow
        '#00ff00', // Green
        '#ff8800', // Orange
        '#8800ff', // Purple
    ];
    let currentColorIndex = 0;

    const mouse = {
        x: null,
        y: null,
        radius: 100,
    };

    function updateMousePosition(event) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.touches) {
            if (event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                return; // No touches, do nothing
            }
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        mouse.x = clientX - rect.left;
        mouse.y = clientY - rect.top;
    }

    // Mouse Events
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        updateMousePosition(event);
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            updateMousePosition(event);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        mouse.x = undefined;
        mouse.y = undefined;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        mouse.x = undefined;
        mouse.y = undefined;
    });

    // Touch Events
    canvas.addEventListener('touchstart', (event) => {
        isDragging = true;
        updateMousePosition(event);
        event.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
        if (isDragging) {
            updateMousePosition(event);
            event.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
        mouse.x = undefined;
        mouse.y = undefined;
    });

    canvas.addEventListener('touchcancel', () => {
        isDragging = false;
        mouse.x = undefined;
        mouse.y = undefined;
    });

    // Particle Controls
    function addParticles(count) {
        for (let i = 0; i < count; i++) {
            if (particlesArray.length >= 500) { // Max particles limit
                addParticleBtn.disabled = true;
                return;
            }
            let size = (Math.random() * 3) + 1;
            let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
        updateParticleCount();
        removeParticleBtn.disabled = particlesArray.length === 0;
    }

    function removeParticles(count) {
        particlesArray.splice(0, count);
        updateParticleCount();
        addParticleBtn.disabled = particlesArray.length >= 500;
        if (particlesArray.length === 0) {
            removeParticleBtn.disabled = true;
        }
    }

    function updateParticleCount() {
        particleCountSpan.textContent = particlesArray.length;
    }

    addParticleBtn.addEventListener('click', () => addParticles(10));
    removeParticleBtn.addEventListener('click', () => removeParticles(10));

    // --- Shape Controls ---
    function updateShapeControls() {
        shapeControlsContainer.innerHTML = '';
        unlockedShapes.forEach(shape => {
            const button = document.createElement('button');
            button.classList.add('shape-button');
            if (shape === currentParticleShape) {
                button.classList.add('active');
            }
            button.dataset.shape = shape;
            button.title = `Switch to ${shape}s`;

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute('viewBox', '0 0 24 24');
            const path = document.createElementNS(svgNS, 'path');

            switch (shape) {
                case 'circle':
                    path.setAttribute('d', 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z');
                    break;
                case 'square':
                    path.setAttribute('d', 'M3 3h18v18H3z');
                    break;
                case 'triangle':
                    path.setAttribute('d', 'M12 2L1 21h22L12 2z');
                    break;
                case 'hexagon':
                    path.setAttribute('d', 'M12 2l-10 6v12l10 6 10-6V8l-10-6z');
                    break;
            }
            svg.appendChild(path);
            button.appendChild(svg);
            
            button.addEventListener('click', () => {
                currentParticleShape = shape;
                document.querySelectorAll('.shape-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
            shapeControlsContainer.appendChild(button);
        });
    }

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        draw() {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            
            switch(currentParticleShape) {
                case 'square':
                    ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                    break;
                case 'triangle':
                    ctx.moveTo(this.x, this.y - this.size);
                    ctx.lineTo(this.x - this.size, this.y + this.size);
                    ctx.lineTo(this.x + this.size, this.y + this.size);
                    ctx.closePath();
                    break;
                case 'hexagon':
                     ctx.moveTo(this.x + this.size * Math.cos(0), this.y + this.size * Math.sin(0));
                     for (let i = 1; i <= 6; i++) {
                        ctx.lineTo(this.x + this.size * Math.cos(i * 2 * Math.PI / 6), this.y + this.size * Math.sin(i * 2 * Math.PI / 6));
                     }
                    break;
                case 'circle':
                default:
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                    break;
            }

            ctx.fill();
        }

        update() {
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            if (mouse.x !== undefined && mouse.y !== undefined) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius + this.size) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const moveX = (dx / distance) * force * 5;
                    const moveY = (dy / distance) * force * 5;
                    
                    if (mouse.x < this.x && this.x < canvas.width - this.size * 2) {
                        this.x += moveX;
                    }
                    if (mouse.x > this.x && this.x > this.size * 2) {
                        this.x += moveX;
                    }
                    if (mouse.y < this.y && this.y < canvas.height - this.size * 2) {
                        this.y += moveY;
                    }
                    if (mouse.y > this.y && this.y > this.size * 2) {
                        this.y += moveY;
                    }
                }
            }

            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 3) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            
            // Assign a color from the palette
            let color = colors[Math.floor(Math.random() * colors.length)];
            
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
        updateParticleCount();
        removeParticleBtn.disabled = particlesArray.length === 0;
        addParticleBtn.disabled = particlesArray.length >= 500;
    }
    
    function connect() {
        let opacityValue = 1;
        const baseColor = `hsl(${hue}, 100%, 50%)`;
        const connections = new Map();

        for (let i = 0; i < particlesArray.length; i++) {
            connections.set(i, []);
        }

        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                               ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();

                    connections.get(a).push(b);
                    connections.get(b).push(a);
                }
            }
        }
        
        const now = Date.now();
        if (!isAnalyzing && now - lastAnalysisTime > SHAPE_ANALYSIS_COOLDOWN) {
            analyzeShapes(connections);
        }
    }


    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        hue = (hue + 0.5) % 360;

        // Update UI colors
        const newColor = `hsl(${hue}, 100%, 50%)`;
        const newShadowColor = `hsl(${hue}, 100%, 60%)`;
        statusValue.style.color = newColor;
        statusLight.style.backgroundColor = newColor;
        statusLight.style.boxShadow = `0 0 10px ${newShadowColor}`;
        headerTitle.style.color = newColor;
        headerTitle.style.textShadow = `0 0 10px ${newShadowColor}, 0 0 20px ${newShadowColor}`;
        document.getElementById('audio-toggle').style.borderColor = newColor;
        
        // Update new controls color
        document.documentElement.style.setProperty('--current-color', newColor);
        document.querySelectorAll('.shape-button.active').forEach(btn => {
            btn.style.backgroundColor = newColor;
            btn.style.borderColor = newColor;
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        init();
        animate();
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    
    // --- Audio Controls ---
    const audio = document.getElementById('ambient-audio');
    const audioButton = document.getElementById('audio-toggle');
    const volumeIcon = document.getElementById('volume-icon');
    const muteIcon = document.getElementById('mute-icon');
    let isPlaying = false;
    let audioContext;

    audioButton.addEventListener('click', () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audio);
            source.connect(audioContext.destination);
        }

        if (isPlaying) {
            audio.pause();
            volumeIcon.style.display = 'block';
            muteIcon.style.display = 'none';
        } else {
            audio.play().catch(e => console.error("Audio play failed:", e));
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'block';
        }
        isPlaying = !isPlaying;
    });

    audio.onplay = () => { isPlaying = true; };
    audio.onpause = () => { isPlaying = false; };

    // --- Shape Analysis Logic ---
    function analyzeShapes(connections) {
        lastAnalysisTime = Date.now();
        isAnalyzing = true;

        const clusters = findClusters(connections);
        const largestCluster = clusters.reduce((largest, current) => 
            current.length > largest.length ? current : largest, []);

        if (largestCluster.length < MIN_CLUSTER_SIZE) {
            isAnalyzing = false;
            return;
        }

        getShapeNameFromAI(largestCluster);
    }

    function findClusters(connections) {
        const visited = new Set();
        const clusters = [];
        for (let i = 0; i < particlesArray.length; i++) {
            if (!visited.has(i)) {
                const cluster = [];
                const queue = [i];
                visited.add(i);
                while (queue.length > 0) {
                    const particleIndex = queue.shift();
                    cluster.push(particleIndex);
                    connections.get(particleIndex).forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    });
                }
                clusters.push(cluster);
            }
        }
        return clusters;
    }
    
    async function getShapeNameFromAI(clusterIndices) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const padding = 20;

        const points = clusterIndices.map(i => particlesArray[i]);
        const minX = Math.min(...points.map(p => p.x)) - padding;
        const minY = Math.min(...points.map(p => p.y)) - padding;
        const maxX = Math.max(...points.map(p => p.x)) + padding;
        const maxY = Math.max(...points.map(p => p.y)) + padding;

        tempCanvas.width = maxX - minX;
        tempCanvas.height = maxY - minY;
        
        tempCtx.fillStyle = '#000';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.strokeStyle = '#FFF';
        tempCtx.lineWidth = 2;

        for (let i = 0; i < clusterIndices.length; i++) {
            for (let j = i + 1; j < clusterIndices.length; j++) {
                const p1 = particlesArray[clusterIndices[i]];
                const p2 = particlesArray[clusterIndices[j]];
                 let distance = ((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2);
                 if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    tempCtx.beginPath();
                    tempCtx.moveTo(p1.x - minX, p1.y - minY);
                    tempCtx.lineTo(p2.x - minX, p2.y - minY);
                    tempCtx.stroke();
                 }
            }
        }

        const imageDataUrl = tempCanvas.toDataURL();
        
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are an imaginative expert in identifying pareidolia in abstract patterns. Look at the constellation of lines and describe what it most resembles in one or two simple, creative words (e.g., "Running Horse", "Cosmic Crab", "Stardust"). Do not mention lines, dots, or abstractness. Respond directly with JSON, following this JSON schema, and no other text. {"name": "Shape Name", "emoji": " EMOJI"}`
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'What does this abstract shape look like?' },
                            { type: 'image_url', image_url: { url: imageDataUrl } }
                        ],
                    }
                ],
                json: true,
            });

            const result = JSON.parse(completion.content);
            const shapeName = result.name.trim().toLowerCase();
            
            if (shapeName && !discoveredShapeNames.has(shapeName)) {
                discoveredShapeNames.add(shapeName);
                const newShapeUnlocked = unlockNextShape();
                showNotification(`New Discovery: ${result.name} ${result.emoji || ''}`, `You've unlocked the ${newShapeUnlocked} shape!`);
                addDiscoveredShapeToGallery(imageDataUrl, `${result.name} ${result.emoji || ''}`);
            }

        } catch (error) {
            console.error('AI shape analysis failed:', error);
        } finally {
            isAnalyzing = false;
        }
    }

    function unlockNextShape() {
        if (availableShapes.length > 0) {
            const newShape = availableShapes.shift();
            unlockedShapes.push(newShape);
            updateShapeControls();
            return newShape;
        }
        return null;
    }

    function showNotification(title, message) {
        notificationEl.innerHTML = `<strong>${title}</strong><p>${message || ''}</p>`;
        notificationEl.classList.add('show');
        setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 5000);
    }

    function addDiscoveredShapeToGallery(imageDataUrl, name) {
        const card = document.createElement('div');
        card.className = 'shape-card';
        card.innerHTML = `
            <img src="${imageDataUrl}" alt="${name}">
            <p>${name}</p>
        `;
        discoveredShapesGallery.prepend(card);
    }
    
    // Initial setup
    updateShapeControls();
    init();
});