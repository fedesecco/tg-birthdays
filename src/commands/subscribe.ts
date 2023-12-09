import { CommandContext } from "grammy";
import { supabase } from "../bot";
import { Commands, MyContext, Messages } from "../enums";

export async function onSubscribe(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.subscribe} triggered`);
    const sender = ctx.from.id;

    let { data, error } = await supabase.from("users").select("*").eq("id", sender);
    if (error) console.log(`Error on from('users').select('*').eq('id', ${sender}): `, error);

    const user = data[0];
    if (user.status == "SUBSCRIBED") {
        await ctx.reply("Sei già iscritto/a! Il messaggio dovrebbe arrivare ogni giorno alle 7:55");
    } else if (user.status === "PAUSED") {
        const { error } = await supabase.from("users").update({ status: "SUBSCRIBED" }).eq("id", sender);
        if (error) {
            console.log(`Error on update: `, error);
            await ctx.reply(Messages.ErrorOnRequest);
        } else {
            await ctx.reply("Sei di nuovo iscritto/a! Il messaggio dovrebbe arrivare ogni giorno alle 7:55");
        }
    }
}
