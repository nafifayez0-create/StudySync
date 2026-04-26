/**
 * STUDY SYNC - MASTER APPLICATION SCRIPT
 * Developed for: University Assignment
 * 
 * ARCHITECTURE OVERVIEW: 
 * This script uses Vanilla JavaScript to manage a "Single Page Application" (SPA) workflow.
 * Components are initialized based on the user's Authentication state (Supabase).
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 0. INITIALIZATION (SUPABASE) ---
    const SUPABASE_URL = 'https://tqmavkknbvoospnyydcz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWF2a2tuYnZvb3Nwbnl5ZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTA3MjgsImV4cCI6MjA5MjEyNjcyOH0.9htCQrAaWvUes1VA07651J6SgKCPyXhtjdvMLXNWUtY';

    if (!window.supabase) {
        console.error('Core modules missing!');
        return;
    }
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Global Helper: Quick DOM selection
    const getEl = (id) => document.getElementById(id);

    // --- 1. GLOBAL UI HELPERS ---
    
    // Notification System: Shows feedback to the user
    function showToast(message, type = 'success') {
        const toast = getEl('toast');
        const tMsg = getEl('toast-message');
        const tIcon = getEl('toast-icon');
        if (!toast || !tMsg) return;
        
        tMsg.textContent = message;
        toast.className = 'toast toast-' + type;
        if (tIcon) tIcon.textContent = type === 'success' ? '✓' : '✕';
        toast.style.display = 'flex';
        
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => { 
                toast.style.display = 'none'; 
                toast.classList.remove('toast-hide'); 
            }, 300);
        }, 4000);
    }

    // --- 2. AUTHENTICATION ENGINE ---
    
    // Toggles between Sign In and Sign Up views
    let isSignUpMode = false;
    const authToggleLink = getEl('auth-toggle-link');
    if (authToggleLink) {
        authToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            const authFormTitle = getEl('auth-form-title');
            const submitText = getEl('submit-text');
            const signupFields = document.querySelectorAll('.signup-field');
            
            signupFields.forEach(field => field.style.display = isSignUpMode ? 'block' : 'none');
            if (authFormTitle) authFormTitle.textContent = isSignUpMode ? 'Create Account' : 'Welcome Back';
            if (submitText) submitText.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        });
    }

    // Main UI Switcher: Controls what the user sees based on login status
    function updateUIState(user) {
        const landingWrapper = getEl('landing-wrapper');
        const appDashboard = getEl('app-dashboard');
        const usernameDisplay = getEl('user-display-name');
        const loadingScreen = getEl('auth-loading');

        if (user) {
            // AUTHENTICATED: Show Dashboard
            window.scrollTo(0, 0);
            document.body.classList.add('user-logged-in');
            if (landingWrapper) landingWrapper.style.display = 'none';
            if (appDashboard) appDashboard.style.display = 'flex';
            if (usernameDisplay) usernameDisplay.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
            
            initializeDashboardTools();
        } else {
            // GUEST: Show Landing Page
            document.body.classList.remove('user-logged-in');
            if (landingWrapper) landingWrapper.style.display = 'block';
            if (appDashboard) appDashboard.style.display = 'none';
        }

        // Smooth removal of initial loading splash
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
            }, 300);
        }
    }

    // --- 3. DASHBOARD LOGIC CHAPTER ---

    function initializeDashboardTools() {
        // CHAPTER 3.1: SIDEBAR TAB SWITCHING
        const navItems = document.querySelectorAll('.app-nav-item');
        const views = document.querySelectorAll('.dashboard-view');

        navItems.forEach(item => {
            if (item.getAttribute('listened') !== 'true') {
                item.setAttribute('listened', 'true');
                item.addEventListener('click', (e) => {
                    const viewKey = item.getAttribute('data-view');
                    navItems.forEach(ni => ni.classList.remove('active'));
                    item.classList.add('active');
                    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + viewKey));
                });
            }
        });

        // CHAPTER 3.2: AI STUDY PLANNER
        const genBtn = getEl('btn-generate-ai');
        const planModal = getEl('planner-modal');
        const manualBtn = getEl('btn-manual-planner');
        const plannerBoard = getEl('planner-board'); // For Deletion Delegation

        if (genBtn) genBtn.addEventListener('click', () => { if(planModal) planModal.style.display = 'flex'; });
        
        const closePlanModal = getEl('close-planner-modal');
        if (closePlanModal) closePlanModal.addEventListener('click', () => { planModal.style.display = 'none'; });

        const confirmGen = getEl('confirm-ai-gen');
        if (confirmGen) confirmGen.addEventListener('click', () => {
            confirmGen.disabled = true;
            confirmGen.textContent = 'Analyzing...';
            setTimeout(() => {
                planModal.style.display = 'none';
                confirmGen.disabled = false;
                confirmGen.textContent = 'Generate My Plan';
                showToast('AI Plan Synchronized!', 'success');
            }, 1800);
        });

        // Manual Mode Toggling
        if (manualBtn) manualBtn.addEventListener('click', () => {
            const isManual = manualBtn.classList.toggle('active');
            manualBtn.innerHTML = isManual ? '<span>Exit Manual</span>' : 'Manual Plan';
            document.querySelectorAll('.add-manual-task').forEach(b => b.style.display = isManual ? 'block' : 'none');
        });

        // Adding Manual Tasks
        document.querySelectorAll('.add-manual-task').forEach(btn => {
            if (btn.getAttribute('listened') !== 'true') {
                btn.setAttribute('listened', 'true');
                btn.addEventListener('click', () => {
                    const taskName = prompt("Explain your study task:");
                    if (taskName && taskName.trim()) {
                        const newTask = document.createElement('div');
                        newTask.className = 'p-task project';
                        newTask.innerHTML = `<button class="delete-p-task">×</button><div class="task-info"><span class="time">NEW</span><h4>${taskName}</h4><p>Custom Module</p></div><div class="task-progress-bar"><div class="tp-fill" style="width: 0%;"></div></div>`;
                        btn.closest('.pc-body').insertBefore(newTask, btn);
                        showToast('Task added.', 'success');
                    }
                });
            }
        });

        // Task Deletion (Using Event Delegation)
        if (plannerBoard && plannerBoard.getAttribute('listened') !== 'true') {
            plannerBoard.setAttribute('listened', 'true');
            plannerBoard.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-p-task')) {
                    const task = e.target.closest('.p-task');
                    task.style.opacity = '0';
                    setTimeout(() => task.remove(), 300);
                    showToast('Task removed.', 'info');
                }
            });
        }

        // CHAPTER 3.3: FOCUS MODE (POMODORO)
        let timerInt;
        let timeLeft = 25 * 60;
        let isTimerRunning = false;
        const timerDisp = getEl('focus-timer');
        const startTimerBtn = getEl('timer-start');

        if (startTimerBtn && startTimerBtn.getAttribute('listened') !== 'true') {
            startTimerBtn.setAttribute('listened', 'true');
            startTimerBtn.addEventListener('click', () => {
                if (isTimerRunning) {
                    clearInterval(timerInt);
                } else {
                    timerInt = setInterval(() => {
                        if (timeLeft > 0) {
                            timeLeft--;
                            if (timerDisp) {
                                const m = Math.floor(timeLeft / 60);
                                const s = timeLeft % 60;
                                timerDisp.textContent = `${m}:${s.toString().padStart(2, '0')}`;
                            }
                        } else {
                            clearInterval(timerInt);
                            showToast('Deep work block complete!', 'success');
                        }
                    }, 1000);
                }
                isTimerRunning = !isTimerRunning;
                startTimerBtn.textContent = isTimerRunning ? 'Pause' : 'Focus';
            });
        }

        // Atmosphere Audio Handlers
        const audios = { rain: getEl('audio-rain'), cafe: getEl('audio-cafe'), noise: getEl('audio-noise') };
        document.querySelectorAll('.sound-btn').forEach(btn => {
            if (btn.getAttribute('listened') !== 'true') {
                btn.setAttribute('listened', 'true');
                btn.addEventListener('click', () => {
                    const sound = btn.getAttribute('data-sound');
                    Object.values(audios).forEach(a => { if(a) { a.pause(); a.currentTime = 0; } });
                    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (sound !== 'none' && audios[sound]) audios[sound].play();
                });
            }
        });
    }

    // --- 4. FORM & CONTACT HANDLERS ---
    
    // Simplified Contact Form: Directly connects user to student mail
    const contactForm = getEl('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = getEl('contact-name').value;
            const subject = getEl('contact-subject').value;
            const message = getEl('contact-message').value;

            const mailto = `mailto:hasanrahim581@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.location.href = mailto;
            showToast('Opening Mail Client...', 'success');
        });
    }

    // Authenticate state listener (The "Heartbeat" of the app)
    supabase.auth.onAuthStateChange((event, session) => {
        updateUIState(session?.user || null);
    });

    // Initial session check on page load
    (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        updateUIState(session?.user || null);
    })();

    // Mobile Navigation Toggle
    const ham = getEl('hamburger');
    if (ham) ham.addEventListener('click', () => {
        ham.classList.toggle('active');
        getEl('nav-links').classList.toggle('active');
    });

    // Intersection Observer for Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.challenge-card, .feature-item, .contact-info-card, .tip-card, .ethical-card, .workflow-step, .goal-highlight-item').forEach(el => observer.observe(el));
});
