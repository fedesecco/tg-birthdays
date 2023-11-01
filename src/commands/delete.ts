import { CommandContext, Context } from 'grammy';
import { Commands } from '../enums';
import { bot, supabase } from '../bot';

export async function onDelete(ctx: CommandContext<Context>) {
    console.log(`${Commands.delete} triggered`);
    const sender = ctx.from.id;
    const nameToDelete = ctx.message.text.substring(5).trim();

    const { error } = await supabase
        .from('birthdays')
        .delete()
        .eq('owner', sender)
        .eq('name', nameToDelete);
    if (!error) {
        bot.api.sendMessage(sender, `${nameToDelete} rimosso con successo`, { parse_mode: 'HTML' });
    } else {
        console.log(
            `Error on supabase.from('birthdays').delete().eq('owner', ${sender}).eq('name', ${nameToDelete})`,
            error
        );
        bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDelete}"`, {
            parse_mode: 'HTML',
        });
    }
}
