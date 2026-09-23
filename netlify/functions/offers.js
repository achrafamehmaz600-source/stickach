export default async (request) => {
    try {
        if (request.method !== "GET") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Method not allowed"
                }),
                {
                    status: 405,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const apiKey = Netlify.env.get("OGADS_API_KEY");

        if (!apiKey) {
            console.error("OGADS_API_KEY is missing");

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Server configuration error"
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const url = new URL(request.url);

        const max = Math.min(
            Math.max(
                parseInt(url.searchParams.get("max") || "5", 10),
                1
            ),
            10
        );

        const site =
            url.searchParams.get("site") ||
            "https://your-domain.netlify.app/";

        /*
         * Visitor information
         */
        const userAgent =
            request.headers.get("user-agent") || "";

        const lang =
            request.headers.get("accept-language") || "en-US";

        /*
         * Netlify normally provides the visitor IP
         * through x-nf-client-connection-ip.
         */
        const ip =
            request.headers.get("x-nf-client-connection-ip") ||
            "";

        if (!ip) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Visitor IP could not be detected"
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const params = new URLSearchParams();

        params.set("ip", ip);
        params.set("user_agent", userAgent);
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
            console.error(
                "OGAds returned invalid JSON:",
                rawText
            );

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid response from offer provider"
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (!ogadsResponse.ok) {
            console.error(
                "OGAds API error:",
                ogadsResponse.status,
                data
            );

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Offer provider request failed"
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        /*
         * Normalize the response.
         * We only send the fields needed by the frontend.
         */
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

                payout:
                    offer.payout ?? null,

                device:
                    offer.device ?? "",

                country:
                    offer.country ?? "",

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

        return new Response(
            JSON.stringify({
                success: false,
                error: "Unable to load offers"
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
