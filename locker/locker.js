(() => {
    "use strict";

    /* ============================================================
       INJECT LOCKER HTML
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

              <div class="sa-game-preview">
                <img id="sa-game-image" class="sa-game-image" src="" alt="">
                <div class="sa-game-info">
                  <div class="sa-game-label">Selected game</div>
                  <div id="sa-game-name" class="sa-game-name">Your game</div>
                </div>
                <div class="sa-game-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              </div>

              <div class="sa-locker-progress">
                <div class="sa-locker-progress-bar">
                  <div class="sa-locker-progress-fill"></div>
                </div>
                <div class="sa-locker-progress-text">Step 1 of 2 — Complete one offer</div>
              </div>

              <p id="sa-locker-message" class="sa-locker-message">
                Choose one of the offers below to unlock your download.
              </p>

              <div id="sa-offers" class="sa-offers"></div>

              <div class="sa-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Offers are provided by verified third-party advertisers.</span>
              </div>

            </div>
          </div>
        </div>
        `;

        document.body.insertAdjacentHTML("beforeend", html);
    }

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
       SETUP
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
       OPEN LOCKER
       ============================================================ */
    window.openLocker = function (itemName = "", itemImg = "") {
        currentGameName = String(itemName || "");
        currentGameImage = String(itemImg || "");

        if (gameName) {
            gameName.textContent = currentGameName || "Your game";
        }

        if (gameImage) {
            if (currentGameImage) {
                gameImage.src = currentGameImage;
                gameImage.style.display = "block";
            } else {
                gameImage.style.display = "none";
            }
        }

        locker.classList.add("sa-open");
        document.body.style.overflow = "hidden";

        loadOffers();
    };

    /* ============================================================
       CLOSE LOCKER
       ============================================================ */
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
        offersContainer.innerHTML = `
            <div class="sa-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>${text}</span>
            </div>
        `;
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
       LOAD OFFERS  (max = 3)
       ============================================================ */
    async function loadOffers() {
        showLoading();

        if (message) {
            message.textContent =
                "Choose one of the offers below to unlock your download.";
        }

        try {
            const site = window.location.origin + window.location.pathname;
            const endpoint = `/.netlify/functions/offers?max=3&site=${encodeURIComponent(site)}`;

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

            const offers = Array.isArray(data.offers) ? data.offers.slice(0, 3) : [];

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
       RENDER OFFERS
       ============================================================ */
    function renderOffers(offers) {
        if (!offersContainer) return;
        offersContainer.innerHTML = "";

        offers.forEach((offer, index) => {
            const card = document.createElement("a");
            card.className = "sa-offer";
            card.href = offer.link;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.style.animationDelay = `${index * 60}ms`;

            /* Image */
            const imgWrap = document.createElement("div");
            imgWrap.className = "sa-offer-imgwrap";

            const image = document.createElement("img");
            image.className = "sa-offer-image";
            image.alt = "";
            image.loading = "lazy";

            if (offer.picture) {
                image.src = offer.picture;
            } else {
                image.style.display = "none";
                imgWrap.classList.add("sa-offer-no-img");
                imgWrap.innerHTML = `<span>${(offer.name || "?").charAt(0).toUpperCase()}</span>`;
            }

            imgWrap.appendChild(image);

            /* Content */
            const content = document.createElement("div");
            content.className = "sa-offer-content";

            const name = document.createElement("div");
            name.className = "sa-offer-name";
            name.textContent = offer.name || "Available Offer";

            const desc = document.createElement("div");
            desc.className = "sa-offer-description";
            desc.textContent = offer.description || "Complete the requirements to unlock.";

            content.appendChild(name);
            content.appendChild(desc);

            /* Arrow */
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
                    localStorage.setItem("stickach_last_offer_click", String(Date.now()));
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
