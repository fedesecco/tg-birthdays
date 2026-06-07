import { Bot, session } from "grammy";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./schema";
import { MyContext } from "./enums";

dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";
const token = isProduction ? process.env.TELEGRAM_TOKEN : process.env.TELEGRAM_DEV_BOT_TOKEN ?? process.env.TELEGRAM_TOKEN;
if (!token) {
    console.error("No token!");
}

export const bot = new Bot<MyContext>(token);
bot.use(session({ initial: () => ({}) }));

export const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
});

if (supabase.storage) {
    console.log("Login successful.");
} else {
    console.log("Fail on login");
}
