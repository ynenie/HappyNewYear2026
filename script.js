// Canvas setup with performance optimization
const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Device detection (cache để không phải check lại mỗi frame)
let isMobile = false;
let isSmallMobile = false;
let scaleFactor = 1;

function updateDeviceSettings() {
    const width = window.innerWidth;
    isSmallMobile = width < 480;
    isMobile = width < 768;
    
    if (isSmallMobile) {
        scaleFactor = 0.6;
    } else if (width < 768) {
        scaleFactor = 0.75;
    } else if (width < 1024) {
        scaleFactor = 0.9;
    } else {
        scaleFactor = 1;
    }
}
updateDeviceSettings();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateDeviceSettings();
});

// ===== AUDIO SYNTHESIS =====
let audioContext = null;
let audioResumed = false;

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('AudioContext creation failed:', e);
            return;
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => {
            console.log('AudioContext resume will wait for user interaction');
        });
    }
}

// Resume audio on first user interaction
function resumeAudioOnInteraction() {
    if (!audioResumed && audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            audioResumed = true;
            console.log('Audio enabled');
        }).catch(e => {
            console.log('Audio resume failed:', e);
        });
    }
}

// Add event listeners for first interaction
document.addEventListener('click', resumeAudioOnInteraction, { once: true });
document.addEventListener('touchstart', resumeAudioOnInteraction, { once: true });
document.addEventListener('keydown', resumeAudioOnInteraction, { once: true });

function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function playLaunchSound() {
    if (!audioContext) return;
    
    // Tiếng rít nhẹ khi bay
    const whistle = audioContext.createOscillator();
    const whistleGain = audioContext.createGain();
    
    whistle.frequency.setValueAtTime(600, audioContext.currentTime);
    whistle.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
    
    whistle.connect(whistleGain);
    whistleGain.connect(audioContext.destination);
    
    whistleGain.gain.setValueAtTime(0.08, audioContext.currentTime);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    whistle.start(audioContext.currentTime);
    whistle.stop(audioContext.currentTime + 0.3);
}

function playExplosionSound() {
    if (!audioContext) return;
    
    // ===== Tiếng "BÙM" chính - Sử dụng white noise thật với nhiều lớp tần số =====
    
    // Tạo white noise buffer dài hơn cho âm thanh tự nhiên
    const bufferSize = audioContext.sampleRate * 0.8;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    // Layer 1: Sub-bass rumble (20-120Hz) - Tiếng "rung" sâu
    const subBass = audioContext.createBufferSource();
    subBass.buffer = noiseBuffer;
    const subBassFilter = audioContext.createBiquadFilter();
    subBassFilter.type = 'lowpass';
    subBassFilter.frequency.setValueAtTime(120, audioContext.currentTime);
    subBassFilter.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.6);
    subBassFilter.Q.value = 3;
    const subBassGain = audioContext.createGain();
    subBass.connect(subBassFilter);
    subBassFilter.connect(subBassGain);
    subBassGain.connect(audioContext.destination);
    subBassGain.gain.setValueAtTime(0, audioContext.currentTime);
    subBassGain.gain.linearRampToValueAtTime(0.9, audioContext.currentTime + 0.015);
    subBassGain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
    subBassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
    subBass.start(audioContext.currentTime);
    subBass.stop(audioContext.currentTime + 0.8);
    
    // Layer 2: Body thump (150-600Hz) - Thân tiếng "BÙM"
    const body = audioContext.createBufferSource();
    body.buffer = noiseBuffer;
    const bodyFilter1 = audioContext.createBiquadFilter();
    bodyFilter1.type = 'lowpass';
    bodyFilter1.frequency.value = 600;
    bodyFilter1.Q.value = 1.5;
    const bodyFilter2 = audioContext.createBiquadFilter();
    bodyFilter2.type = 'highpass';
    bodyFilter2.frequency.value = 150;
    const bodyGain = audioContext.createGain();
    body.connect(bodyFilter1);
    bodyFilter1.connect(bodyFilter2);
    bodyFilter2.connect(bodyGain);
    bodyGain.connect(audioContext.destination);
    bodyGain.gain.setValueAtTime(0, audioContext.currentTime);
    bodyGain.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.12);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    body.start(audioContext.currentTime);
    body.stop(audioContext.currentTime + 0.6);
    
    // Layer 3: Sharp snap (1500Hz+) - Tiếng "sắc" lúc đầu
    const snap = audioContext.createBufferSource();
    snap.buffer = noiseBuffer;
    const snapFilter = audioContext.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.value = 1500;
    snapFilter.Q.value = 0.8;
    const snapGain = audioContext.createGain();
    snap.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(audioContext.destination);
    snapGain.gain.setValueAtTime(0, audioContext.currentTime);
    snapGain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.008);
    snapGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    snap.start(audioContext.currentTime);
    snap.stop(audioContext.currentTime + 0.2);
    
    // Layer 4: Mid punch (400-1200Hz) - Độ đầy
    const punch = audioContext.createBufferSource();
    punch.buffer = noiseBuffer;
    const punchFilter = audioContext.createBiquadFilter();
    punchFilter.type = 'bandpass';
    punchFilter.frequency.value = 800;
    punchFilter.Q.value = 1.2;
    const punchGain = audioContext.createGain();
    punch.connect(punchFilter);
    punchFilter.connect(punchGain);
    punchGain.connect(audioContext.destination);
    punchGain.gain.setValueAtTime(0, audioContext.currentTime);
    punchGain.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.01);
    punchGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    punch.start(audioContext.currentTime);
    punch.stop(audioContext.currentTime + 0.4);
    
    // ===== Tiếng "nhũng nhũng" sau khi nổ =====
    
    // Tạo nhiều tiếng crackling liên tục
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const crackleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate);
            const crackleData = crackleBuffer.getChannelData(0);
            for (let j = 0; j < crackleData.length; j++) {
                crackleData[j] = Math.random() * 2 - 1;
            }
            
            const crackle = audioContext.createBufferSource();
            crackle.buffer = crackleBuffer;
            
            const crackleFilter = audioContext.createBiquadFilter();
            crackleFilter.type = 'highpass';
            crackleFilter.frequency.value = 1500 + Math.random() * 2000;
            
            const crackleGain = audioContext.createGain();
            
            crackle.connect(crackleFilter);
            crackleFilter.connect(crackleGain);
            crackleGain.connect(audioContext.destination);
            
            const volume = (0.15 + Math.random() * 0.1) * (1 - i / 30); // Giảm dần
            crackleGain.gain.setValueAtTime(volume, audioContext.currentTime);
            crackleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            
            crackle.start(audioContext.currentTime);
            crackle.stop(audioContext.currentTime + 0.1);
        }, 80 + i * 60 + Math.random() * 40); // Timing ngẫu nhiên
    }
}

// ===== COUNTDOWN BEEP SOUND =====
function playCountdownBeep(isZero = false) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (isZero) {
        // Số 0: Tiếng "GO!" dramatic với sweep lên cao
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Bắt đầu thấp
        oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.5); // Sweep lên cao
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
        
        // Thêm harmonic thứ 2 (octave cao)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(400, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(3000, audioContext.currentTime + 0.4);
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
        
        // Thêm low rumble cho dramatic effect
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.setValueAtTime(100, audioContext.currentTime);
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc3.start(audioContext.currentTime);
        osc3.stop(audioContext.currentTime + 0.3);
    } else {
        // Số 10-1: Tiếng beep ngắn
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // G5
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

// ===== OPTIMIZED PARTICLE CLASS - CHI TIẾT HƠN =====
class Particle {
    constructor(x, y, colors, isOuter = false, type = 'inner') {
        this.x = x;
        this.y = y;
        this.isOuter = isOuter;
        this.type = type;
        
        const angle = Math.random() * Math.PI * 2;
        let speed, size, decay, maxTrail;
        
        // Cấu hình theo từng loại particle
        switch(type) {
            case 'outer':  // Vòng ngoài vàng
                speed = Math.random() * 2.5 + 6.5;  // Tăng từ 5.5 → 6.5
                size = (Math.random() * 1.8 + 2.8) * scaleFactor;
                decay = 0.0025;  // Giảm từ 0.003 → 0.0025
                maxTrail = 14;
                this.color = '#ffaa44';
                break;
                
            case 'middle':  // Vòng giữa màu chính
                speed = Math.random() * 2 + 5;  // Tăng từ 4 → 5
                size = (Math.random() * 1.5 + 2) * scaleFactor;
                decay = 0.003;  // Giảm từ 0.0035 → 0.003
                maxTrail = 10;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                break;
                
            case 'inner':  // Lõi trong
                speed = Math.random() * 1.5 + 3.5;  // Tăng từ 2.5 → 3.5
                size = (Math.random() * 1.2 + 1.5) * scaleFactor;
                decay = 0.0035;  // Giảm từ 0.004 → 0.0035
                maxTrail = 8;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                break;
                
            case 'spark':  // Tia lửa nhỏ
                speed = Math.random() * 3 + 7;  // Tăng từ 6 → 7
                size = (Math.random() * 0.8 + 0.8) * scaleFactor;
                decay = 0.005;  // Giảm từ 0.006 → 0.005
                maxTrail = 6;
                this.color = '#ffdd88';
                break;
                
            case 'glitter':  // Sáng lấp lánh
                speed = Math.random() * 1 + 2;  // Tăng từ 1.5 → 2
                size = (Math.random() * 1 + 1.2) * scaleFactor;
                decay = 0.004;  // Giảm từ 0.005 → 0.004
                maxTrail = 4;
                this.color = '#ffffee';
                this.twinkle = true;  // Hiệu ứng nhấp nháy
                this.twinkleSpeed = Math.random() * 0.1 + 0.05;
                break;
                
            case 'mini':  // Nổ phụ
                speed = Math.random() * 2 + 2;
                size = (Math.random() * 1 + 1) * scaleFactor;
                decay = 0.007;
                maxTrail = 5;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                break;
                
            default:
                speed = Math.random() * 2 + 3;
                size = (Math.random() * 1.5 + 1.5) * scaleFactor;
                decay = 0.004;
                maxTrail = 6;
                this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        this.vx = Math.cos(angle) * speed * scaleFactor;
        this.vy = Math.sin(angle) * speed * scaleFactor;
        
        this.alpha = 1;
        this.decay = decay;
        this.gravity = 0.02 * scaleFactor;  // Giảm từ 0.05 → 0.02 để bay lâu hơn
        this.friction = 0.993;  // Tăng từ 0.988 → 0.993 để giữ vận tốc lâu hơn
        this.size = size;
        this.maxTrail = maxTrail;
        
        this.trail = [];
        this.age = 0;
        this.fadingColor = this.color;
    }

    update() {
        this.age++;
        
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        
        // GIAI ĐOẠN NỞ (0-50 frames): Giảm friction để bay xa hơn, tạo hình cầu to
        // GIAI ĐOẠN RƠI (50+ frames): Friction bình thường + gravity
        const expansionPhase = this.age <= 50;  // Tăng từ 30 → 50 frames
        const currentFriction = expansionPhase ? 0.997 : this.friction;  // Tăng từ 0.996 → 0.997
        
        this.vx *= currentFriction;
        this.vy *= currentFriction;
        
        // Gravity chỉ áp dụng sau giai đoạn nở
        if (!expansionPhase) {
            this.vy += this.gravity;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.alpha -= this.decay;
        
        // Hiệu ứng twinkle cho glitter
        if (this.twinkle) {
            this.alpha = Math.max(0, this.alpha - this.decay) * (0.7 + Math.sin(this.age * this.twinkleSpeed) * 0.3);
        }
        
        // Chuyển màu khi rơi (trừ spark và glitter)
        if (this.age > 30 && this.type !== 'spark' && this.type !== 'glitter') {
            const fadeProgress = (this.age - 30) / 60;
            if (fadeProgress < 1) {
                if (this.type !== 'outer') {
                    const orangeShades = ['#ff8844', '#ff6633', '#ff4422'];
                    const index = Math.floor(fadeProgress * 2);
                    this.fadingColor = orangeShades[Math.min(index, orangeShades.length - 1)];
                }
            }
        }
    }

    draw() {
        // T\u1ed0I \u01afU: D\u00f9ng global device cache thay v\u00ec check m\u1ed7i frame
        const isFading = this.alpha < 0.3;
        const fadeProgress = isFading ? (this.alpha / 0.3) : 1;
        
        // Draw trail - Enabled on all devices for beautiful effects
        if (this.type !== 'glitter' && !isFading && this.trail.length > 1) {
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.strokeStyle = this.fadingColor;
            ctx.lineWidth = this.size * 0.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw particle - Unified gradient rendering for all devices
        ctx.globalAlpha = this.alpha;
        
        let currentSize = this.size;
        if (isFading) {
            currentSize = this.size * (0.3 + fadeProgress * 0.7);
        }
        
        // Unified beautiful rendering with gradient for all devices
        const glowSize = (this.type === 'outer' || this.type === 'glitter') ? 3 : 2.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentSize * glowSize);
        
        if (isFading) {
            gradient.addColorStop(0, this.fadingColor);
            gradient.addColorStop(0.3, hexToRgba(this.fadingColor, 0.6 * fadeProgress));
            gradient.addColorStop(0.7, hexToRgba(this.fadingColor, 0.2 * fadeProgress));
            gradient.addColorStop(1, 'transparent');
        } else {
            gradient.addColorStop(0, this.fadingColor);
            gradient.addColorStop(0.5, hexToRgba(this.fadingColor, 0.4));
            gradient.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = gradient;
        const gSize = currentSize * glowSize;
        ctx.fillRect(this.x - gSize, this.y - gSize, gSize * 2, gSize * 2);
        
        // Core with shadow - slightly reduced on mobile
        const shadowBlurValue = isMobile ? (isFading ? 8 : 5) : (isFading ? 10 : 6);
        ctx.shadowBlur = shadowBlurValue;
        ctx.shadowColor = this.fadingColor;
        ctx.fillStyle = this.fadingColor;
        ctx.fillRect(this.x - currentSize * 0.5, this.y - currentSize * 0.5, currentSize, currentSize);
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 1;
    }
}

// ===== ROCKET CLASS =====
class Rocket {
    constructor(x, y, targetY, colors) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.colors = colors;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -12; // Bay nhanh hơn để nổ sớm, giảm lag
        this.exploded = false;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        const maxTrail = isMobile ? 5 : 7; // Dùng global cache thay vì check
        if (this.trail.length > maxTrail) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Tăng gravity để nhanh hơn

        if (this.y <= this.targetY || this.vy >= 0) {
            this.exploded = true;
        }
    }

    draw() {
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

// Arrays
const rockets = [];
const particles = [];

// Color sets - chỉ màu đẹp: vàng cam, đỏ cam, trắng sáng
const colorSets = [
    ['#ffaa00', '#ff8800', '#ffcc44'],  // Vàng cam
    ['#ff4422', '#ff3300', '#ff6633'],  // Đỏ cam
    ['#ffffff', '#ffffee', '#ffffcc'],  // Trắng sáng (trăng)
];

// Create explosion - tối ưu với device caching
function createExplosion(x, y, colors) {
    // Sử dụng device settings đã cache thay vì check lại
    let baseMultiplier;
    
    if (isSmallMobile) {
        baseMultiplier = 0.4;
    } else if (isMobile) {
        baseMultiplier = 0.5;
    } else {
        baseMultiplier = 0.85;
    }
    
    // === LỚP 1: Outer Ring - Vòng ngoài vàng đậm ===
    const outerCount = Math.floor(50 * baseMultiplier);  // Tăng 30 → 50
    for (let i = 0; i < outerCount; i++) {
        particles.push(new Particle(x, y, colors, true, 'outer'));
    }
    
    // === LỚP 2: Middle Ring - Vòng giữa màu chính ===
    const middleCount = Math.floor(70 * baseMultiplier);  // Tăng 45 → 70
    for (let i = 0; i < middleCount; i++) {
        particles.push(new Particle(x, y, colors, false, 'middle'));
    }
    
    // === LỚP 3: Inner Core - Lõi trong sáng ===
    const innerCount = Math.floor(55 * baseMultiplier);  // Tăng 35 → 55
    for (let i = 0; i < innerCount; i++) {
        particles.push(new Particle(x, y, colors, false, 'inner'));
    }
    
    // === LỚP 4: Sparks - Tia lửa nhỏ li ti ===
    const sparksCount = Math.floor(80 * baseMultiplier);  // Tăng 50 → 80
    for (let i = 0; i < sparksCount; i++) {
        particles.push(new Particle(x, y, colors, false, 'spark'));
    }
    
    // === LỚP 5: Glitter - Sáng lấp lánh (GIỮ TRÊN MOBILE) ===
    const glitterCount = Math.floor(40 * baseMultiplier);  // Tăng 25 → 40, bật mobile
    for (let i = 0; i < glitterCount; i++) {
        particles.push(new Particle(x, y, colors, false, 'glitter'));
    }
    
    // Secondary mini explosions (tăng số lượng)
    if (!isMobile) {
        setTimeout(() => {
            const miniCount = 3;  // Tăng 2 → 3
            for (let i = 0; i < miniCount; i++) {
                const offset = 30 + Math.random() * 50;
                const angle = Math.random() * Math.PI * 2;
                const mx = x + Math.cos(angle) * offset;
                const my = y + Math.sin(angle) * offset;
                
                for (let j = 0; j < Math.floor(25 * baseMultiplier); j++) {  // Tăng 15 → 25
                    particles.push(new Particle(mx, my, colors, false, 'mini'));
                }
            }
        }, 200);
    }
    
    playExplosionSound();
}

// Launch rocket
function launchRocket() {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    
    // Dùng cached device settings
    let minY, maxY;
    if (isMobile) {
        // Mobile: nổ cao hơn - 10%-35% màn hình từ trên xuống
        minY = canvas.height * 0.10;
        maxY = canvas.height * 0.35;
    } else {
        // Desktop: nổ tại 15%-50%
        minY = canvas.height * 0.15;
        maxY = canvas.height * 0.50;
    }
    
    const targetY = Math.random() * (maxY - minY) + minY;
    const colors = colorSets[Math.floor(Math.random() * colorSets.length)];
    
    rockets.push(new Rocket(x, y, targetY, colors));
}

// Animation loop - TỐI ƯU HOÀN TOÀN
let lastTime = 0;
let frameCount = 0;

function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    
    // FPS throttle for mobile - cải thiện logic
    if (isMobile && particles.length > 80) {
        frameCount++;
        // Skip mỗi frame thứ 2 khi có nhiều particles
        if (frameCount % 2 === 0) {
            requestAnimationFrame(animate);
            return;
        }
    }
    
    lastTime = currentTime;
    
    // Clear with optimized fade
    const fadeAlpha = isMobile ? 0.08 : 0.12;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        rockets[i].update();
        rockets[i].draw();

        if (rockets[i].exploded) {
            createExplosion(rockets[i].x, rockets[i].y, rockets[i].colors);
            rockets.splice(i, 1);
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].alpha <= 0 || particles[i].y > canvas.height) {
            particles.splice(i, 1);
        }
    }
    
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
}

// Auto launch - tối ưu delay
function autoLaunch() {
    // Dùng cached device check
    const numRockets = isMobile ? 1 : (Math.random() > 0.85 ? 2 : 1);
    
    for (let i = 0; i < numRockets; i++) {
        setTimeout(() => {
            launchRocket();
        }, i * 500);
    }
    
    // Delay tối ưu cho từng device
   const minDelay = isMobile ? 2800 : 2200;
    const maxDelay = isMobile ? 5000 : 4000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    setTimeout(autoLaunch, delay);
}

// Click/Touch to launch
function handleInteraction(x, y) {
    initAudioContext();
    
    const targetY = y;
    const colors = colorSets[Math.floor(Math.random() * colorSets.length)];
    
    rockets.push(new Rocket(x, canvas.height, targetY, colors));
}

canvas.addEventListener('click', (e) => {
    handleInteraction(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
});

// Start animation loop
animate(0);

// ===== COUNTDOWN LOGIC =====
let hasStarted = false;
let countdownValue = 5;
// ===== DOM ELEMENTS =====
const countdownContainer = document.getElementById('countdown-container');
const countdownNumber = document.getElementById('countdown-number');
const newyearText = document.getElementById('newyear-text');
// const photoContainer = document.getElementById('photo-container'); // Tạm comment, sẽ dùng lại cho kịch bản lời chúc mới

// ===== COUNTDOWN FUNCTION =====
function startCountdown() {
    if (hasStarted) return;
    hasStarted = true;
    initAudioContext();
    
    // Show countdown container
    countdownContainer.style.display = 'block';
    countdownContainer.style.opacity = '1';
    countdownNumber.textContent = countdownValue;
    
    // Play beep for number 10
    playCountdownBeep();
    
    // Start counting down
    const countdownInterval = setInterval(() => {
            countdownValue--;
            
            if (countdownValue > 0) {
                countdownNumber.textContent = countdownValue;
                
                // Play beep for each number
                playCountdownBeep();
                
                // Animation pulse khi đếm
                countdownNumber.style.animation = 'none';
                setTimeout(() => {
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
                
            } else if (countdownValue === 0) {
                // Số 0
                countdownNumber.textContent = '0';
                
                // Play celebratory beep for 0
                playCountdownBeep(true);
                
                setTimeout(() => {
                    // Ẩn countdown
                    countdownContainer.style.transition = 'opacity 0.5s';
                    countdownContainer.style.opacity = '0';
                
                    setTimeout(() => {
                        countdownContainer.style.display = 'none';
                    }, 500);
                    
                    // BẮN PHÁO HOA NGAY - Không có text, chỉ pháo hoa thôi!
                    
                    // 1. BẮN 5 PHÁO HOA ĐỒNG THỜI
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            launchRocket();
                        }, i * 300);
                    }
                    
                    // 2. Auto launch tiếp tục
                    setTimeout(() => {
                        autoLaunch();
                    }, 2000);
                    
                }, 1000);
                
                clearInterval(countdownInterval);
            }
    }, 1000);
}

// ===== START PHOTO HANDLER =====
const startOverlay = document.getElementById('start-overlay');
const startPhoto = document.getElementById('start-photo');

if (startPhoto) {
    startPhoto.addEventListener('click', () => {
        // Enable audio
        initAudioContext();
        if (audioContext) {
            audioContext.resume().then(() => {
                console.log('Audio enabled');
            }).catch(e => {
                console.log('Audio resume failed:', e);
            });
        }
        
        // Hide overlay
        startOverlay.classList.add('hidden');
        
        // Start countdown after short delay
        setTimeout(() => {
            startCountdown();
        }, 500);
    });
}
