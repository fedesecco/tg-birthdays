import { GrammyError } from "grammy";
import { supabase } from "./bot";

function isDeliveryFailureToPause(error: unknown) {
    if (!(error instanceof GrammyError)) {
        return false;
    }

    const description = error.description.toLowerCase();
    return (
        description.includes("bot was blocked by the user") ||
        description.includes("user is deactivated") ||
        description.includes("chat not found") ||
        description.includes("bot was kicked") ||
        description.includes("have no rights to send a message")
    );
}

export async function pauseUserOnUndeliverableMessage(userId: number, error: unknown) {
    if (!isDeliveryFailureToPause(error)) {
        throw error;
    }

    console.log(`Pausing user ${userId} after Telegram delivery failure`, error);
    const { error: updateError } = await supabase
        .from("users")
        .update({ status: "PAUSED" })
        .eq("id", userId);

    if (updateError) {
        console.log(`Error while pausing user ${userId}: `, updateError);
    }
}
