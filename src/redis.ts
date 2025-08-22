import { Redis } from "@upstash/redis";
import * as Cookies from "es-cookie";

// Initialize Redis client. This uses environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN).
// Make sure these are set in your environment where the script runs.
const redis = Redis.fromEnv();

export type WebsiteType = "pixiv" | "syosetsu";

/**
 * Represents a single parsed cookie with its attributes.
 */
type CookieAttributes = {
    name: string;
    value: string;
    expires?: string; // Date string (e.g., "Thu, 01 Jan 2026 00:00:00 GMT")
    max_age?: number; // In seconds
    domain?: string;
    path?: string;
    secure?: boolean;
    httponly?: boolean;
    samesite?: "Strict" | "Lax" | "None";
    [key: string]: any; // Allow for other custom attributes if they appear
};

/**
 * The structure for storing all cookies for a specific website.
 * Keyed by cookie name for easy lookup/update.
 */
type WebsiteCookieStore = {
    [cookieName: string]: CookieAttributes;
};

/**
 * Helper function to parse a single 'Set-Cookie' header string into a structured object.
 * @param setCookieString The raw 'Set-Cookie' header string.
 * @returns A `CookieAttributes` object.
 */
export function parseSetCookie(setCookieString: string): CookieAttributes {
    const parts = setCookieString.split(";").map((part) => part.trim());
    // Initialize with required properties, other properties will be added dynamically.
    const cookie: CookieAttributes = { name: "", value: "" };

    const [nameValue] = parts.splice(0, 1); // Get "name=value" part
    const [name, value] = nameValue.split("=");
    cookie.name = name;
    cookie.value = value;

    parts.forEach((part) => {
        if (part.includes("=")) {
            const [attrName, attrValue] = part.split("=");
            const lowerCaseAttrName = attrName.toLowerCase();
            // Special handling for specific attributes for type correctness
            if (lowerCaseAttrName === "max-age") {
                cookie.max_age = parseInt(attrValue, 10);
            } else if (lowerCaseAttrName === "samesite") {
                cookie.samesite = attrValue as "Strict" | "Lax" | "None";
            } else {
                cookie[lowerCaseAttrName] = attrValue;
            }
        } else {
            // Handle flag attributes (e.g., "Secure", "HttpOnly")
            cookie[part.toLowerCase()] = true;
        }
    });

    return cookie;
}

/**
 * Retrieves stored cookies for a specific website type from Redis.
 * Filters out expired cookies before returning.
 * @param props An object containing the `websiteType`.
 * @returns A `WebsiteCookieStore` object if cookies are found and valid, otherwise `undefined`.
 */
export async function getCookiesFromRedis(props: {
    websiteType: WebsiteType;
}): Promise<string | undefined> {
    const { websiteType } = props;
    const key = websiteType; // Using websiteType directly as the Redis key

    // Retrieve the stored object, asserting its type
    const cookies = await redis.get<string>(key);

    if (cookies) {
        return cookies;
    }
    return undefined;
}

export async function updateCookiesToRedis(props: {
    websiteType: WebsiteType;
    setCookieArr: string[];
}) {
    const { websiteType, setCookieArr } = props;
    if (!setCookieArr || setCookieArr.length === 0) return;
    const originalCookiesStr = (await getCookiesFromRedis({ websiteType }))!;
    const originalCookiesJSON = Cookies.parse(originalCookiesStr);

    const setCookiesStr = setCookieArr.join("; ")
    const setCookiesJSON = Cookies.parse(setCookiesStr)

    // let newCookiesStr = ""
    // Object.keys(originalCookiesJSON).forEach(key => {
    //     if (key in setCookiesJSON) {
    //         newCookiesStr += `${key}=${setCookiesJSON[key]}; `
    //     } else {
    //         newCookiesStr += `${key}=${originalCookiesJSON[key]}; `
    //     }
    // })

    const newCookiesJSON = structuredClone(originalCookiesJSON)
    Object.keys(originalCookiesJSON).forEach(key => {
        if (key in setCookiesJSON) {
            newCookiesJSON[key] = setCookiesJSON[key]
        }
    })

    // console.log(newCookiesJSON)
    const key = websiteType    
    const newCookiesStr = Object.keys(newCookiesJSON).map(key => `${key}=${newCookiesJSON[key]}`).join("; ")
    await redis.set(key, newCookiesStr)
}
