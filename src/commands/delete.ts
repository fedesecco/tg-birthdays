import { CommandContext, Context } from 'grammy';
import { Commands, Messages } from '../enums';
import { bot, supabase } from '../bot';

export async function onDelete(ctx: CommandContext<Context>) {
    console.log(`${Commands.delete} triggered`);
    const sender = ctx.from.id;
    const nameToDel = ctx.message.text.substring(8).trim();

    const { count, error } = await supabase
        .from('birthdays')
        .delete()
        .eq('owner', sender)
        .eq('name', nameToDel);

    if (error) {
        console.log(
            `Error on supabase.from('birthdays').delete().eq('owner', ${sender}).eq('name', ${nameToDel})`,
            error
        );
        bot.api.sendMessage(sender, Messages.ErrorOnRequest);
    } else if (count === 0) {
        bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDel}"`);
    } else if (count > 0) {
        bot.api.sendMessage(sender, `Compleanno di "${nameToDel}" rimosso con successo`);
    } else {
        console.log(`Unexpected count value on delete: ${count}`);
    }
}
