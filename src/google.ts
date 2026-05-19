import { createHmac, timingSafeEqual } from "crypto";
import { bot, supabase } from "./bot";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_CONNECTIONS_URL = "https://people.googleapis.com/v1/people/me/connections";
const GOOGLE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/contacts.readonly"];
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

type GoogleTokenResponse = {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
};

type GoogleUserInfo = {
    sub: string;
    email?: string;
};

type GoogleBirthday = {
    date?: {
        day?: number;
        month?: number;
        year?: number;
    };
    metadata?: {
        primary?: boolean;
    };
};

type GoogleName = {
    displayName?: string;
    metadata?: {
        primary?: boolean;
    };
};

type GooglePerson = {
    resourceName?: string;
    etag?: string;
    birthdays?: GoogleBirthday[];
    names?: GoogleName[];
};

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getGoogleConfig() {
    return {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri: requiredEnv("GOOGLE_REDIRECT_URI"),
        stateSecret: process.env.GOOGLE_OAUTH_STATE_SECRET ?? requiredEnv("TELEGRAM_TOKEN"),
    };
}

function signState(payload: string, secret: string) {
    return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildGoogleAuthUrl(userId: number) {
    const { clientId, redirectUri, stateSecret } = getGoogleConfig();
    const payload = Buffer.from(
        JSON.stringify({ userId, issuedAt: Date.now() }),
        "utf8"
    ).toString("base64url");
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

export function verifyGoogleAuthState(state: string | undefined): number {
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
    if (
        expectedBuffer.length !== actualBuffer.length ||
        !timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
        throw new Error("Invalid OAuth state signature");
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        userId: number;
        issuedAt: number;
    };
    if (!decoded.userId || !decoded.issuedAt) {
        throw new Error("Invalid OAuth state payload");
    }

    if (Date.now() - decoded.issuedAt > OAUTH_STATE_TTL_MS) {
        throw new Error("Expired OAuth state");
    }

    return decoded.userId;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
}

async function saveGoogleAccount(
    userId: number,
    tokenData: GoogleTokenResponse,
    userInfo: GoogleUserInfo,
    existingRefreshToken?: string | null
) {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const refreshToken = tokenData.refresh_token ?? existingRefreshToken ?? null;

    const { error } = await supabase.from("users").update({
        google_access_token: tokenData.access_token,
        google_email: userInfo.email ?? null,
        google_refresh_token: refreshToken,
        google_subject: userInfo.sub,
        google_sync_enabled: true,
        google_sync_error: null,
        google_token_expires_at: expiresAt,
    }).eq("id", userId);

    if (error) {
        throw error;
    }
}

export async function ensureUserRecord(userId: number, name?: string | null) {
    const { error } = await supabase.from("users").upsert(
        [{ id: userId, name: name ?? null }],
        { onConflict: "id" }
    );

    if (error) {
        throw error;
    }
}

export async function exchangeGoogleCode(code: string, userId: number) {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();

    const tokenData = await fetchJson<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
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

    const userInfo = await fetchJson<GoogleUserInfo>(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });

    const { data, error } = await supabase
        .from("users")
        .select("google_refresh_token")
        .eq("id", userId)
        .single();
    if (error) {
        throw error;
    }

    await saveGoogleAccount(userId, tokenData, userInfo, data.google_refresh_token);
}

async function refreshGoogleAccessToken(userId: number) {
    const { clientId, clientSecret } = getGoogleConfig();
    const { data, error } = await supabase
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

    const tokenData = await fetchJson<GoogleTokenResponse>(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: data.google_refresh_token,
        }),
    });

    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("google_email, google_subject")
        .eq("id", userId)
        .single();
    if (userError) {
        throw userError;
    }

    await saveGoogleAccount(
        userId,
        tokenData,
        {
            sub: userData.google_subject ?? "",
            email: userData.google_email ?? undefined,
        },
        data.google_refresh_token
    );

    return tokenData.access_token;
}

function pickDisplayName(names: GoogleName[] | undefined) {
    if (!names?.length) {
        return null;
    }

    const primary = names.find((name) => name.metadata?.primary && name.displayName);
    return primary?.displayName ?? names.find((name) => name.displayName)?.displayName ?? null;
}

function pickBirthday(birthdays: GoogleBirthday[] | undefined) {
    if (!birthdays?.length) {
        return null;
    }

    const primary = birthdays.find(
        (birthday) => birthday.metadata?.primary && birthday.date?.day && birthday.date?.month
    );
    const selected = primary ?? birthdays.find((birthday) => birthday.date?.day && birthday.date?.month);
    if (!selected?.date?.day || !selected.date.month) {
        return null;
    }

    return {
        day: selected.date.day,
        month: selected.date.month,
        year: selected.date.year ?? null,
    };
}

async function listGoogleContacts(accessToken: string) {
    const imported: {
        birth_day: number;
        birth_month: number;
        birth_year: number | null;
        display_name: string;
        external_contact_id: string;
        google_contact_etag: string | null;
        source: "google";
    }[] = [];

    let pageToken: string | undefined;
    do {
        const params = new URLSearchParams({
            personFields: "birthdays,names,metadata",
            pageSize: "1000",
        });
        if (pageToken) {
            params.set("pageToken", pageToken);
        }

        const data = await fetchJson<{
            connections?: GooglePerson[];
            nextPageToken?: string;
        }>(`${GOOGLE_CONNECTIONS_URL}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        for (const person of data.connections ?? []) {
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
                google_contact_etag: person.etag ?? null,
                source: "google",
            });
        }

        pageToken = data.nextPageToken;
    } while (pageToken);

    return imported;
}

export async function syncGoogleContacts(userId: number) {
    try {
        const accessToken = await refreshGoogleAccessToken(userId);
        const contacts = await listGoogleContacts(accessToken);

        const { error: deleteError } = await supabase.from("birthdays").delete().eq("user_id", userId).eq("source", "google");
        if (deleteError) {
            throw deleteError;
        }

        if (contacts.length > 0) {
            const payload = contacts.map((contact) => ({
                ...contact,
                user_id: userId,
            }));

            const { error: insertError } = await supabase.from("birthdays").insert(payload);
            if (insertError) {
                throw insertError;
            }
        }

        const { error: updateError } = await supabase.from("users").update({
            google_last_synced_at: new Date().toISOString(),
            google_sync_enabled: true,
            google_sync_error: null,
        }).eq("id", userId);
        if (updateError) {
            throw updateError;
        }

        return contacts.length;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Google sync error";
        await supabase.from("users").update({
            google_sync_error: message,
        }).eq("id", userId);
        throw error;
    }
}

export async function isGoogleConnected(userId: number) {
    const { data, error } = await supabase
        .from("users")
        .select("google_refresh_token, google_subject")
        .eq("id", userId)
        .single();
    if (error) {
        throw error;
    }

    return Boolean(data.google_refresh_token && data.google_subject);
}

export async function completeGoogleAuthAndSync(code: string, userId: number) {
    await exchangeGoogleCode(code, userId);
    const syncedContacts = await syncGoogleContacts(userId);
    await bot.api.sendMessage(
        userId,
        syncedContacts > 0
            ? `Sync completata. Ho importato ${syncedContacts} contatti Google con compleanno.`
            : "Sync completata. Non ho trovato contatti Google con compleanno."
    );
}
