import { CommandContext } from "grammy";
import { buildGoogleAuthUrl, ensureUserRecord, isGoogleConnected, syncGoogleContacts } from "../google";
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

        const syncedContacts = await syncGoogleContacts(sender);
        await ctx.reply(
            syncedContacts > 0
                ? `Sync completata. Ho importato ${syncedContacts} contatti Google con compleanno.`
                : "Sync completata. Non ho trovato contatti Google con compleanno."
        );
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
