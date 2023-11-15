import { CommandContext } from 'grammy';
import { supabase } from '../bot';
import { Commands, UserRow, MyContext, UserStatus, Tables, Messages } from '../enums';

export async function onSubscribe(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.subscribe} triggered`);
    const sender = ctx.from.id;

    let { data, error } = await supabase.from('users').select('*').eq('id', sender);
    if (error) console.log(`Error on from('users').select('*').eq('id', ${sender}): `, error);

    const user: UserRow = data[0];
    if (user.status == UserStatus.SUBSCRIBED) {
        await ctx.reply('Sei già iscritto! Il messaggio dovrebbe arrivare ogni giorno alle 7:55');
    } else if (user.status === UserStatus.PAUSED) {
        const { error } = await supabase
            .from(Tables.users)
            .update({ status: UserStatus.SUBSCRIBED })
            .eq('id', sender);
        if (error) {
            console.log(`Error on update: `, error);
            await ctx.reply(Messages.ErrorOnRequest);
        } else {
            await ctx.reply(
                'Sei di nuovo iscritto! Il messaggio dovrebbe arrivare ogni giorno alle 7:55'
            );
        }
    }
}
