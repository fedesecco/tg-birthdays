import { supabase, bot } from "../bot";
import { Requests } from "../enums";
import { buildBdaysMsg } from "../utils";

export async function onBirthDaysOfTheDay() {
    console.log(`${Requests.bdays} triggered`);
    let { data, error } = await supabase.from("users").select("*").eq("status", "SUBSCRIBED");
    if (error) console.log("Error on supabase.from(users).select(): ", error);

    const chats = data.map((user) => user.id);
    for (const subscriber of chats) {
        const msg = await buildBdaysMsg(subscriber);
        if (msg) {
            await bot.api.sendMessage(subscriber, msg);
        }
    }
    return;
}
