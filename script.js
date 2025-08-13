document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('interactive-canvas');
    const ctx = canvas.getContext('2d');
    const statusValue = document.getElementById('status-value');
    const statusLight = document.querySelector('.status-light');
    const headerTitle = document.querySelector('.device-header h1');
    const addParticleBtn = document.getElementById('add-particle');
    const removeParticleBtn = document.getElementById('remove-particle');
    const particleCountSpan = document.getElementById('particle-count');

    let particlesArray = [];
    let animationFrameId;
    let hue = 0;
    let isDragging = false;

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
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
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

        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
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
                }
            }
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
});