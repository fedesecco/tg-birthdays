import { CommandContext } from 'grammy';
import { Commands, Convs, Messages, MyContext, MyConversation } from '../enums';
import { bot, supabase } from '../bot';
import { getNamesTable } from '../utils';

export async function onDelete(ctx: CommandContext<MyContext>) {
    console.log(`${Commands.delete} triggered`);
    await ctx.conversation.enter(Convs.deleteConversation);
}

export async function deleteConversation(conversation: MyConversation, ctx: MyContext) {
    const sender = ctx.from.id;
    const namesToChooseFromKeyboard = await getNamesTable(sender);
    await ctx.reply('Chi vuoi dimenticare?', {
        reply_markup: {
            keyboard: namesToChooseFromKeyboard,
            one_time_keyboard: true,
        },
    });
    const nameToDel = (await conversation.waitFor(':text')).message.text;

    let { count, error } = await supabase
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
        await bot.api.sendMessage(sender, `"${nameToDel}" rimosso con successo`);
    } else {
        console.log(`Count: ${count}`);
        await bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDel}"`);
    }
}
