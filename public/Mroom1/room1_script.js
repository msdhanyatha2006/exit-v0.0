const state = {
    credits: 100,
    levels: { fridge: false, robot: false, guitar: false, vr: false },
    inputs: { fridge: "", robot: [], vr: [] },
    hints: {
        fridge: " It's a 3-digit code. try finding the numbers around you.",
        robot: "Behind the cold door rest four silent colors—they whisper to the wall's shapes..",
        guitar: "The key sleeps in the very first letters that dares to begin the message.",
        vr: "this one is on you... look around, what do you see? what do you feel? what do you hear? the answer is all around you."
    }
};

function getHint(lvl) {
    if (state.credits >= 3) {
        state.credits -= 3;
        document.getElementById('cr-val').innerText = state.credits;
        notify(state.hints[lvl]);
    } else { notify("INSUFFICIENT CREDITS"); }
}

function notify(text) {
    const n = document.getElementById('notification');
    n.innerText = text; n.style.display = 'block';
    clearTimeout(n._t);
    n._t = setTimeout(() => n.style.display = 'none', 4000);
}

function openLvl(id) {
    if (id === 'final' && !state.levels.vr) {
        notify("CRITICAL ERROR: SYSTEM INCOMPLETE");
        return;
    }
    document.getElementById(`modal-${id}`).classList.add('active');
}

function closeLvl() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

// ── FRIDGE (always first, no prereq) ──────────────────────────────────
function inFridge(n) {
    state.inputs.fridge += n;
    document.getElementById('fridge-disp').innerText = state.inputs.fridge;

    if (state.inputs.fridge.length === 3) {
        if (state.inputs.fridge === "375") {
            state.levels.fridge = true;
            document.getElementById('ui-fridge').style.display = 'none';
            document.getElementById('img-fridge').src = 'Image3.jpg';
            notify("FRIDGE DECRYPTED");
        } else {
            state.inputs.fridge = "";
            document.getElementById('fridge-disp').innerText = "_ _ _";
            notify("DENIED");
        }
    }
}

// ── ROBOT (evaluates only after fridge solved) ────────────────────────
function inRobot(s) {
    const target = ["Circle", "Rectangle", "X", "Triangle"];
    state.inputs.robot.push(s);

    if (state.inputs.robot.length === 4) {
        // silently reset without evaluating if prereq not met
        if (!state.levels.fridge) {
            state.inputs.robot = [];
            return;
        }

        const isCorrect = state.inputs.robot.every((shape, i) => shape === target[i]);
        if (isCorrect) {
            state.levels.robot = true;
            document.getElementById('ui-robot').style.display = 'none';
            const rp = document.getElementById('robot-riddle');
            rp.innerText = "I have keys but no lock,\nA bridge but no river,\nI can rock without moving,\nAnd make your whole body shiver.\nHe will help you.";
            rp.style.display = 'block';
            notify("ROBOT SYNCED");
        } else {
            state.inputs.robot = [];
            notify("SEQUENCE INCORRECT");
        }
    }
}

// ── GUITAR (evaluates only after robot solved) ────────────────────────
function checkGt() {
    if (!state.levels.robot) return;   // silent guard

    const val = document.getElementById('gt-in').value.toUpperCase().trim();
    if (val === "EADGBE") {
        state.levels.guitar = true;
        document.getElementById('ui-guitar').style.display = 'none';
        document.getElementById('gt-success').style.display = 'block';
        notify("RESONANCE STABILIZED");
    } else {
        notify("DISHARMONY: INCORRECT TUNING");
    }
}

// ── VR (evaluates only after guitar solved) ───────────────────────────
function inVR(c) {
    const target = ["Yellow", "Dark Blue", "Green", "Orange"];
    state.inputs.vr.push(c);

    if (state.inputs.vr.length === 4) {
        // silently reset without evaluating if prereq not met
        if (!state.levels.guitar) {
            state.inputs.vr = [];
            return;
        }

        const isCorrect = state.inputs.vr.every((color, i) => color === target[i]);
        if (isCorrect) {
            state.levels.vr = true;
            document.getElementById('ui-vr').style.display = 'none';
            document.getElementById('vr-success').style.display = 'block';
            notify("VISION RESTORED");
        } else {
            state.inputs.vr = [];
            notify("OPTIC SYNC FAILED");
        }
    }
}

// ── INIT ──────────────────────────────────────────────────────────────
(function init() {
    const pad = document.getElementById('num-pad');
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLR', 0, 'OK'].forEach(v => {
        let b = document.createElement('button');
        b.className = 'pro-btn';
        b.innerText = v;
        b.onclick = () => (v === 'CLR')
            ? (state.inputs.fridge = "", document.getElementById('fridge-disp').innerText = "_ _ _")
            : inFridge(v);
        pad.appendChild(b);
    });
})();