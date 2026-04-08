const generateGoogleCalendarUrl = (title, location, dateStr, timeStr, durationMinutes = 60) => {
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = timeStr.split(':');
  
  // Format: YYYYMMDDTHHMMSS
  const start = `${year}${month}${day}T${hour}${minute}00`;
  
  // Calculate end time
  const d = new Date(year, month - 1, day, hour, minute);
  d.setMinutes(d.getMinutes() + durationMinutes);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const end = `${y}${m}${dd}T${hh}${mm}00`;

  // Use URLSearchParams to handle encoding
  const params = new URLSearchParams();
  params.append('action', 'TEMPLATE');
  params.append('text', title);
  params.append('dates', `${start}/${end}`);
  params.append('details', 'Reserved via SportZone Court Booking System.');
  params.append('location', location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

console.log("Booking Test:");
console.log(generateGoogleCalendarUrl("Booking: Tennis Court A", "Sports Complex", "2026-04-15", "09:00"));

console.log("\nEvent Test (2 hours):");
console.log(generateGoogleCalendarUrl("Event: Summer Tournament", "Sports Complex", "2026-05-10", "14:30", 120));
