/* ==========================================================
   Assignment #5: Advanced JavaScript and DOM Manipulation
   Bodybuilders Gym - Group SE-2512

   Sections
     1. Helpers (safe localStorage)
     2. Sound effects
     3. Day / Night theme switch
     4. Keyboard navigation for the menu
     5. Greeting (time of day) + member object + weekly goal
     6. Program catalog (objects, arrays, loops, higher-order functions, switch, fetch)
     7. Star rating
   Each feature only runs when its elements exist on the page.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSoundButton();
    initThemeToggle();
    initKeyboardMenu();
    initGreeting();
    initWeeklyGoal();
    initProgramCatalog();
    initRating();
    initClickSounds();
});


/* ==========================================================
   1. Helpers
   ========================================================== */
const STORAGE_KEYS = {
    theme: 'gym-theme',
    sound: 'gym-sound',
    name:  'gym-member-name'
};

function readStorage(key) {
    try { return localStorage.getItem(key); }
    catch (error) { return null; }          // storage blocked: behave as if empty
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, value); }
    catch (error) { /* ignore */ }
}


/* ==========================================================
   2. Sound effects
   Only ONE sound can play at a time, so sounds never overlap.
   ========================================================== */
const sounds = {
    click:   new Audio('../sounds/click.wav'),
    success: new Audio('../sounds/success.wav'),
    error:   new Audio('../sounds/error.wav')
};

let soundEnabled = readStorage(STORAGE_KEYS.sound) !== 'off';
let currentSound = null;

function playSound(name) {
    const audio = sounds[name];
    if (!soundEnabled || !audio) return;

    if (currentSound) currentSound.pause();   // stop the previous sound first
    currentSound = audio;
    audio.currentTime = 0;                    // always start from the beginning

    const attempt = audio.play();             // play() returns a promise in modern browsers
    if (attempt !== undefined) attempt.catch(() => { /* browser blocked autoplay: ignore */ });
}

function initSoundButton() {
    const button = document.getElementById('soundToggle');
    if (!button) return;

    const showState = () => {
        button.textContent = soundEnabled ? 'Sound: On' : 'Sound: Off';
        button.setAttribute('aria-pressed', String(soundEnabled));
    };

    showState();
    button.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        writeStorage(STORAGE_KEYS.sound, soundEnabled ? 'on' : 'off');
        showState();
        if (soundEnabled) playSound('click');
    });
}

// One listener on the document plays a click sound for every button (event delegation)
function initClickSounds() {
    document.addEventListener('click', (event) => {
        const target = event.target.closest('button, .btn, .star');
        if (!target || target.id === 'soundToggle') return;
        playSound('click');
    });
}


/* ==========================================================
   3. Day / Night theme switch
   Bootstrap 5.3 reads data-bs-theme on <html>; our CSS
   variables are redefined for [data-bs-theme="dark"].
   ========================================================== */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const button = document.getElementById('themeToggle');
    if (button) {
        button.textContent = theme === 'dark' ? 'Day Mode' : 'Night Mode';
        button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
}

function initThemeToggle() {
    const button = document.getElementById('themeToggle');
    if (!button) return;

    const startTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    applyTheme(startTheme);

    button.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.style.backgroundColor = '';        // remove a color picked on the dashboard
        const colorLabel = document.getElementById('currentColor');
        if (colorLabel) colorLabel.textContent = 'theme default';
        applyTheme(next);
        writeStorage(STORAGE_KEYS.theme, next);
    });
}


/* ==========================================================
   4. Keyboard navigation for the menu
   Arrow keys move focus between menu links.
   ========================================================== */
function initKeyboardMenu() {
    const links = Array.from(document.querySelectorAll('.navbar-nav .nav-link'));
    if (links.length === 0) return;

    links.forEach((link, index) => {
        link.addEventListener('keydown', (event) => {
            let nextIndex;

            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    nextIndex = (index + 1) % links.length;                 // wrap to the first
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    nextIndex = (index - 1 + links.length) % links.length;  // wrap to the last
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = links.length - 1;
                    break;
                default:
                    return;                       // any other key: do nothing
            }

            event.preventDefault();               // stop the page from scrolling
            links[nextIndex].focus();
        });
    });
}


/* ==========================================================
   5. Greeting + member object (dashboard.html)
   ========================================================== */
function getGreeting(hour) {
    switch (true) {                               // each case is a condition
        case hour < 5:  return 'Good night';
        case hour < 12: return 'Good morning';
        case hour < 18: return 'Good afternoon';
        default:        return 'Good evening';
    }
}

function initGreeting() {
    const greeting = document.getElementById('greeting');
    const form     = document.getElementById('greeting-form');
    const input    = document.getElementById('nameInput');
    if (!greeting || !form) return;

    const showGreeting = (name) => {
        const base = getGreeting(new Date().getHours());
        greeting.textContent = name ? base + ', ' + name + '!' : base + '!';
    };

    const savedName = readStorage(STORAGE_KEYS.name) || '';
    input.value = savedName;
    showGreeting(savedName);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = input.value.trim();
        writeStorage(STORAGE_KEYS.name, name);
        showGreeting(name);
        playSound('success');
    });
}

// A JavaScript object with properties and methods
const member = {
    name: 'Member',
    workoutsDone: 3,
    weeklyGoal: 5,

    logWorkout() {
        if (this.workoutsDone < this.weeklyGoal) this.workoutsDone++;
        return this.workoutsDone;
    },

    getProgressPercent() {
        return Math.round((this.workoutsDone / this.weeklyGoal) * 100);
    },

    isGoalReached() {
        return this.workoutsDone >= this.weeklyGoal;
    }
};

function initWeeklyGoal() {
    const bar     = document.getElementById('goal-bar');
    const label   = document.getElementById('goal-label');
    const counter = document.getElementById('workoutCount');
    const message = document.getElementById('goal-message');
    const button  = document.getElementById('logWorkoutBtn');
    if (!bar || !button) return;

    const draw = () => {
        const percent = member.getProgressPercent();
        bar.style.width = percent + '%';                       // dynamic style change
        bar.parentElement.setAttribute('aria-valuenow', percent);
        label.textContent = member.workoutsDone + ' / ' + member.weeklyGoal + ' workouts';
        counter.textContent = member.workoutsDone;
        if (member.isGoalReached()) {
            message.textContent = 'Weekly goal reached. Great work!';
            button.disabled = true;
        }
    };

    draw();
    button.addEventListener('click', () => {
        member.logWorkout();
        draw();
        if (member.isGoalReached()) playSound('success');
    });
}


/* ==========================================================
   6. Program catalog (programs.html)
   ========================================================== */

// Data: an ARRAY of OBJECTS (each object also has methods)
function createProgram(data) {
    return {
        ...data,                                   // copy all properties from the data

        getCategoryLabel() {
            switch (this.category) {
                case 'strength': return 'Strength';
                case 'cardio':   return 'Cardio';
                case 'mind':     return 'Mind & Body';
                default:         return 'General';
            }
        },

        getSummary() {
            return this.level + ' | ' + this.duration + ' min';
        }
    };
}

const startingPrograms = [
    createProgram({
        id: 1, name: 'Strength Training', category: 'strength', level: 'All levels', duration: 60,
        description: 'Build muscle and get stronger with guided free-weight and machine workouts.',
        image: 'https://cdn11.bigcommerce.com/s-n88j1q/images/stencil/1280x1280/products/11098/36008/tag-fitness-5-100-rubber-hex-dumbbell-set-with-rack__76731.1746708225.jpg?c=2'
    }),
    createProgram({
        id: 2, name: 'Cardio Blast', category: 'cardio', level: 'All levels', duration: 45,
        description: 'High-energy sessions built to improve endurance and burn calories fast.',
        image: 'https://www.alqudra.sa/cdn/shop/articles/DALL_E_2024-12-17_15.04.52_-_An_energetic_gym_scene_showcasing_modern_cardio_machines_such_as_treadmills_elliptical_trainers_and_rowing_machines_in_a_sleek_well-lit_fitness_cen_1be3de_1792x.webp?v=1738128308'
    }),
    createProgram({
        id: 3, name: 'Yoga & Flexibility', category: 'mind', level: 'Beginner', duration: 60,
        description: 'Improve balance, flexibility, and focus in a calm studio setting.',
        image: 'https://soukstudio.com/wp-content/uploads/2022/10/RIMA_CLASS_142.jpg'
    })
];

// Higher-order function: takes a FUNCTION (the filter rule) as an argument
function filterPrograms(programs, category) {
    switch (category) {
        case 'strength':
        case 'cardio':
        case 'mind':
            return programs.filter(program => program.category === category);
        case 'all':
        default:
            return programs;
    }
}

function createProgramCard(program) {
    return `
        <div class="col-lg-4 col-md-6 program-col fade-in">
            <div class="card h-100 shadow-sm border-0">
                <img src="${program.image}" class="card-img-top img-cover-200" alt="${program.name}">
                <div class="card-body d-flex flex-column">
                    <span class="badge bg-secondary mb-2 align-self-start">${program.getCategoryLabel()}</span>
                    <h5 class="card-title">${program.name}</h5>
                    <p class="card-text flex-grow-1">${program.description}</p>
                    <p class="small text-muted mb-3">${program.getSummary()}</p>
                    <a href="contact.html" class="btn btn-custom-rust w-100">Join This Program</a>
                </div>
            </div>
        </div>`;
}

function initProgramCatalog() {
    const grid        = document.getElementById('program-grid');
    const countText   = document.getElementById('program-count');
    const loadButton  = document.getElementById('loadMoreBtn');
    const loadMessage = document.getElementById('load-message');
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!grid) return;

    let allPrograms    = [...startingPrograms];    // copy of the array
    let activeCategory = 'all';

    function render() {
        const visible = filterPrograms(allPrograms, activeCategory);

        let html = '';
        for (const program of visible) {           // loop over the array
            html += createProgramCard(program);
        }
        grid.innerHTML = html;

        // reduce: many values -> one value (total minutes)
        const totalMinutes = visible.reduce((sum, program) => sum + program.duration, 0);
        const average = visible.length ? Math.round(totalMinutes / visible.length) : 0;
        countText.textContent = 'Showing ' + visible.length + ' program(s). Average session: ' + average + ' minutes.';
    }

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.category;          // data-category="cardio"
            filterButtons.forEach(other => other.classList.toggle('active', other === button));
            render();
        });
    });

    // "Load more" with fetch: get JSON from a file and append it, without reloading the page
    loadButton.addEventListener('click', () => {
        loadButton.disabled = true;
        loadButton.textContent = 'Loading...';
        loadMessage.textContent = '';

        fetch('../data/more-programs.json')
            .then(response => {
                if (!response.ok) throw new Error('Server answered ' + response.status);
                return response.json();                       // text -> JavaScript array
            })
            .then(items => {
                const newPrograms = items.map(createProgram);  // map: data -> objects with methods
                allPrograms = allPrograms.concat(newPrograms);
                render();
                loadButton.textContent = 'All Programs Loaded';
                loadMessage.textContent = newPrograms.length + ' more programs added.';
                playSound('success');
            })
            .catch(error => {
                loadButton.disabled = false;
                loadButton.textContent = 'Load More Programs';
                loadMessage.textContent = 'Could not load programs (' + error.message + '). Open the site with Live Server or GitHub Pages.';
                playSound('error');
            });
    });

    render();
}


/* ==========================================================
   7. Star rating (programs.html)
   ========================================================== */
function getRatingText(value) {
    switch (value) {
        case 1:  return 'Poor. Tell us how we can improve.';
        case 2:  return 'Fair. We will do better.';
        case 3:  return 'Good. Thanks for your feedback.';
        case 4:  return 'Great. Glad you like it.';
        case 5:  return 'Excellent. Thank you!';
        default: return 'Click a star to rate.';
    }
}

function initRating() {
    const stars   = document.querySelectorAll('.star');
    const message = document.getElementById('rating-message');
    if (stars.length === 0) return;

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = Number(star.dataset.value);        // "4" -> 4

            // every star up to the chosen one gets the "active" class
            stars.forEach(other => {
                other.classList.toggle('active', Number(other.dataset.value) <= rating);
            });

            message.innerText = 'You rated ' + rating + ' of 5. ' + getRatingText(rating);

            // restart the bounce animation on the clicked star
            star.classList.remove('pop');
            void star.offsetWidth;                            // forces the browser to restart the animation
            star.classList.add('pop');
            star.addEventListener('animationend', () => star.classList.remove('pop'), { once: true });
        });
    });
}
