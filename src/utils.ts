import { supabase } from './bot';
import { BdayRow, admins } from './enums';

export function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isAdmin(texter: number) {
    return admins.includes(texter);
}

export async function buildBdaysMsg(owner: number) {
    let { data, error } = await supabase.from('birthdays').select('*').eq('owner', owner);
    if (error) console.log('Error on supabase.from(birthdays).select(): ', error);
    let typedData = data as BdayRow[];

    const rowDate = new Date();
    const day = rowDate.getDate().toString().padStart(2, '0');
    const month = (rowDate.getMonth() + 1).toString().padStart(2, '0');
    const today = `${day}/${month}`;

    let bdays: BdayRow[] = [];
    bdays = typedData.filter((row) => {
        return row.birthday === today;
    });

    let msg = '';
    if (bdays.length === 0) {
        msg = 'Non ci sono compleanni oggi';
    } else if (bdays.length === 1) {
        msg = `Oggi compie gli anni ${bdays[0].name}`;
    } else if (bdays.length > 1) {
        msg = 'Oggi compiono gli anni';
        bdays.forEach((bday, i) => {
            msg += ` ${bday.name}`;
            i < bdays.length ? (msg += ', ') : (msg += '.');
        });
    } else {
        msg = `error, bdays length is ${bdays.length}`;
    }

    return msg;
}
