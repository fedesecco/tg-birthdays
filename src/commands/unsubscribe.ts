import { CommandContext } from 'grammy';
import { supabase } from '../bot';
import { Commands, UserRow, MyContext, UserStatus, Tables } from '../enums';

export async function onUnsubscribe(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.unsubscribe} triggered`);
    const sender = ctx.from.id;

    let { data, error } = await supabase.from('users').select('*').eq('id', sender);
    if (error) console.log(`Error on from('users').select('*').eq('id', ${sender}): `, error);

    const user: UserRow = data[0];
    if (user.status == UserStatus.PAUSED) {
        await ctx.reply('La tua iscrizione è già stata annullata!');
    } else if (user.status === UserStatus.SUBSCRIBED) {
        const { error } = await supabase
            .from(Tables.users)
            .update({ status: UserStatus.PAUSED })
            .eq('id', sender);
        if (error) console.log(`Error on update: `, error);
        await ctx.reply('La tua iscrizione è stata annullata!');
    }
}
