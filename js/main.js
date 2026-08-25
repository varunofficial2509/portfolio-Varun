/* Hero node-graph: a floating wireframe node-graph beside the hero text —
   an abstract stand-in for "systems / networks / knowledge". A sparse
   ambient dot field gives it atmosphere; a rotating node cluster (built
   from a Fibonacci-sphere point set, edged to its nearest neighbours) is
   the focal object. Each main node carries a small mono-font technology
   label that tracks it every frame and anchors toward the cluster's
   center so it never runs off the edge of the canvas. Both layers
   brighten and draw new connections near the cursor, and the cluster
   keeps a slow autonomous rotate/bob/breathe even at rest. Scales down on
   narrow viewports rather than disappearing — the JS reads the
   container's actual size each resize and fits the object to it. Labels
   are dropped below a fit threshold so the mobile graph stays clean
   rather than cluttered. Under prefers-reduced-motion, the autonomous
   loop is replaced with a single still frame that still redraws on
   cursor movement and resize (input-driven, not autoplaying). */
document.body.classList.add("vt-js-ready");

(function () {
    const canvas = document.getElementById("vtGrid");
    if (!canvas || canvas.dataset.vtInit) return;
    canvas.dataset.vtInit = "1";

    const ctx = canvas.getContext("2d");
    const container = canvas.closest(".vt-hero-visual") || canvas.parentElement;
    const ACCENT = "58, 255, 158";
    const BASE = "244, 244, 239";

    let width = 0, height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Reduced motion: the continuous auto-rotate/bob/breathe loop is the
    // kind of motion this setting exists for, so it's replaced with a
    // single still frame. Direct interaction (cursor, resize) still
    // redraws — that's a response to input, not autoplay — it just
    // doesn't keep animating on its own between those events.
    const motionQuery = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    let prefersReducedMotion = motionQuery ? motionQuery.matches : false;

    // --- ambient background dots -----------------------------------
    const AMBIENT_SPACING = 96;
    const AMBIENT_RADIUS = 130;
    let ambient = [];

    function buildAmbient() {
        ambient = [];
        for (let y = AMBIENT_SPACING / 2; y < height; y += AMBIENT_SPACING) {
            for (let x = AMBIENT_SPACING / 2; x < width; x += AMBIENT_SPACING) {
                ambient.push({ x: x, y: y });
            }
        }
    }

    // --- central node cluster (Fibonacci sphere) --------------------
    // One label per main node, so every point in the focal cluster
    // reads as a named technology — no unlabeled filler nodes mixed
    // in, and no icons (a single consistent glowing-point + label
    // visual language throughout).
    const TECH_LABELS = [
        "Java", "Spring Boot", "Microservices", "Kafka",
        "Angular", "PostgreSQL", "Redis", "RAG",
        "LangChain", "LangGraph", "GenAI", "pgvector"
    ];
    const NODE_COUNT = TECH_LABELS.length;
    const NODE_RADIUS_3D = 210;
    const NEIGHBOURS = 3;
    let nodes = [];
    const edgeKeys = new Set();
    let edges = [];

    function buildNodeGraph() {
        nodes = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < NODE_COUNT; i++) {
            const yv = 1 - (i / (NODE_COUNT - 1)) * 2;
            const r = Math.sqrt(Math.max(0, 1 - yv * yv));
            const theta = golden * i;
            nodes.push({
                bx: Math.cos(theta) * r * NODE_RADIUS_3D,
                by: yv * NODE_RADIUS_3D,
                bz: Math.sin(theta) * r * NODE_RADIUS_3D,
                label: TECH_LABELS[i]
            });
        }
        edges = [];
        edgeKeys.clear();
        for (let i = 0; i < nodes.length; i++) {
            const dists = [];
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;
                const dx = nodes[i].bx - nodes[j].bx;
                const dy = nodes[i].by - nodes[j].by;
                const dz = nodes[i].bz - nodes[j].bz;
                dists.push([j, dx * dx + dy * dy + dz * dz]);
            }
            dists.sort(function (a, b) { return a[1] - b[1]; });
            for (let k = 0; k < NEIGHBOURS; k++) {
                const j = dists[k][0];
                const key = i < j ? i + "_" + j : j + "_" + i;
                if (!edgeKeys.has(key)) {
                    edgeKeys.add(key);
                    edges.push([i, j]);
                }
            }
        }
    }
    buildNodeGraph();

    // Node radius/focal length are tuned for the desktop canvas
    // size; on smaller viewports (the graph now scales down rather
    // than disappearing) everything shrinks together via this
    // factor instead of clipping against the canvas edge.
    let fit = 1;

    function resize() {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildAmbient();
        fit = Math.max(0.42, Math.min(1, Math.min(width, height) / 560));
    }

    let mouse = { x: -9999, y: -9999 };
    let raf = null;

    function draw(t) {
        ctx.clearRect(0, 0, width, height);

        // ambient field: quiet, brightens slightly near the cursor
        for (let i = 0; i < ambient.length; i++) {
            const d = ambient[i];
            const dx = d.x - mouse.x, dy = d.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const near = Math.max(0, 1 - dist / (AMBIENT_RADIUS * fit));
            const color = near > 0.06 ? ACCENT : BASE;
            ctx.beginPath();
            ctx.arc(d.x, d.y, (0.8 + near * 1.0) * Math.max(0.6, fit), 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + color + ", " + (0.035 + near * 0.3) + ")";
            ctx.fill();
        }

        // slow autonomous motion: rotation, tilt, breathing, bob — frozen
        // at a fixed pose (t=0) under reduced motion instead of animating
        const now = prefersReducedMotion ? 0 : t;
        const angle = now * 0.00016;
        const tilt = 0.2 + Math.sin(now * 0.00035) * 0.18;
        const breathe = 1 + Math.sin(now * 0.0004) * 0.035;
        const bob = Math.sin(now * 0.0006) * 10;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

        // centred in its column (the column itself is already the
        // hero's right side) so the larger object has even margin
        // on both sides and doesn't clip against the canvas edge
        const centerX = width * 0.5;
        const centerY = height * 0.5 + bob;
        const FOCAL = 780;

        const projected = nodes.map(function (n) {
            let x = n.bx * cosA - n.bz * sinA;
            let z = n.bx * sinA + n.bz * cosA;
            let y = n.by * cosT - z * sinT;
            z = n.by * sinT + z * cosT;
            x *= breathe; y *= breathe; z *= breathe;
            const scale = FOCAL / (FOCAL + z);
            const sx = centerX + x * scale * fit;
            const sy = centerY + y * scale * fit;
            const dx = sx - mouse.x, dy = sy - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const near = Math.max(0, 1 - dist / (320 * fit));
            // restrained pull toward the cursor, never a scatter
            const pull = near * 19 * fit;
            return {
                x: sx - (dx / dist) * pull,
                y: sy - (dy / dist) * pull,
                scale: scale,
                near: near,
                label: n.label
            };
        });

        // skeleton edges: always faintly present, brighten near cursor
        for (let i = 0; i < edges.length; i++) {
            const a = projected[edges[i][0]], b = projected[edges[i][1]];
            const near = Math.max(a.near, b.near);
            const color = near > 0.08 ? ACCENT : BASE;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(" + color + ", " + (0.32 + near * 0.5) + ")";
            ctx.lineWidth = (near > 0.08 ? 1.4 : 0.9) * Math.max(0.6, fit);
            ctx.stroke();
        }

        // opportunistic links: nodes that drift close together as the
        // cluster rotates connect briefly — a living structure even
        // when the cursor isn't near it
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                const key = i < j ? i + "_" + j : j + "_" + i;
                if (edgeKeys.has(key)) continue;
                const dx = projected[i].x - projected[j].x;
                const dy = projected[i].y - projected[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 90 * fit) {
                    const near = Math.max(projected[i].near, projected[j].near);
                    ctx.beginPath();
                    ctx.moveTo(projected[i].x, projected[i].y);
                    ctx.lineTo(projected[j].x, projected[j].y);
                    ctx.strokeStyle = "rgba(" + ACCENT + ", " + (0.05 + near * 0.3) + ")";
                    ctx.lineWidth = 0.7 * Math.max(0.6, fit);
                    ctx.stroke();
                }
            }
        }

        // nodes: closer to camera (bigger scale) reads brighter/larger.
        // Ones the cursor is near get a soft accent glow — the one
        // spot glow is allowed to show, kept tight to the node itself
        // rather than a wash over the whole structure.
        // Technology labels ride along beside each node. Dropped
        // below a fit threshold (small/mobile canvases) so the graph
        // stays clean rather than cluttered, per the "large + smooth
        // over labels" fallback.
        const showLabels = fit > 0.55;
        const labelCandidates = [];
        for (let i = 0; i < projected.length; i++) {
            const p = projected[i];
            const depth = Math.max(0, Math.min(1, (p.scale - 0.75) / 0.5));
            const color = p.near > 0.08 ? ACCENT : BASE;
            const nodeR = (2.5 + depth * 1.6 + p.near * 3.0) * Math.max(0.55, fit);
            if (p.near > 0.15) {
                ctx.shadowColor = "rgba(" + ACCENT + ", " + Math.min(0.85, p.near) + ")";
                ctx.shadowBlur = 16 * p.near;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, nodeR, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + color + ", " + Math.min(1, 0.6 + depth * 0.35 + p.near * 0.4) + ")";
            ctx.fill();
            ctx.shadowBlur = 0;

            // label anchors toward the cluster's own center rather
            // than outward, so it reads inward on both sides of the
            // sphere and never runs off the canvas edge
            if (showLabels && p.label) {
                const anchorLeft = p.x > centerX;
                const offset = nodeR + 7 * fit;
                const fontSize = 10 * Math.max(0.65, fit);
                const textW = p.label.length * fontSize * 0.62;
                const lx = p.x + (anchorLeft ? -offset : offset);
                const boxLeft = anchorLeft ? lx - textW : lx;
                labelCandidates.push({
                    text: p.label, x: lx, y: p.y,
                    align: anchorLeft ? "right" : "left",
                    color: color,
                    alpha: Math.min(0.9, 0.28 + depth * 0.18 + p.near * 0.4),
                    fontSize: fontSize,
                    prominence: depth + p.near * 2,
                    box: { left: boxLeft, right: boxLeft + textW, top: p.y - fontSize * 0.65, bottom: p.y + fontSize * 0.65 }
                });
            }
        }

        // Labels are drawn most-prominent-first with simple box
        // collision suppression, so two nodes that briefly rotate
        // close together never render overlapping text — the
        // less-prominent one just sits out that frame.
        if (showLabels) {
            labelCandidates.sort(function (a, b) { return b.prominence - a.prominence; });
            ctx.textBaseline = "middle";
            const placed = [];
            for (let i = 0; i < labelCandidates.length; i++) {
                const c = labelCandidates[i];
                let overlaps = false;
                for (let j = 0; j < placed.length; j++) {
                    const b = placed[j];
                    if (c.box.left < b.right + 6 && c.box.right > b.left - 6 &&
                        c.box.top < b.bottom + 3 && c.box.bottom > b.top - 3) {
                        overlaps = true;
                        break;
                    }
                }
                if (overlaps) continue;
                ctx.font = c.fontSize.toFixed(1) + "px 'JetBrains Mono', monospace";
                ctx.textAlign = c.align;
                ctx.fillStyle = "rgba(" + c.color + ", " + c.alpha + ")";
                ctx.fillText(c.text, c.x, c.y);
                placed.push(c.box);
            }
        }

        if (prefersReducedMotion) {
            raf = null;
        } else {
            raf = requestAnimationFrame(draw);
        }
    }

    // Under reduced motion, draw() no longer reschedules itself, so any
    // input that should visibly update the (otherwise still) graph —
    // cursor position, container resize — asks for exactly one frame.
    function requestStaticFrame() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousemove", function (e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        if (prefersReducedMotion) requestStaticFrame();
    });
    canvas.addEventListener("mouseleave", function () {
        mouse.x = -9999;
        mouse.y = -9999;
        if (prefersReducedMotion) requestStaticFrame();
    });

    if (motionQuery) {
        const onMotionChange = function (e) {
            prefersReducedMotion = e.matches;
            requestStaticFrame(); // reduce: freeze on a still frame; no-reduce: resume the loop
        };
        motionQuery.addEventListener
            ? motionQuery.addEventListener("change", onMotionChange)
            : motionQuery.addListener(onMotionChange); // Safari < 14
    }

    new ResizeObserver(function () {
        resize();
        if (prefersReducedMotion) requestStaticFrame();
    }).observe(container);
    resize();

    new IntersectionObserver(function (entries) {
        const visible = entries[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(draw);
        if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }).observe(canvas);
})();

/* Hero "Ask My AI" button: points at the externally hosted chatbot
   (CHATBOT_URL, defined once in js/config.js). No chatbot code lives
   here -- this only ever sets an href. Until CHATBOT_URL is filled in,
   the button stays visible but inert instead of navigating to "#" and
   jumping the page to the top. */
(function () {
    const link = document.getElementById("ask-ai-link");
    if (!link) return;

    if (typeof CHATBOT_URL !== "undefined" && CHATBOT_URL) {
        link.href = CHATBOT_URL;
    } else {
        link.addEventListener("click", function (e) {
            e.preventDefault();
        });
    }
})();

/* Hero "Resume" button: same inert-until-configured pattern as the
   "Ask My AI" link above, driven by RESUME_URL in js/config.js. */
(function () {
    const link = document.getElementById("resume-link");
    if (!link) return;

    if (typeof RESUME_URL !== "undefined" && RESUME_URL) {
        link.href = RESUME_URL;
    } else {
        link.addEventListener("click", function (e) {
            e.preventDefault();
        });
    }
})();

/* Nav active-section indicator: highlights /skills, /experience, /projects
   as their section anchor crosses the vertical center of the viewport,
   falling back to /home near the top of the page. */
(function () {
    const navLinks = Array.prototype.slice.call(document.querySelectorAll(".vt-nav-links a"));
    const sections = ["skills", "experience", "projects"]
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    if (!navLinks.length || !sections.length) return;

    let current = "top";

    function setActive(id) {
        navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
    }

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) current = entry.target.id;
        });
        setActive(current);
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { sectionObserver.observe(s); });

    window.addEventListener("scroll", function () {
        if (window.scrollY < 80) { current = "top"; setActive("top"); }
    }, { passive: true });

    setActive("top");
})();

/* Subtle scroll-reveal for elements below the fold (skill cards, timeline
   items, project blocks) — opt-in via body.vt-js-ready in CSS so content
   stays fully visible if this script never runs. */
(function () {
    const items = document.querySelectorAll(".vt-reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
        items.forEach(function (el) { el.classList.add("is-visible"); });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });
})();
