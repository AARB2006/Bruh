document.addEventListener("DOMContentLoaded", function () {
    // --- ELEMENTS ---
    const rowsSlider = document.getElementById("rangeInput"),
        rowsValue = document.getElementById("rangeValue"),
        ballsSlider = document.getElementById("ballInput"),
        ballsValue = document.getElementById("ballRangeValue"),
        betInput = document.getElementById("betInput"),
        balanceInput = document.getElementById("balanceInput"),
        halfBtn = document.getElementById("halfBtn"),
        doubleBtn = document.getElementById("doubleBtn"),
        maxBtn = document.getElementById("maxBtn"),
        plinkoContainer = document.getElementById("plinkoBoard"),
        riskButtons = document.getElementById("riskButtons").querySelectorAll("button");

    // --- HELPERS ---
    const isValidNumber = val => !isNaN(parseFloat(val)) && parseFloat(val) >= 1.00;
    const isValidBet = (val, balance) => {
        let num = parseFloat(val), bal = parseFloat(balance);
        return !isNaN(num) && num >= 1.00 && num <= bal;
    };
    const setInputError = (input, msg) => { input.style.border = "2px solid red"; input.value = ""; input.placeholder = msg; };
    const clearInputError = (input, placeholder) => { input.style.border = ""; input.placeholder = placeholder; };

    function getMultiplierRange(rows, risk) {
        if (risk === "Low") {
            if (rows <= 9) return [0.5, 5.6];
            if (rows <= 11) return [0.5, 10.5];
            if (rows <= 13) return [0.5, 8.4];
            if (rows === 14) return [0.5, 7.2];
            if (rows === 15) return [0.5, 15];
            if (rows === 16) return [0.5, 16];
        }
        if (risk === "Medium") {
            if (rows <= 9) return [0.4, 13];
            if (rows <= 11) return [0.4, 22];
            if (rows <= 13) return [0.3, 34];
            if (rows === 14) return [0.2, 44];
            if (rows === 15) return [0.3, 70];
            if (rows === 16) return [0.3, 110];
        }
        if (risk === "High") {
            if (rows <= 9) return [0.2, 30];
            if (rows <= 11) return [0.2, 80];
            if (rows <= 13) return [0.2, 150];
            if (rows === 14) return [0.2, 250];
            if (rows === 15) return [0.2, 500];
            if (rows === 16) return [0.2, 1000];
        }
        return [1, 10];
    }

    let currentRisk = "Low";

    function addGlowFilter(svg) {
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "glow");
        filter.innerHTML = `
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        svg.appendChild(filter);
    }

    function generatePlinkoPegs(rows) {
        
        plinkoContainer.innerHTML = "";
        const pegRadius = 7, bottomPadding = 50, topPadding = 24;
        const containerWidth = plinkoContainer.offsetWidth || 400;
        const containerHeight = plinkoContainer.offsetHeight || 400;
        const maxPegs = rows + 2;
        const sidePadding = 24;
        const pegGapX = (containerWidth - 10 * sidePadding) / (maxPegs - 1);
        const pegGapY = (containerHeight - topPadding - bottomPadding) / (rows + 1);

        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", containerWidth);
        svg.setAttribute("height", containerHeight);
        addGlowFilter(svg);

        let bottomRowXs = [];
        let bottomRowY = 0;

        for (let row = 0; row < rows; row++) {
            let pegsInRow = row + 3;
            let y = topPadding + pegGapY * (row + 1);
            let totalWidth = (pegsInRow - 1) * pegGapX;
            let startX = (containerWidth - totalWidth) / 2;
            
            for (let col = 0; col < pegsInRow; col++) {
                let x = startX + col * pegGapX;
                let peg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                peg.setAttribute("cx", x);
                peg.setAttribute("cy", y);
                peg.setAttribute("r", pegRadius);
                peg.setAttribute("fill", "#fff");
                svg.appendChild(peg);
                
                if (row === rows - 1) {
                    bottomRowXs.push(x);
                    bottomRowY = y;
                }
            }
        }

        if (bottomRowXs.length > 1) {
            const rectY = bottomRowY + pegRadius + 10;
            const rectHeight = 22;
            const gap = 6;

            const [minMult, maxMult] = getMultiplierRange(rows, currentRisk);
            const n = bottomRowXs.length - 1;
            let multipliers = [];
            
            for (let i = 0; i < n; i++) {
                let t = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
                let curve = Math.pow(t, 9.5);
                let mult = minMult + (maxMult - minMult) * curve;
                multipliers.push(mult.toFixed(2) + "x");
            }

            function getBoxColor(idx) {
                let t = Math.abs(idx - (n - 1) / 2) / ((n - 1) / 2);
                let r = Math.round(255 * (1 - t) + 226 * t);
                let g = Math.round(224 * (1 - t) + 60 * t);
                let b = Math.round(102 * (1 - t) + 60 * t);
                return `rgb(${r},${g},${b})`;
            }

            for (let i = 0; i < n; i++) {
                const x1 = bottomRowXs[i] + gap / 2;
                const x2 = bottomRowXs[i + 1] - gap / 2;
                const rectWidth = x2 - x1;
                
                let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", x1);
                rect.setAttribute("y", rectY);
                rect.setAttribute("width", rectWidth);
                rect.setAttribute("height", rectHeight);
                rect.setAttribute("rx", 8);
                rect.setAttribute("ry", 8);
                rect.setAttribute("fill", getBoxColor(i));
                rect.setAttribute("stroke", "#fff");
                rect.setAttribute("stroke-width", "1.2");
                rect.setAttribute("opacity", "0.95");
                svg.appendChild(rect);

                let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", x1 + rectWidth / 2);
                text.setAttribute("y", rectY + rectHeight / 2 + 4);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("fill", "#000000");
                text.setAttribute("font-size", "11");
                text.setAttribute("font-family", "Arial, sans-serif");
                text.setAttribute("font-weight", "bold");
                text.textContent = multipliers[i];
                svg.appendChild(text);
            }
        }

        plinkoContainer.appendChild(svg);
    }

    function randomSeedString(len = 16) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let array = new Uint8Array(len);
        window.crypto.getRandomValues(array);
        return Array.from(array, x => chars[x % chars.length]).join('');
    }

    async function seededRandom(seed, i) {
        const msg = seed + ":" + i;
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const num = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
        return ((num >>> 0) / 0xFFFFFFFF);
    }

    async function playBalls() {
        const rows = Number(rowsSlider.value);
        const balls = Number(ballsSlider.value);
        const betPerBall = parseFloat(betInput.value);
        let currentBalance = parseFloat(balanceInput.value);

        const totalBet = betPerBall * balls;
        if (!isValidBet(totalBet, currentBalance)) {
            setInputError(betInput, "Total bet exceeds balance");
            return;
        }

        currentBalance -= totalBet;
        balanceInput.value = currentBalance.toFixed(2);

        const seed = randomSeedString(16);
        let totalWinnings = 0;

        let oldBalls = document.querySelectorAll(".plinko-ball");
        oldBalls.forEach(b => b.remove());

        let svg = plinkoContainer.querySelector("svg");
        if (!svg) return;

        const pegsInBottom = rows + 2;
        const slotCenters = [];
        const containerWidth = plinkoContainer.offsetWidth || 400;
        const sidePadding = 24;
        const pegGapX = (containerWidth - 10 * sidePadding) / (pegsInBottom - 1);
        let startX = (containerWidth - ((pegsInBottom - 1) * pegGapX)) / 2;
        
        for (let i = 0; i < pegsInBottom - 1; i++) {
            slotCenters.push(startX + (i + 0.5) * pegGapX);
        }

        const [minMult, maxMult] = getMultiplierRange(rows, currentRisk);
        const n = pegsInBottom - 1;
        let multipliers = [];
        
        for (let i = 0; i < n; i++) {
            let t = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
            let curve = Math.pow(t, 7);
            let mult = minMult + (maxMult - minMult) * curve;
            multipliers.push(mult);
        }

        for (let b = 0; b < balls; b++) {
            let pos = 0;
            let points = [];
            let x = svg.getAttribute("width") / 2;
            let y = 10;
            points.push({ x, y });

            for (let row = 0; row < rows; row++) {
                let rand = await seededRandom(seed, b * 100 + row);
                let pegsInRow = row + 3;
                let rowY = 24 + ((svg.getAttribute("height") - 24 - 50) / (rows + 1)) * (row + 1);
                let rowTotalWidth = (pegsInRow - 1) * pegGapX;
                let rowStartX = (svg.getAttribute("width") - rowTotalWidth) / 2;

                let center = (pegsInRow - 1) / 2;
                let distFromCenter = Math.abs(pos - center) / center;
                let maxBounce = pegGapX * 0.45;
                let minBounce = pegGapX * 0.18;
                let bounceRange = minBounce + (maxBounce - minBounce) * distFromCenter;
                let bounceOffset = (rand > 0.5 ? 1 : -1) * bounceRange * (0.7 + 0.6 * Math.random());

                if (rand > 0.5) pos++;
                let pegX = rowStartX + pos * pegGapX + bounceOffset;
                points.push({ x: pegX, y: rowY });
            }

            let slot = pos;
            if (slot < 0) slot = 0;
            if (slot > n - 1) slot = n - 1;
            let slotX = slotCenters[slot];
            let slotY = Number(svg.getAttribute("height")) - 50 + 22 + 10;
            points.push({ x: slotX, y: slotY - 32 });
            points.push({ x: slotX, y: slotY });

            let ball = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            ball.setAttribute("class", "plinko-ball");
            ball.setAttribute("r", 6);
            ball.setAttribute("fill", "#b538e2");
            ball.setAttribute("stroke", "#b538e2");
            ball.setAttribute("stroke-width", "2");
            ball.setAttribute("cx", points[0].x);
            ball.setAttribute("cy", points[0].y);
            svg.appendChild(ball);

            function animateArc(p0, p1, duration, cb) {
                const cx = (p0.x + p1.x) / 2;
                const cy = Math.min(p0.y, p1.y) - 32;
                let start = null;

                function step(ts) {
                    if (!start) start = ts;
                    let t = Math.min((ts - start) / duration, 1);
                    let x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cx + t * t * p1.x;
                    let y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cy + t * t * p1.y;
                    ball.setAttribute("cx", x);
                    ball.setAttribute("cy", y);
                    
                    if (t < 1) {
                        requestAnimationFrame(step);
                    } else if (cb) {
                        cb();
                    }
                }
                requestAnimationFrame(step);
            }

            (function animatePath(i) {
                if (i < points.length - 1) {
                    animateArc(points[i], points[i + 1], 220, () => {
                        animatePath(i + 1);
                        
                        if (i === points.length - 2) {
                            const multiplier = multipliers[slot];
                            const winningsForBall = betPerBall * multiplier;
                            totalWinnings += winningsForBall;

                            const rects = svg.querySelectorAll('rect');
                            const targetRect = rects[slot];
                            if (targetRect) {
                                targetRect.setAttribute('filter', 'url(#glow)');
                                setTimeout(() => {
                                    targetRect.setAttribute('filter', '');
                                    ball.remove();
                                }, 1000);
                            }

                            if (b === balls - 1) {
                                setTimeout(() => {
                                    currentBalance += totalWinnings;
                                    balanceInput.value = currentBalance.toFixed(2);
                                }, 1000);
                            }
                        }
                    });
                }
            })(0);
        }
    }

    // Event Listeners
    document.getElementById("place").addEventListener("click", playBalls);

    rowsSlider.addEventListener("input", function () {
        rowsValue.textContent = rowsSlider.value;
        generatePlinkoPegs(Number(rowsSlider.value));
    });

    ballsSlider.addEventListener("input", function () {
        ballsValue.textContent = ballsSlider.value;
    });

    function validateInputs() {
        let betVal = betInput.value, balanceVal = balanceInput.value;
        let betValid = isValidBet(betVal, balanceVal), balanceValid = isValidNumber(balanceVal);
        if (!balanceValid) setInputError(balanceInput, "Invalid or < 1.00");
        else clearInputError(balanceInput, "> 0.00");
        if (!betValid) {
            if (isNaN(parseFloat(betVal)) || betVal === "") setInputError(betInput, "Invalid input");
            else if (parseFloat(betVal) < 1.00) setInputError(betInput, "Value < 1.00");
            else if (parseFloat(betVal) > parseFloat(balanceVal)) setInputError(betInput, "Bet > Balance");
        } else clearInputError(betInput, "0.00");
        return betValid && balanceValid;
    }

    betInput.addEventListener("input", validateInputs);
    balanceInput.addEventListener("input", validateInputs);

    halfBtn.addEventListener("click", function () {
        let val = parseFloat(betInput.value) || 0;
        betInput.value = (val / 2).toFixed(2);
        validateInputs();
    });

    doubleBtn.addEventListener("click", function () {
        let val = parseFloat(betInput.value) || 0;
        betInput.value = (val * 2).toFixed(2);
        validateInputs();
    });

    maxBtn.addEventListener("click", function () {
        let bal = parseFloat(balanceInput.value) || 0;
        betInput.value = bal.toFixed(2);
        validateInputs();
    });

    riskButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            riskButtons.forEach(b => {
                b.classList.remove("bg-[#b538e2]");
                b.classList.add("bg-[#121212]");
            });
            btn.classList.remove("bg-[#121212]");
            btn.classList.add("bg-[#b538e2]");
            currentRisk = btn.textContent.trim();
            generatePlinkoPegs(Number(rowsSlider.value));
        });
    });

    if (riskButtons.length) {
        riskButtons[0].classList.remove("bg-[#121212]");
        riskButtons[0].classList.add("bg-[#b538e2]");
        currentRisk = riskButtons[0].textContent.trim();
    }

    generatePlinkoPegs(Number(rowsSlider.value) || 8);
});