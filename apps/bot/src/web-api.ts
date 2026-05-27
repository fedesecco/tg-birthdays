import { createHmac, timingSafeEqual } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import {
    BirthdayContact,
    ContactListResponse,
    DuplicateCandidate,
    GoogleSyncResult,
    ManualContactInput,
    MergeDuplicateRequest,
    ReminderStatus,
    SessionSummary,
} from "@tg-birthdays/shared-types";
import {
    buildGoogleAuthUrl,
    ensureUserRecord,
    GoogleSyncCooldownError,
    isGoogleConnected,
    syncGoogleContacts,
} from "./google";
import { supabase } from "./platform";

type TelegramInitDataUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

type AuthenticatedRequest = Request & {
    authUser?: {
        id: number;
        name: string | null;
    };
};

type BirthdayRow = {
    id: number;
    display_name: string;
    birth_day: number;
    birth_month: number;
    birth_year: number | null;
    source: string;
    external_contact_id: string | null;
    google_contact_etag: string | null;
    created_at?: string;
    updated_at?: string;
};

function getValidationToken() {
    return process.env.TELEGRAM_TOKEN ?? process.env.TELEGRAM_DEV_BOT_TOKEN;
}

function buildDisplayName(user: TelegramInitDataUser) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return name || user.username || null;
}

function parseTelegramInitData(initData: string) {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
        throw new Error("Missing Telegram hash");
    }

    const pairs: string[] = [];
    const entries = [...params.entries()].filter(([key]) => key !== "hash").sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of entries) {
        pairs.push(`${key}=${value}`);
    }

    const token = getValidationToken();
    if (!token) {
        throw new Error("Missing Telegram token for Web App validation");
    }

    const secret = createHmac("sha256", "WebAppData").update(token).digest();
    const computedHash = createHmac("sha256", secret).update(pairs.join("\n")).digest("hex");
    const expected = Buffer.from(computedHash, "utf8");
    const actual = Buffer.from(hash, "utf8");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        throw new Error("Invalid Telegram Web App signature");
    }

    const userRaw = params.get("user");
    if (!userRaw) {
        throw new Error("Missing Telegram user payload");
    }

    const user = JSON.parse(userRaw) as TelegramInitDataUser;
    if (!user.id) {
        throw new Error("Missing Telegram user id");
    }

    return {
        id: user.id,
        name: buildDisplayName(user),
    };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const initData = req.header("x-telegram-init-data");
        if (initData) {
            req.authUser = parseTelegramInitData(initData);
            next();
            return;
        }

        if (process.env.NODE_ENV !== "production") {
            const devUserId = req.header("x-dev-user-id") ?? (typeof req.query.userId === "string" ? req.query.userId : undefined);
            if (devUserId) {
                const parsedUserId = Number.parseInt(devUserId, 10);
                if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
                    req.authUser = { id: parsedUserId, name: null };
                    next();
                    return;
                }
            }
        }

        res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        console.warn("Web auth failed", {
            hasInitData: Boolean(req.header("x-telegram-init-data")),
            message,
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.header("user-agent") ?? null,
        });
        res.status(401).json({ message });
    }
}

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Init-Data, X-Dev-User-Id");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    next();
}

function mapBirthdayContact(row: BirthdayRow): BirthdayContact {
    return {
        id: row.id,
        displayName: row.display_name,
        birthDay: row.birth_day,
        birthMonth: row.birth_month,
        birthYear: row.birth_year,
        source: row.source as BirthdayContact["source"],
        externalContactId: row.external_contact_id,
        googleContactEtag: row.google_contact_etag,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function compareContactsByName(a: BirthdayContact, b: BirthdayContact) {
    return a.displayName.localeCompare(b.displayName, "it", { sensitivity: "base" });
}

async function getSessionSummary(userId: number): Promise<SessionSummary> {
    const { data, error } = await supabase
        .from("users")
        .select("id, name, status, google_email, google_last_synced_at, google_sync_error, google_refresh_token, google_subject")
        .eq("id", userId)
        .single();

    if (error) {
        throw error;
    }

    return {
        userId: data.id,
        name: data.name,
        status: data.status as ReminderStatus,
        googleConnected: Boolean(data.google_refresh_token && data.google_subject),
        googleEmail: data.google_email,
        googleLastSyncedAt: data.google_last_synced_at,
        googleSyncError: data.google_sync_error,
    };
}

async function listContacts(
    userId: number,
    options?: { limit?: number; offset?: number; query?: string; source?: BirthdayContact["source"] | "all" }
): Promise<ContactListResponse> {
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
    const offset = Math.max(options?.offset ?? 0, 0);
    const query = options?.query?.trim() ?? "";
    const source = options?.source ?? "all";

    let request = supabase
        .from("birthdays")
        .select("id, display_name, birth_day, birth_month, birth_year, source, external_contact_id, google_contact_etag, created_at, updated_at")
        .eq("user_id", userId)
        .order("display_name", { ascending: true })
        .range(offset, offset + limit - 1);

    let countRequest = supabase
        .from("birthdays")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (source !== "all") {
        request = request.eq("source", source);
        countRequest = countRequest.eq("source", source);
    }

    if (query) {
        request = request.ilike("display_name", `%${query}%`);
        countRequest = countRequest.ilike("display_name", `%${query}%`);
    }

    const [{ data, error }, { count, error: countError }] = await Promise.all([request, countRequest]);

    if (error) {
        throw error;
    }
    if (countError) {
        throw countError;
    }

    return {
        contacts: (data ?? []).map((row) => mapBirthdayContact(row)),
        limit,
        offset,
        total: count ?? data?.length ?? 0,
    };
}

async function listAllContacts(userId: number) {
    const { data, error } = await supabase
        .from("birthdays")
        .select("id, display_name, birth_day, birth_month, birth_year, source, external_contact_id, google_contact_etag, created_at, updated_at")
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return (data ?? []).map((row) => mapBirthdayContact(row)).sort(compareContactsByName);
}

async function addManualContact(userId: number, input: ManualContactInput) {
    const displayName = input.displayName.trim();
    if (!displayName) {
        throw new Error("Display name is required");
    }
    if (displayName.length > 50) {
        throw new Error("Display name is too long");
    }
    if (input.birthDay < 1 || input.birthDay > 31 || input.birthMonth < 1 || input.birthMonth > 12) {
        throw new Error("Invalid birth date");
    }

    const { data, error } = await supabase
        .from("birthdays")
        .insert([
            {
                display_name: displayName,
                birth_day: input.birthDay,
                birth_month: input.birthMonth,
                birth_year: input.birthYear,
                source: "manual",
                user_id: userId,
            },
        ])
        .select("id, display_name, birth_day, birth_month, birth_year, source, external_contact_id, google_contact_etag, created_at, updated_at")
        .single();

    if (error) {
        throw error;
    }

    return mapBirthdayContact(data);
}

function normalizeName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenizeName(value: string) {
    return normalizeName(value).split(" ").filter(Boolean);
}

function sameBirthDate(a: BirthdayContact, b: BirthdayContact) {
    return a.birthDay === b.birthDay && a.birthMonth === b.birthMonth;
}

function isTokenSubset(a: BirthdayContact, b: BirthdayContact) {
    const aTokens = tokenizeName(a.displayName);
    const bTokens = tokenizeName(b.displayName);
    return aTokens.every((token) => bTokens.includes(token)) || bTokens.every((token) => aTokens.includes(token));
}

function hasSharedCoreTokens(a: BirthdayContact, b: BirthdayContact) {
    const aTokens = tokenizeName(a.displayName);
    const bTokens = tokenizeName(b.displayName);
    const shared = aTokens.filter((token) => bTokens.includes(token));
    return shared.length >= 2 || (shared.length >= 1 && sameBirthDate(a, b));
}

function choosePrimaryContact(a: BirthdayContact, b: BirthdayContact) {
    if (a.source === "google" && b.source !== "google") {
        return { primary: a, duplicate: b };
    }
    if (b.source === "google" && a.source !== "google") {
        return { primary: b, duplicate: a };
    }
    if (a.birthYear != null && b.birthYear == null) {
        return { primary: a, duplicate: b };
    }
    if (b.birthYear != null && a.birthYear == null) {
        return { primary: b, duplicate: a };
    }
    return a.id <= b.id ? { primary: a, duplicate: b } : { primary: b, duplicate: a };
}

function findDuplicateCandidates(contacts: BirthdayContact[]) {
    const candidates: DuplicateCandidate[] = [];

    for (let index = 0; index < contacts.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < contacts.length; otherIndex += 1) {
            const left = contacts[index];
            const right = contacts[otherIndex];
            if (!sameBirthDate(left, right)) {
                continue;
            }

            const sameNormalizedName = normalizeName(left.displayName) === normalizeName(right.displayName);
            const subsetMatch = isTokenSubset(left, right);
            const sharedTokens = hasSharedCoreTokens(left, right);

            let confidence: DuplicateCandidate["confidence"] | null = null;
            let reason = "";

            if (sameNormalizedName) {
                confidence = "exact";
                reason = "Stesso nome normalizzato e stessa data";
            } else if (subsetMatch) {
                confidence = "strong";
                reason = "Stessa data e un nome contiene l'altro";
            } else if (sharedTokens) {
                confidence = "weak";
                reason = "Stessa data e token del nome sovrapposti";
            }

            if (!confidence || confidence === "weak") {
                continue;
            }

            const pair = choosePrimaryContact(left, right);
            candidates.push({
                primary: pair.primary,
                duplicate: pair.duplicate,
                confidence,
                reason,
            });
        }
    }

    return candidates.sort((left, right) => {
        if (left.confidence !== right.confidence) {
            return left.confidence === "exact" ? -1 : 1;
        }
        return compareContactsByName(left.primary, right.primary);
    });
}

async function mergeDuplicatePair(userId: number, pair: MergeDuplicateRequest) {
    const { data, error } = await supabase
        .from("birthdays")
        .select("id, display_name, birth_day, birth_month, birth_year, source, external_contact_id, google_contact_etag, created_at, updated_at")
        .eq("user_id", userId)
        .in("id", [pair.primaryContactId, pair.duplicateContactId]);

    if (error) {
        throw error;
    }

    const rows = (data ?? []).map((row) => mapBirthdayContact(row));
    const primary = rows.find((row) => row.id === pair.primaryContactId);
    const duplicate = rows.find((row) => row.id === pair.duplicateContactId);
    if (!primary || !duplicate) {
        throw new Error("Duplicate pair not found");
    }

    const patch = {
        birth_year: primary.birthYear ?? duplicate.birthYear,
        external_contact_id: primary.externalContactId ?? duplicate.externalContactId,
        google_contact_etag: primary.googleContactEtag ?? duplicate.googleContactEtag,
        source: (primary.source === "google" || duplicate.source === "google" ? "google" : primary.source) as BirthdayContact["source"],
        updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.from("birthdays").update(patch).eq("id", primary.id);
    if (updateError) {
        throw updateError;
    }

    const { error: deleteError } = await supabase.from("birthdays").delete().eq("id", duplicate.id);
    if (deleteError) {
        throw deleteError;
    }
}

async function setReminderStatus(userId: number, status: ReminderStatus) {
    const { error } = await supabase.from("users").update({ status }).eq("id", userId);
    if (error) {
        throw error;
    }

    return getSessionSummary(userId);
}

function mapGoogleSyncResult(result: Awaited<ReturnType<typeof syncGoogleContacts>>): GoogleSyncResult {
    return {
        insertedCount: result.insertedCount,
        removedCount: result.removedCount,
        skippedCount: result.skippedCount,
        missingBirthdayCount: result.missingBirthdayCount,
        totalWithBirthday: result.totalWithBirthday,
        updatedCount: result.updatedCount,
        rows: result.rows.map((row) => ({
            birthDay: row.birth_day,
            birthMonth: row.birth_month,
            birthYear: row.birth_year,
            displayName: row.display_name,
            status: row.status,
        })),
    };
}

function asyncRoute(handler: (req: AuthenticatedRequest, res: Response) => Promise<void>) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        handler(req, res).catch(next);
    };
}

export function registerApiRoutes(app: express.Express) {
    app.use(corsMiddleware);

    const router = express.Router();
    router.use(authMiddleware);

    router.get("/session", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const session = await getSessionSummary(req.authUser!.id);
        res.json({ session });
    }));

    router.get("/contacts", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const limit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : undefined;
        const offset = typeof req.query.offset === "string" ? Number.parseInt(req.query.offset, 10) : undefined;
        const query = typeof req.query.query === "string" ? req.query.query : undefined;
        const source = req.query.source === "manual" || req.query.source === "google" ? req.query.source : "all";
        const response = await listContacts(req.authUser!.id, { limit, offset, query, source });
        res.json(response);
    }));

    router.post("/contacts/manual", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const created = await addManualContact(req.authUser!.id, req.body as ManualContactInput);
        res.status(201).json({ contact: created });
    }));

    router.get("/contacts/duplicates", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const contacts = await listAllContacts(req.authUser!.id);
        const duplicates = findDuplicateCandidates(contacts);
        res.json({ duplicates });
    }));

    router.post("/contacts/duplicates/merge", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const pairs = Array.isArray(req.body?.pairs) ? req.body.pairs as MergeDuplicateRequest[] : [];
        for (const pair of pairs) {
            await mergeDuplicatePair(req.authUser!.id, pair);
        }

        const allContacts = await listAllContacts(req.authUser!.id);
        const duplicates = findDuplicateCandidates(allContacts);
        res.json({ duplicates });
    }));

    router.get("/google/auth-url", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        res.json({
            authUrl: buildGoogleAuthUrl(req.authUser!.id),
            connected: await isGoogleConnected(req.authUser!.id),
        });
    }));

    router.post("/google/sync", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);

        const connected = await isGoogleConnected(req.authUser!.id);
        if (!connected) {
            res.status(409).json({
                connected: false,
                authUrl: buildGoogleAuthUrl(req.authUser!.id),
            });
            return;
        }

        let result;
        try {
            result = await syncGoogleContacts(req.authUser!.id);
        } catch (error) {
            if (error instanceof GoogleSyncCooldownError) {
                res.status(429).set("Retry-After", String(error.retryAfterSeconds)).json({
                    connected: true,
                    message: error.message,
                    nextAllowedAt: error.nextAllowedAt,
                    retryAfterSeconds: error.retryAfterSeconds,
                });
                return;
            }

            throw error;
        }

        res.json({
            connected: true,
            result: mapGoogleSyncResult(result),
        });
    }));

    router.patch("/settings/reminders", asyncRoute(async (req, res) => {
        await ensureUserRecord(req.authUser!.id, req.authUser!.name);
        const enabled = Boolean(req.body?.enabled);
        const session = await setReminderStatus(req.authUser!.id, enabled ? "SUBSCRIBED" : "PAUSED");
        res.json({ session });
    }));

    app.use("/api", router);

    app.use("/api", (_req, res) => {
        res.status(404).json({ message: "Not found" });
    });

    app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
        if (res.headersSent) {
            next(error);
            return;
        }

        console.error("API error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        res.status(500).json({ message });
    });
}
