// backend/scripts/seedWelcomeGems.js
//
// One-time backfill: gives 50 welcome gems to every existing user who
// has a sabai_coins row but zero balance AND no welcome-bonus transaction.
//
// Run once:  node backend/scripts/seedWelcomeGems.js
//
// Safe to run multiple times — it is idempotent.

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { getSupabase } = require("../config/supabase");

const WELCOME_AMOUNT = 50;

async function main() {
  const db = getSupabase();
  console.log("🔍 Checking users without welcome bonus...");

  const { data: users, error: usersErr } = await db
    .from("users")
    .select("id, phone_number, name");
  if (usersErr) {
    console.error("Failed to load users:", usersErr.message);
    process.exit(1);
  }

  let awarded = 0;
  let skipped = 0;

  for (const user of users || []) {
    // Check if a welcome-bonus transaction already exists
    const { data: existing } = await db
      .from("coin_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_id", "WELCOME_BONUS")
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    // Ensure wallet row exists
    const { data: wallet } = await db
      .from("sabai_coins")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      await db.from("sabai_coins").insert({
        user_id: user.id,
        balance: WELCOME_AMOUNT,
        lifetime_earned: WELCOME_AMOUNT,
        lifetime_used: 0,
      });
    } else {
      await db
        .from("sabai_coins")
        .update({
          balance: (wallet.balance || 0) + WELCOME_AMOUNT,
          lifetime_earned: (wallet.lifetime_earned || 0) + WELCOME_AMOUNT,
        })
        .eq("user_id", user.id);
    }

    await db.from("coin_transactions").insert({
      user_id: user.id,
      amount: WELCOME_AMOUNT,
      type: "earned",
      source_type: "referral",
      source_id: "WELCOME_BONUS",
      description: "Welcome bonus — 50 SabAI Gems (backfill)",
    });

    awarded++;
    console.log(`  ✅ ${user.phone_number || user.id} — +${WELCOME_AMOUNT} gems`);
  }

  console.log(`\n🎉 Done. Awarded: ${awarded}  |  Skipped (already had): ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});