"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeGoogleAuthAndSync = exports.isGoogleConnected = exports.syncGoogleContacts = exports.exchangeGoogleCode = exports.ensureUserRecord = exports.verifyGoogleAuthState = exports.buildGoogleAuthUrl = void 0;
const crypto_1 = require("crypto");
const bot_1 = require("./bot");
const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_CONNECTIONS_URL = "https://people.googleapis.com/v1/people/me/connections";
const GOOGLE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/contacts.readonly"];
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
function requiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function getGoogleConfig() {
    var _a;
    return {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri: requiredEnv("GOOGLE_REDIRECT_URI"),
        stateSecret: (_a = process.env.GOOGLE_OAUTH_STATE_SECRET) !== null && _a !== void 0 ? _a : requiredEnv("TELEGRAM_TOKEN"),
    };
}
function signState(payload, secret) {
    return (0, crypto_1.createHmac)("sha256", secret).update(payload).digest("hex");
}
function buildGoogleAuthUrl(userId) {
    const { clientId, redirectUri, stateSecret } = getGoogleConfig();
    const payload = Buffer.from(JSON.stringify({ userId, issuedAt: Date.now() }), "utf8").toString("base64url");
    const signature = signState(payload, stateSecret);
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: GOOGLE_SCOPES.join(" "),
        state: `${payload}.${signature}`,
    });
    return `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
}
exports.buildGoogleAuthUrl = buildGoogleAuthUrl;
function verifyGoogleAuthState(state) {
    if (!state) {
        throw new Error("Missing OAuth state");
    }
    const [payload, signature] = state.split(".");
    if (!payload || !signature) {
        throw new Error("Invalid OAuth state format");
    }
    const { stateSecret } = getGoogleConfig();
    const expectedSignature = signState(payload, stateSecret);
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");
    if (expectedBuffer.length !== actualBuffer.length ||
        !(0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer)) {
        throw new Error("Invalid OAuth state signature");
    }
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.userId || !decoded.issuedAt) {
        throw new Error("Invalid OAuth state payload");
    }
    if (Date.now() - decoded.issuedAt > OAUTH_STATE_TTL_MS) {
        throw new Error("Expired OAuth state");
    }
    return decoded.userId;
}
exports.verifyGoogleAuthState = verifyGoogleAuthState;
function fetchJson(url, init) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(url, init);
        if (!response.ok) {
            const body = yield response.text();
            throw new Error(`Request failed (${response.status}): ${body}`);
        }
        return (yield response.json());
    });
}
function saveGoogleAccount(userId, tokenData, userInfo, existingRefreshToken) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
        const refreshToken = (_b = (_a = tokenData.refresh_token) !== null && _a !== void 0 ? _a : existingRefreshToken) !== null && _b !== void 0 ? _b : null;
        const { error } = yield bot_1.supabase.from("users").update({
            google_access_token: tokenData.access_token,
            google_email: (_c = userInfo.email) !== null && _c !== void 0 ? _c : null,
            google_refresh_token: refreshToken,
            google_subject: userInfo.sub,
            google_sync_enabled: true,
            google_sync_error: null,
            google_token_expires_at: expiresAt,
        }).eq("id", userId);
        if (error) {
            throw error;
        }
    });
}
function ensureUserRecord(userId, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = yield bot_1.supabase.from("users").upsert([{ id: userId, name: name !== null && name !== void 0 ? name : null }], { onConflict: "id" });
        if (error) {
            throw error;
        }
    });
}
exports.ensureUserRecord = ensureUserRecord;
function exchangeGoogleCode(code, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { clientId, clientSecret, redirectUri } = getGoogleConfig();
        const tokenData = yield fetchJson(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });
        const userInfo = yield fetchJson(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        const { data, error } = yield bot_1.supabase
            .from("users")
            .select("google_refresh_token")
            .eq("id", userId)
            .single();
        if (error) {
            throw error;
        }
        yield saveGoogleAccount(userId, tokenData, userInfo, data.google_refresh_token);
    });
}
exports.exchangeGoogleCode = exchangeGoogleCode;
function refreshGoogleAccessToken(userId) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { clientId, clientSecret } = getGoogleConfig();
        const { data, error } = yield bot_1.supabase
            .from("users")
            .select("google_refresh_token")
            .eq("id", userId)
            .single();
        if (error) {
            throw error;
        }
        if (!data.google_refresh_token) {
            throw new Error("Google account not connected");
        }
        const tokenData = yield fetchJson(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "refresh_token",
                refresh_token: data.google_refresh_token,
            }),
        });
        const { data: userData, error: userError } = yield bot_1.supabase
            .from("users")
            .select("google_email, google_subject")
            .eq("id", userId)
            .single();
        if (userError) {
            throw userError;
        }
        yield saveGoogleAccount(userId, tokenData, {
            sub: (_a = userData.google_subject) !== null && _a !== void 0 ? _a : "",
            email: (_b = userData.google_email) !== null && _b !== void 0 ? _b : undefined,
        }, data.google_refresh_token);
        return tokenData.access_token;
    });
}
function pickDisplayName(names) {
    var _a, _b, _c;
    if (!(names === null || names === void 0 ? void 0 : names.length)) {
        return null;
    }
    const primary = names.find((name) => { var _a; return ((_a = name.metadata) === null || _a === void 0 ? void 0 : _a.primary) && name.displayName; });
    return (_c = (_a = primary === null || primary === void 0 ? void 0 : primary.displayName) !== null && _a !== void 0 ? _a : (_b = names.find((name) => name.displayName)) === null || _b === void 0 ? void 0 : _b.displayName) !== null && _c !== void 0 ? _c : null;
}
function pickBirthday(birthdays) {
    var _a, _b;
    if (!(birthdays === null || birthdays === void 0 ? void 0 : birthdays.length)) {
        return null;
    }
    const primary = birthdays.find((birthday) => { var _a, _b, _c; return ((_a = birthday.metadata) === null || _a === void 0 ? void 0 : _a.primary) && ((_b = birthday.date) === null || _b === void 0 ? void 0 : _b.day) && ((_c = birthday.date) === null || _c === void 0 ? void 0 : _c.month); });
    const selected = primary !== null && primary !== void 0 ? primary : birthdays.find((birthday) => { var _a, _b; return ((_a = birthday.date) === null || _a === void 0 ? void 0 : _a.day) && ((_b = birthday.date) === null || _b === void 0 ? void 0 : _b.month); });
    if (!((_a = selected === null || selected === void 0 ? void 0 : selected.date) === null || _a === void 0 ? void 0 : _a.day) || !selected.date.month) {
        return null;
    }
    return {
        day: selected.date.day,
        month: selected.date.month,
        year: (_b = selected.date.year) !== null && _b !== void 0 ? _b : null,
    };
}
function listGoogleContacts(accessToken) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const imported = [];
        let pageToken;
        do {
            const params = new URLSearchParams({
                personFields: "birthdays,names,metadata",
                pageSize: "1000",
            });
            if (pageToken) {
                params.set("pageToken", pageToken);
            }
            const data = yield fetchJson(`${GOOGLE_CONNECTIONS_URL}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            for (const person of (_a = data.connections) !== null && _a !== void 0 ? _a : []) {
                const displayName = pickDisplayName(person.names);
                const birthday = pickBirthday(person.birthdays);
                if (!displayName || !birthday || !person.resourceName) {
                    continue;
                }
                imported.push({
                    birth_day: birthday.day,
                    birth_month: birthday.month,
                    birth_year: birthday.year,
                    display_name: displayName,
                    external_contact_id: person.resourceName,
                    google_contact_etag: (_b = person.etag) !== null && _b !== void 0 ? _b : null,
                    source: "google",
                });
            }
            pageToken = data.nextPageToken;
        } while (pageToken);
        return imported;
    });
}
function syncGoogleContacts(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accessToken = yield refreshGoogleAccessToken(userId);
            const contacts = yield listGoogleContacts(accessToken);
            const { error: deleteError } = yield bot_1.supabase.from("birthdays").delete().eq("user_id", userId).eq("source", "google");
            if (deleteError) {
                throw deleteError;
            }
            if (contacts.length > 0) {
                const payload = contacts.map((contact) => (Object.assign(Object.assign({}, contact), { user_id: userId })));
                const { error: insertError } = yield bot_1.supabase.from("birthdays").insert(payload);
                if (insertError) {
                    throw insertError;
                }
            }
            const { error: updateError } = yield bot_1.supabase.from("users").update({
                google_last_synced_at: new Date().toISOString(),
                google_sync_enabled: true,
                google_sync_error: null,
            }).eq("id", userId);
            if (updateError) {
                throw updateError;
            }
            return contacts.length;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown Google sync error";
            yield bot_1.supabase.from("users").update({
                google_sync_error: message,
            }).eq("id", userId);
            throw error;
        }
    });
}
exports.syncGoogleContacts = syncGoogleContacts;
function isGoogleConnected(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield bot_1.supabase
            .from("users")
            .select("google_refresh_token, google_subject")
            .eq("id", userId)
            .single();
        if (error) {
            throw error;
        }
        return Boolean(data.google_refresh_token && data.google_subject);
    });
}
exports.isGoogleConnected = isGoogleConnected;
function completeGoogleAuthAndSync(code, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exchangeGoogleCode(code, userId);
        const syncedContacts = yield syncGoogleContacts(userId);
        yield bot_1.bot.api.sendMessage(userId, syncedContacts > 0
            ? `Sync completata. Ho importato ${syncedContacts} contatti Google con compleanno.`
            : "Sync completata. Non ho trovato contatti Google con compleanno.");
    });
}
exports.completeGoogleAuthAndSync = completeGoogleAuthAndSync;
