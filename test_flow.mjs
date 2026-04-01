
async function run() {
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test1@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log("\\n1. Fetching Events...");
  const eventsRes = await fetch('http://localhost:3001/api/events');
  const events = await eventsRes.json();
  console.log("Events count:", events.length);
  const eventId = events[0]?.id || 1;

  console.log("\\n2. Registering for Event...");
  const regRes = await fetch(`http://localhost:3001/api/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({})
  });
  console.log("Event Registration:", await regRes.text());
}
run().catch(console.error);
