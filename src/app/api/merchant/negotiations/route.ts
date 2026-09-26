import { handle } from "@/lib/negotiation/http";
import { liveFeed } from "@/lib/negotiation/merchant";
import { storageStatus } from "@/lib/negotiation/sessions";

export const dynamic = "force-dynamic";

/** Recent agent negotiations with transcripts, for the live dashboard */
export async function GET() {
  return handle(async () => {
    const negotiations = await liveFeed();
    const { mode, error } = storageStatus();
    // "supabase" means changes arrive over Realtime; "memory" means poll
    return { storage: mode, storageError: error, negotiations };
  });
}
