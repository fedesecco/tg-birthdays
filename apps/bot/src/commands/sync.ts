import { CommandContext } from "grammy";
import { buildGoogleAuthUrl, ensureUserRecord, formatGoogleSyncReport, isGoogleConnected, syncGoogleContacts } from "../google";
import { Commands, Messages, MyContext } from "../enums";

export async function onSync(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.sync} triggered`);
    const sender = ctx.from.id;
    const senderName = ctx.from.first_name;
    const senderSurname = ctx.from.last_name;

    try {
        await ensureUserRecord(sender, senderSurname ? `${senderName} ${senderSurname}` : senderName);

        if (!(await isGoogleConnected(sender))) {
            const authUrl = buildGoogleAuthUrl(sender);
            await ctx.reply(
                `Per sincronizzare i compleanni da Google devi prima collegare il tuo account.\n${authUrl}`
            );
            return;
        }

        const result = await syncGoogleContacts(sender);
        for (const message of formatGoogleSyncReport(result)) {
            await ctx.reply(message, { parse_mode: "HTML" });
        }
    } catch (error) {
        console.log("Error during /sync: ", error);
        const message = error instanceof Error ? error.message : "";
        if (message.includes("invalid_grant") || message.includes("Google account not connected")) {
            const authUrl = buildGoogleAuthUrl(sender);
            await ctx.reply(`Il collegamento Google va rinnovato.\n${authUrl}`);
            return;
        }

        await ctx.reply(Messages.ErrorOnRequest);
    }
}
