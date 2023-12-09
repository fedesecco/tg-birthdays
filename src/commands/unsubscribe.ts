import { CommandContext } from "grammy";
import { supabase } from "../bot";
import { Commands, MyContext, Messages } from "../enums";

export async function onUnsubscribe(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.unsubscribe} triggered`);
    const sender = ctx.from.id;

    let { data, error } = await supabase.from("users").select("*").eq("id", sender);
    if (error) console.log(`Error on from('users').select('*').eq('id', ${sender}): `, error);

    const user = data[0];
    if (user.status == "PAUSED") {
        await ctx.reply("La tua iscrizione è già stata annullata!");
    } else if (user.status === "SUBSCRIBED") {
        const { error } = await supabase.from("users").update({ status: "PAUSED" }).eq("id", sender);
        if (error) {
            console.log(`Error on update: `, error);
            await ctx.reply(Messages.ErrorOnRequest);
        } else {
            await ctx.reply("La tua iscrizione è stata annullata!");
        }
    }
}
