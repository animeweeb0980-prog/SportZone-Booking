import fetch from 'node-fetch';

async function run() {
  console.log("1. Registering User...");
  const regRes = await fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test1@example.com', password: 'password123' })
  });
  const regData = await regRes.json();
  console.log("Register:", regData);

  if (!regData.success) {
    if (regData.error === 'Email already registered') {
       const loginRes = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test1@example.com', password: 'password123' })
       });
       const loginData = await loginRes.json();
       regData.token = loginData.token;
    }
  }

  const token = regData.token;

  console.log("\n2. Fetching Courts...");
  const courtsRes = await fetch('http://localhost:3001/api/courts');
  const courts = await courtsRes.json();
  console.log("Courts count:", courts.length);
  const courtId = courts[0]?.id || 1;

  console.log("\n3. Creating Booking...");
  const bookRes = await fetch('http://localhost:3001/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ court_id: courtId, date: '2026-04-10', time_slot: '10:00' })
  });
  console.log("Booking:", await bookRes.text());

  console.log("\n4. Fetching Leaderboard...");
  const leadRes = await fetch('http://localhost:3001/api/leaderboard');
  console.log("Leaderboard:", await leadRes.text());
}
run().catch(console.error);
