import { webhookCallback } from "grammy";
import { timingSafeEqual } from "crypto";
import express, { Request, Response, NextFunction } from "express";
import { Requests } from "./enums";
import { onTestCron } from "./requests/testCron";
import { onBirthDaysOfTheDay } from "./requests/bdaysOfTheDay";
import { completeGoogleAuthAndSync, verifyGoogleAuthState } from "./google";
import { bot, isProduction } from "./platform";
import { registerApiRoutes } from "./web-api";

function buildGoogleAuthCompletionHtml(payload: unknown) {
    const payloadJson = JSON.stringify(payload).replace(/</g, "\\u003c");

    return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google collegato</title>
  </head>
  <body>
    <p>Operazione completata. Puoi chiudere questa finestra.</p>
    <script>
      const payload = ${payloadJson};
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, "*");
        window.close();
      }
    </script>
  </body>
</html>`;
}

function hasValidSchedulerSecret(req: Request) {
    const configuredSecret = process.env.CRON_SECRET;
    if (!configuredSecret) {
        return !isProduction;
    }

    const providedSecret = req.header("x-cron-secret");
    if (!providedSecret) {
        return false;
    }

    const expected = Buffer.from(configuredSecret, "utf8");
    const actual = Buffer.from(providedSecret, "utf8");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function authorizeSchedulerRequest(req: Request, res: Response) {
    if (hasValidSchedulerSecret(req)) {
        return true;
    }

    if (!process.env.CRON_SECRET && isProduction) {
        res.status(500).send("Missing CRON_SECRET");
        return false;
    }

    res.status(401).send("Unauthorized");
    return false;
}

// Internal HTTP routes for scheduled tasks and OAuth callbacks
const onRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.method === "POST" && req.path === Requests.bdays) {
            if (!authorizeSchedulerRequest(req, res)) {
                return;
            }
            await onBirthDaysOfTheDay();
            res.status(200).send("done");
            return;
        } else if (req.method === "POST" && req.path === Requests.test) {
            if (!authorizeSchedulerRequest(req, res)) {
                return;
            }
            await onTestCron();
            res.status(200).send("done");
            return;
        } else if (req.method === "GET" && req.path === Requests.googleOAuthCallback) {
            const code = typeof req.query.code === "string" ? req.query.code : undefined;
            const state = typeof req.query.state === "string" ? req.query.state : undefined;
            if (!code) {
                res.status(400).send("Missing OAuth code");
                return;
            }

            const userId = verifyGoogleAuthState(state);
            const completion = await completeGoogleAuthAndSync(code, userId);
            res.status(200).type("html").send(buildGoogleAuthCompletionHtml({
                source: "tg-birthdays-google-auth",
                ...completion,
            }));
            return;
        }
        next();
    } catch (error) {
        console.error("Error in onRequest:", error);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * TODO:
 * - i18n
 */

const app = express();
app.use(express.json());
app.use(onRequest);
registerApiRoutes(app);

app.get("/", (_req, res) => {
    res.status(200).send("ok");
});

app.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
});

//deploy
if (isProduction) {
    app.post(Requests.telegramWebhook, webhookCallback(bot, "express"));
    /** listen */
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`OAuth callback listening on port ${PORT}`);
    });
    console.log(`Bot working on localhost`);
    bot.start();
}
