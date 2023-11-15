import { CommandContext, Context } from 'grammy';
import { Commands, Messages } from '../enums';
import { bot, supabase } from '../bot';

export async function onDelete(ctx: CommandContext<Context>) {
    console.log(`${Commands.delete} triggered`);
    const sender = ctx.from.id;
    const nameToDel = ctx.message.text.substring(8).trim();

    const { count, error } = await supabase
        .from('birthdays')
        .delete({ count: 'exact' })
        .eq('owner', sender)
        .eq('name', nameToDel);

    if (error) {
        console.log(
            `Error on supabase.from('birthdays').delete().eq('owner', ${sender}).eq('name', ${nameToDel})`,
            error
        );
        await bot.api.sendMessage(sender, Messages.ErrorOnRequest);
    } else if (count && count > 0) {
        await bot.api.sendMessage(sender, `Compleanno di "${nameToDel}" rimosso con successo`);
    } else {
        console.log(`Count: ${count}`);
        await bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDel}"`);
    }
}
