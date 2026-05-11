const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'PulseGym_v1.0.1',
    user: 'postgres',
    password: '123',
  });

  await client.connect();

  // Show current plans
  const res = await client.query('SELECT "PlanId", "PlanName", "InvitationsAllowed" FROM subscription_plans ORDER BY "PlanId"');
  console.log('Current plans:');
  console.table(res.rows);

  // Update all active plans: give each a reasonable invite quota based on name
  await client.query(`
    UPDATE subscription_plans SET "InvitationsAllowed" = CASE
      WHEN "PlanName" ILIKE '%premium%' OR "PlanName" ILIKE '%pro%' OR "PlanName" ILIKE '%vip%' OR "PlanName" ILIKE '%gold%' OR "PlanName" ILIKE '%platinum%' THEN 5
      WHEN "PlanName" ILIKE '%standard%' OR "PlanName" ILIKE '%basic%' OR "PlanName" ILIKE '%silver%' THEN 3
      ELSE 2
    END
    WHERE "InvitationsAllowed" = 0
  `);

  const updated = await client.query('SELECT "PlanId", "PlanName", "InvitationsAllowed" FROM subscription_plans ORDER BY "PlanId"');
  console.log('\nUpdated plans:');
  console.table(updated.rows);

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
