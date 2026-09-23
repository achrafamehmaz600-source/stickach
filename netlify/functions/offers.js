export default async (request) => {
    try {
        /* ------------------------------------------------------------
           Method check
           ------------------------------------------------------------ */
        if (request.method !== "GET") {
            return json(405, {
                success: false,
                error: "Method not allowed"
            });
        }

        /* ------------------------------------------------------------
           API key
           ------------------------------------------------------------ */
        const apiKey = Netlify.env.get("OGADS_API_KEY");

        if (!apiKey) {
            console.error("OGADS_API_KEY is missing");
            return json(500, {
                success: false,
                error: "Server configuration error"
            });
        }

        const url = new URL(request.url);

        /* ------------------------------------------------------------
           max — between 1 and 10
           ------------------------------------------------------------ */
        const max = Math.min(
            Math.max(parseInt(url.searchParams.get("max") || "5", 10), 1),
            10
        );

        /* ------------------------------------------------------------
           site — whitelist hostname ONLY
           Covers all 53 games + any future page on the same domain.
           ------------------------------------------------------------ */
        const ALLOWED_HOSTS = new Set([
            "stickach1.netlify.app"
            // zid hna ay domain akhor ila 3ndk:
            // "stickach.com",
            // "www.stickach.com"
        ]);

        const DEFAULT_SITE = "https://stickach1.netlify.app/";

        const rawSite = url.searchParams.get("site") || DEFAULT_SITE;

        let site;
        try {
            const u = new URL(rawSite);

            if (!ALLOWED_HOSTS.has(u.hostname)) {
                return json(400, {
                    success: false,
                    error: "Invalid site host"
                });
            }

            if (u.protocol !== "https:" && u.protocol !== "http:") {
                return json(400, {
                    success: false,
                    error: "Invalid site protocol"
                });
            }

            u.hash = ""; // strip #hash
            site = u.toString();
        } catch {
            return json(400, {
                success: false,
                error: "Invalid site URL"
            });
        }

        /* ------------------------------------------------------------
           Visitor info
           ------------------------------------------------------------ */
        const userAgent = request.headers.get("user-agent") || "";

        // Full language tag (e.g. "ar-MA", "fr-FR", "en-US").
        // OGAds uses this to translate offers for non-English visitors.
        const lang = parseLang(request.headers.get("accept-language"));

        // Netlify provides the visitor IP through this header.
        const ip =
            request.headers.get("x-nf-client-connection-ip") || "";

        if (!ip) {
            return json(400, {
                success: false,
                error: "Visitor IP could not be detected"
            });
        }

        /* ------------------------------------------------------------
           Build OGAds request
           ------------------------------------------------------------ */
        const params = new URLSearchParams();
        params.set("ip", ip);
        params.set("user_agent", userAgent); // بدلها بـ"ua" ila OGAds talbat hadak
        params.set("lang", lang);
        params.set("site", site);
        params.set("max", String(max));

        const ogadsResponse = await fetch(
            `https://trkoffer.net/api/v2?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "application/json"
                }
            }
        );

        const rawText = await ogadsResponse.text();

        let data;
        try {
            data = JSON.parse(rawText);
        } catch {
            console.error("OGAds returned invalid JSON:", rawText);
            return json(502, {
                success: false,
                error: "Invalid response from offer provider"
            });
        }

        if (!ogadsResponse.ok) {
            console.error("OGAds API error:", ogadsResponse.status, data);
            return json(502, {
                success: false,
                error: "Offer provider request failed"
            });
        }

        /* ------------------------------------------------------------
           Normalize offers
           ------------------------------------------------------------ */
        const offers = Array.isArray(data)
            ? data
            : Array.isArray(data.offers)
                ? data.offers
                : [];

        const safeOffers = offers
            .filter((offer) => {
                return (
                    offer &&
                    typeof offer.link === "string" &&
                    offer.link.length > 0
                );
            })
            .slice(0, max)
            .map((offer) => ({
                offerid: offer.offerid ?? null,
                name:
                    offer.name_short ||
                    offer.name ||
                    "Available Offer",
                description:
                    offer.adcopy ||
                    offer.description ||
                    "Complete the requirements shown by the advertiser.",
                picture:
                    typeof offer.picture === "string"
                        ? offer.picture
                        : "",
                payout: offer.payout ?? null,
                device: offer.device ?? "",
                country: offer.country ?? "",
                link: offer.link
            }));

        return new Response(
            JSON.stringify({
                success: true,
                offers: safeOffers
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (error) {
        console.error("Offer function error:", error);
        return json(500, {
            success: false,
            error: "Unable to load offers"
        });
    }
};

/* ================================================================
   Helpers
   ================================================================ */

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

/*
 * Extract the FULL first language tag from Accept-Language,
 * keeping the region code when present.
 *
 *   "ar-MA,ar;q=0.9,fr;q=0.8" → "ar-MA"
 *   "en-US,en;q=0.9"          → "en-US"
 *   "fr"                      → "fr"
 *   ""                        → "en"
 */
function parseLang(header) {
    if (!header || typeof header !== "string") return "en";

    const first = header.split(",")[0].trim();
    const clean = first.split(";")[0].trim();

    return clean || "en";
}
