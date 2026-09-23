(() => {
    "use strict";

    let currentGameName = "";
    let currentGameImage = "";

    const locker = document.getElementById("sa-locker");

    if (!locker) {
        console.error("StickAch locker: #sa-locker not found.");
        return;
    }

    const gameName = document.getElementById("sa-game-name");
    const gameImage = document.getElementById("sa-game-image");
    const offersContainer = document.getElementById("sa-offers");
    const message = document.getElementById("sa-locker-message");
    const closeButton = document.getElementById("sa-locker-close");

    /*
     * Open locker
     */
    window.openLocker = function (itemName = "", itemImg = "") {
        currentGameName = String(itemName || "");
        currentGameImage = String(itemImg || "");

        if (gameName) {
            gameName.textContent =
                currentGameName || "Your game";
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


    /*
     * Close locker
     */
    window.closeLocker = function () {
        locker.classList.remove("sa-open");

        document.body.style.overflow = "";

        if (offersContainer) {
            offersContainer.innerHTML = "";
        }

        if (message) {
            message.textContent =
                "Choose an available offer below and follow the advertiser's requirements.";
        }
    };


    /*
     * Close button
     */
    closeButton?.addEventListener(
        "click",
        window.closeLocker
    );


    /*
     * Click outside modal
     */
    locker.addEventListener("click", (event) => {
        if (event.target === locker) {
            window.closeLocker();
        }
    });


    /*
     * ESC key
     */
    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            locker.classList.contains("sa-open")
        ) {
            window.closeLocker();
        }
    });


    /*
     * Loading UI
     */
    function showLoading() {
        if (!offersContainer) return;

        offersContainer.innerHTML = `
            <div class="sa-loading">
                <span class="sa-spinner"></span>
                <span>Loading available offers...</span>
            </div>
        `;
    }


    /*
     * Error UI
     */
    function showError(text) {
        if (!offersContainer) return;

        offersContainer.innerHTML = "";

        const error = document.createElement("div");

        error.className = "sa-error";

        error.textContent = text;

        offersContainer.appendChild(error);
    }


    /*
     * Empty UI
     */
    function showEmpty() {
        if (!offersContainer) return;

        offersContainer.innerHTML = `
            <div class="sa-empty">
                No offers are currently available for your device or location.
                Please try again later.
            </div>
        `;
    }


    /*
     * Load OGAds offers through Netlify Function
     */
    async function loadOffers() {
        showLoading();

        if (message) {
            message.textContent =
                "Choose an available offer below and follow the advertiser's requirements.";
        }

        try {
            const site =
                window.location.origin +
                window.location.pathname;

            const endpoint =
                `/.netlify/functions/offers?max=5&site=${encodeURIComponent(site)}`;

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    `Request failed: ${response.status}`
                );
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(
                    data.error ||
                    "Could not load offers."
                );
            }

            const offers =
                Array.isArray(data.offers)
                    ? data.offers
                    : [];

            if (!offers.length) {
                showEmpty();
                return;
            }

            renderOffers(offers);

        } catch (error) {
            console.error(
                "StickAch offers error:",
                error
            );

            showError(
                "We couldn't load the available offers right now. Please try again."
            );
        }
    }


    /*
     * Render offers
     */
    function renderOffers(offers) {
        if (!offersContainer) return;

        offersContainer.innerHTML = "";

        offers.forEach((offer) => {
            const card =
                document.createElement("a");

            card.className = "sa-offer";

            /*
             * Use the advertiser tracking link.
             */
            card.href = offer.link;

            card.target = "_blank";
            card.rel = "noopener noreferrer";

            /*
             * Image
             */
            const image =
                document.createElement("img");

            image.className =
                "sa-offer-image";

            image.alt = "";

            image.loading = "lazy";

            if (offer.picture) {
                image.src = offer.picture;
            } else {
                image.style.display = "none";
            }


            /*
             * Content
             */
            const content =
                document.createElement("div");

            content.className =
                "sa-offer-content";


            const name =
                document.createElement("div");

            name.className =
                "sa-offer-name";

            name.textContent =
                offer.name ||
                "Available Offer";


            const description =
                document.createElement("div");

            description.className =
                "sa-offer-description";

            description.textContent =
                offer.description ||
                "Follow the requirements shown by the advertiser.";


            content.appendChild(name);
            content.appendChild(description);


            /*
             * Arrow
             */
            const arrow =
                document.createElement("div");

            arrow.className =
                "sa-offer-arrow";

            arrow.textContent = "→";


            card.appendChild(image);
            card.appendChild(content);
            card.appendChild(arrow);


            /*
             * Track only the fact that the user clicked
             * an offer locally. This is NOT conversion
             * verification.
             */
            card.addEventListener("click", () => {
                try {
                    localStorage.setItem(
                        "stickach_last_offer_click",
                        String(Date.now())
                    );
                } catch (_) {
                    // Ignore storage errors.
                }

                showOpenedMessage();
            });


            offersContainer.appendChild(card);
        });
    }


    /*
     * Transparent post-click message.
     * It does NOT claim that the offer was completed.
     */
    function showOpenedMessage() {
        if (!message) return;

        message.textContent =
            "Offer opened. Complete the requirements shown by the advertiser. Completion cannot be verified by this site without a conversion-status system.";
    }


    /*
     * Optional helper:
     * You can call this from game cards.
     */
    window.StickAchLocker = {
        open: window.openLocker,
        close: window.closeLocker,
        reloadOffers: loadOffers
    };

})();
