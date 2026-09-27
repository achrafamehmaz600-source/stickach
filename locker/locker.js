(() => {
    "use strict";

    /* ============================================================
       INJECT CSS
       ============================================================ */
    function injectLockerCSS() {
        if (document.querySelector('link[data-sa-locker-css]')) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/locker/locker.css";
        link.setAttribute("data-sa-locker-css", "1");
        document.head.appendChild(link);
    }

    /* ============================================================
       INJECT HTML
       ============================================================ */
    function injectLockerHTML() {
        if (document.getElementById("sa-locker")) return;

        const html = `
        <div id="sa-locker">
          <div class="sa-locker-box">

            <div class="sa-locker-glow"></div>
            <div class="sa-locker-top-line"></div>

            <div class="sa-locker-header">
              <div class="sa-locker-title-wrap">
                <div class="sa-locker-kicker">
                  <span class="sa-locker-kicker-dot"></span>
                  STICKACH ACCESS
                </div>
                <h2 class="sa-locker-title">Unlock Your Game</h2>
              </div>
              <button id="sa-locker-close" class="sa-locker-close" type="button" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="sa-locker-body">

              <!-- 1. Game Header (Matched to image style) -->
              <div class="sa-game-header">
                <div class="sa-game-header-top">
                  <img id="sa-game-image" class="sa-game-image" src="" alt="">
                  <div class="sa-game-header-info">
                    <div id="sa-game-name" class="sa-game-header-name">GTA V Mobile</div>
                    <div class="sa-game-header-sub">open-world - 1.9 GB</div>
                  </div>
                  <div class="sa-game-header-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                </div>
                <div class="sa-game-header-verified">
                  <span class="sa-locker-kicker-dot" style="width: 4px; height: 4px;"></span>
                  Quick Survey - Verified
                </div>
              </div>

              <!-- 2. Today's Deal -->
              <div class="sa-deal-box">
                <div class="sa-deal-label">TODAY'S DEAL</div>
                <div class="sa-deal-price">
                  <span class="sa-deal-crossed">$19.99</span> → <span class="sa-deal-free">FREE</span>
                </div>
                <div class="sa-deal-sub">You save $19.99 - normally premium</div>
              </div>

              <!-- 3. How to Unlock -->
              <div class="sa-steps-box">
                <div class="sa-steps-title">HOW TO UNLOCK - JUST 3 STEPS</div>
                <div class="sa-steps-grid">
                  <div class="sa-step">
                    <div class="sa-step-num">1</div>
                    <div class="sa-step-text">Pick a free<br>offer below</div>
                    <div class="sa-step-sub">no card asked</div>
                  </div>
                  <div class="sa-step">
                    <div class="sa-step-num">2</div>
                    <div class="sa-step-text">Answer a few<br>questions</div>
                    <div class="sa-step-sub">easy & fast</div>
                  </div>
                  <div class="sa-step">
                    <div class="sa-step-num">3</div>
                    <div class="sa-step-text">Game<br>unlocks</div>
                    <div class="sa-step-sub">automatic, no wait</div>
                  </div>
                </div>
                <div class="sa-steps-note">
                  A "free offer" here = a quick survey on topics you find interesting.<br>
                  Answer honestly, ~1 minute. Then your $19.99 game starts downloading automatically.
                </div>
              </div>

              <!-- 4. Pick One Offer Below -->
              <div class="sa-locker-progress">
                <div class="sa-locker-progress-text">— PICK ONE OFFER BELOW —</div>
                <div class="sa-locker-progress-bar">
                  <div class="sa-locker-progress-fill"></div>
                </div>
              </div>

              <p id="sa-locker-message" class="sa-locker-message">
                Choose one of the offers below to unlock your download.
              </p>

              <div id="sa-offers" class="sa-offers"></div>

              <!-- 5. How to Complete -->
              <div class="sa-complete-box">
                <div class="sa-complete-title">HOW TO COMPLETE</div>
                <div class="sa-complete-list">
                  <div class="sa-complete-item">
                    <div class="sa-complete-num">1</div>
                    <div><strong>Tap</strong> an offer above — quick survey</div>
                  </div>
                  <div class="sa-complete-item">
                    <div class="sa-complete-num">2</div>
                    <div><strong>Answer</strong> the questions honestly</div>
                  </div>
                  <div class="sa-complete-item">
                    <div class="sa-complete-num">3</div>
                    <div><strong>Complete</strong> the survey (~1 minute)</div>
                  </div>
                  <div class="sa-complete-item">
                    <div class="sa-complete-num">4</div>
                    <div><strong>Come back</strong> — game downloads automatically</div>
                  </div>
                </div>
              </div>

              <!-- 6. Help Footer (Accordion) -->
              <div class="sa-help-footer">
                <div class="sa-help-toggle">
                  <div class="sa-help-icon">?</div>
                  <div>Need detailed help completing the offer?</div>
                  <div class="sa-help-arrow">▼</div>
                </div>
                <div class="sa-help-content">
                  Pick the offer that feels easiest. All unlock the same game.
                </div>
              </div>

            </div>
          </div>
        </div>
        `;

        document.body.insertAdjacentHTML("beforeend", html);
    }

    /* ============================================================
       BOOT
       ============================================================ */
    injectLockerCSS();
    injectLockerHTML();

    let currentGameName = "";
    let currentGameImage = "";

    const locker = document.getElementById("sa-locker");
    const gameName = document.getElementById("sa-game-name");
    const gameImage = document.getElementById("sa-game-image");
    const offersContainer = document.getElementById("sa-offers");
    const message = document.getElementById("sa-locker-message");
    const closeButton = document.getElementById("sa-locker-close");

    /* ============================================================
       HELPERS
       ============================================================ */
    function safeHttpsUrl(url) {
        try {
            const u = new URL(url, window.location.origin);
            return (u.protocol === "https:" || u.protocol === "http:")
                ? u.toString()
                : "";
        } catch {
            return "";
        }
    }

    function currentPageSite() {
        return (
            window.location.origin +
            window.location.pathname +
            window.location.search
        );
    }

    /* ============================================================
       OPEN / CLOSE
       ============================================================ */
    window.openLocker = function (itemName = "", itemImg = "") {
        currentGameName = String(itemName || "");
        currentGameImage = safeHttpsUrl(itemImg);

        if (gameName) {
            gameName.textContent = currentGameName || "Your game";
        }

        if (gameImage) {
            if (currentGameImage) {
                gameImage.src = currentGameImage;
                gameImage.style.display = "block";
            } else {
                gameImage.removeAttribute("src");
                gameImage.style.display = "none";
            }
        }

        locker.classList.add("sa-open");
        document.body.style.overflow = "hidden";

        loadOffers();
    };

    window.closeLocker = function () {
        locker.classList.remove("sa-open");
        document.body.style.overflow = "";

        if (offersContainer) offersContainer.innerHTML = "";

        if (message) {
            message.textContent =
                "Choose one of the offers below to unlock your download.";
        }
    };

    closeButton?.addEventListener("click", window.closeLocker);

    locker.addEventListener("click", (event) => {
        if (event.target === locker) window.closeLocker();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && locker.classList.contains("sa-open")) {
            window.closeLocker();
        }
    });

    // Accordion Toggle for Help Footer
    const helpToggle = document.querySelector('.sa-help-toggle');
    if (helpToggle) {
        helpToggle.addEventListener('click', () => {
            const footer = helpToggle.closest('.sa-help-footer');
            if (footer) footer.classList.toggle('open');
        });
    }

    /* ============================================================
       UI STATES
       ============================================================ */
    function showLoading() {
        if (!offersContainer) return;
        offersContainer.innerHTML = `
            <div class="sa-loading">
                <span class="sa-spinner"></span>
                <span>Finding best offers for you...</span>
            </div>
        `;
    }

    function showError(text) {
        if (!offersContainer) return;
        offersContainer.innerHTML = "";

        const wrap = document.createElement("div");
        wrap.className = "sa-error";

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.style.width = "18px";
        svg.style.height = "18px";
        svg.style.flexShrink = "0";
        svg.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
        `;

        const span = document.createElement("span");
        span.textContent = String(text || "Something went wrong.");

        wrap.appendChild(svg);
        wrap.appendChild(span);
        offersContainer.appendChild(wrap);
    }

    function showEmpty() {
        if (!offersContainer) return;
        offersContainer.innerHTML = `
            <div class="sa-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="width:38px;height:38px;margin:0 auto 10px;display:block;opacity:.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
                </svg>
                No offers available right now for your device or location.
                <br>Please try again in a few minutes.
            </div>
        `;
    }

    /* ============================================================
       LOAD OFFERS
       ============================================================ */
    async function loadOffers() {
        showLoading();

        if (message) {
            message.textContent =
                "Choose one of the offers below to unlock your download.";
        }

        try {
            const site = currentPageSite();
            const endpoint =
                `/.netlify/functions/offers` +
                `?max=3&site=${encodeURIComponent(site)}`;

            const response = await fetch(endpoint, {
                method: "GET",
                headers: { "Accept": "application/json" },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Could not load offers.");
            }

            const offers = Array.isArray(data.offers)
                ? data.offers.slice(0, 3)
                : [];

            if (!offers.length) {
                showEmpty();
                return;
            }

            renderOffers(offers);
        } catch (error) {
            console.error("StickAch offers error:", error);
            showError("We couldn't load offers right now. Please try again.");
        }
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderOffers(offers) {
        if (!offersContainer) return;
        offersContainer.innerHTML = "";

        offers.forEach((offer, index) => {
            const link = safeHttpsUrl(offer.link);
            if (!link) return;

            const card = document.createElement("a");
            card.className = "sa-offer";
            card.href = link;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.style.animationDelay = `${index * 60}ms`;

            const imgWrap = document.createElement("div");
            imgWrap.className = "sa-offer-imgwrap";

            const picture = safeHttpsUrl(offer.picture);
            if (picture) {
                const image = document.createElement("img");
                image.className = "sa-offer-image";
                image.alt = "";
                image.loading = "lazy";
                image.src = picture;
                imgWrap.appendChild(image);
            } else {
                imgWrap.classList.add("sa-offer-no-img");
                const span = document.createElement("span");
                span.textContent = (offer.name || "?").charAt(0).toUpperCase();
                imgWrap.appendChild(span);
            }

            const content = document.createElement("div");
            content.className = "sa-offer-content";

            const name = document.createElement("div");
            name.className = "sa-offer-name";
            name.textContent = offer.name || "Available Offer";

            const desc = document.createElement("div");
            desc.className = "sa-offer-description";
            desc.textContent =
                offer.description || "Complete the requirements to unlock.";

            content.appendChild(name);
            content.appendChild(desc);

            const arrow = document.createElement("div");
            arrow.className = "sa-offer-arrow";
            arrow.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            `;

            card.appendChild(imgWrap);
            card.appendChild(content);
            card.appendChild(arrow);

            card.addEventListener("click", () => {
                try {
                    localStorage.setItem(
                        "stickach_last_offer_click",
                        String(Date.now())
                    );
                } catch (_) {}
                showOpenedMessage();
            });

            offersContainer.appendChild(card);
        });
    }

    function showOpenedMessage() {
        if (!message) return;
        message.textContent =
            "Offer opened. Complete the requirements shown by the advertiser to finish unlocking.";
    }

    /* ============================================================
       PUBLIC API
       ============================================================ */
    window.StickAchLocker = {
        open: window.openLocker,
        close: window.closeLocker,
        reloadOffers: loadOffers
    };
})();
