import { CommandContext, Context } from 'grammy';
import { supabase, bot } from '../bot';
import { Commands, UserRow, Messages, BdayRow } from '../enums';

export async function onAdd(ctx: CommandContext<Context>) {
    console.log(`${Commands.add} triggered`);
    const sender = ctx.from.id;
    const senderName = ctx.from.first_name;

    let { data, error } = await supabase.from('users').select('*');
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);

    const userRows: UserRow[] = data;
    const users = userRows.map((userRow) => userRow.id);
    if (!users.includes(sender)) {
        try {
            await supabase.from('users').insert<UserRow[]>([{ id: sender, name: senderName }]);
        } catch (error) {
            console.log("Error on supabase.from('users').insert: ", error);
            bot.api.sendMessage(sender, Messages.ErrorOnRequest);
        }
    }

    // "/add 05/34 Mario" diventa "05/04 Mario"
    const inputText = ctx.message.text.substring(5);

    const inputDate = inputText.slice(0, 5);
    const inputDay0 = inputText.slice(0, 1);
    const inputDay1 = inputText.slice(1, 2);
    const inputDivider = inputText.slice(2, 3);
    const inputMonth0 = inputText.slice(3, 4);
    const inputMonth1 = inputText.slice(4, 5);
    const inputName = inputText.slice(5).trim();
    if (inputText.length > 36) {
        bot.api.sendMessage(sender, Messages.TextTooLong);
    } else if (
        !['0', '1', '2', '3'].includes(inputDay0) ||
        !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputDay1) ||
        !['0', '1'].includes(inputMonth0) ||
        !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputMonth1) ||
        inputDivider != '/'
    ) {
        bot.api.sendMessage(sender, Messages.WrongAddFormat);
    } else {
        try {
            await supabase
                .from('birthdays')
                .insert<BdayRow[]>([{ name: inputName, birthday: inputDate, owner: sender }]);
            bot.api.sendMessage(sender, `Aggiunto/a ${inputName} con compleanno il ${inputDate}`);
        } catch (error) {
            console.log("Error on supabase.from('birthdays').insert: ", error);
            bot.api.sendMessage(sender, Messages.ErrorOnRequest);
        }
    }
}
