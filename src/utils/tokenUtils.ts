import crypto from "crypto";

export const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

export const parseCookies = (header = "") =>
    Object.fromEntries(header.split(";").filter(Boolean).map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }));

export const refreshCookieName = "mergecanvas_refresh";
