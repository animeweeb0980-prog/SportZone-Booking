import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { request } from '../api';
import { useAuth } from '../App';
import { Calendar, MapPin, Search, Users, X, Check, Activity, Clock, Trophy } from 'lucide-react';

const EMOJIS = { tennis: '🎾', pickleball: '🏓', badminton: '🏸', football: '⚽', volleyball: '🏐' };

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaders, setLeaders] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [homeStats, setHomeStats] = useState({ total: 0, topSport: '', upcomingEvents: [] });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'home' || tab === 'bookings') {
        const b = await request('/bookings');
        setBookings(b);
        if (tab === 'home') {
          const ev = await request('/events');
          setHomeStats({
            total: b.length,
            upcomingEvents: ev.slice(0, 3)
          });
        }
      } else if (tab === 'courts') {
        const c = await request('/courts');
        setCourts(c);
      } else if (tab === 'events') {
        const e = await request('/events');
        setEvents(e);
      } else if (tab === 'leaderboard') {
        const l = await request('/leaderboard');
        setLeaders(l);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (date) => {
    if (!selectedCourt || !date) return;
    setBookingDate(date);
    const av = await request(`/availability?court_id=${selectedCourt.id}&date=${date}`);
    setSlots(av);
    setSelectedSlot(null);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !bookingDate) return alert("Select a date and time");
    try {
      await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({ court_id: selectedCourt.id, date: bookingDate, time_slot: selectedSlot })
      });
      alert('Booking Confirmed! Check your email.');
      setModalOpen(false);
      loadData(activeTab);
    } catch (e) {
      alert(e.message);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    await request(`/bookings/${id}`, { method: 'DELETE' });
    loadData('bookings');
  };

  const toggleEventRegistration = async (event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const confirmEventRegistration = async () => {
    if (!selectedEvent) return;
    const isReg = selectedEvent.is_registered === 1;
    try {
      await request(`/events/${selectedEvent.id}/register`, { method: isReg ? 'DELETE' : 'POST', body: JSON.stringify({}) });
      setEventModalOpen(false);
      loadData('events');
    } catch(err) { 
      alert(err.message); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container" style={{ flex: 1, padding: '40px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '100px 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="animate-slide-up">
                <div style={{ marginBottom: '40px' }}>
                  <h1 className="heading-lg">Welcome, <span className="text-gradient">{user.name.split(' ')[0]}</span></h1>
                  <p className="text-muted" style={{ fontSize: '1.1rem' }}>Ready to hit the court today?</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)' }}>
                        <Activity color="var(--accent-primary)" size={24} />
                      </div>
                      <div>
                        <h3 className="heading-md" style={{ marginBottom: '0' }}>{homeStats.total}</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Sessions</p>
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setActiveTab('bookings')}>View History</button>
                  </div>
                  
                  <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                      <Calendar size={20} color="var(--accent-secondary)" /> Upcoming Events
                    </h3>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {homeStats.upcomingEvents.length === 0 ? <p className="text-muted">No upcoming events.</p> : 
                        homeStats.upcomingEvents.map(e => (
                          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{EMOJIS[e.sport]} {e.title}</div>
                              <div className="text-muted" style={{ fontSize: '0.85rem' }}>{e.event_date} · {e.location}</div>
                            </div>
                            <span className="status-badge" style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }}>{e.registered_count} Registered</span>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COURTS TAB */}
            {activeTab === 'courts' && (
               <div className="animate-slide-up">
                 <h2 className="heading-md">Available Facilities</h2>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '30px' }}>
                   {courts.map(c => (
                     <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                         <span style={{ fontSize: '2rem' }}>{EMOJIS[c.sport]}</span>
                         <span className="status-badge" style={{ background: 'var(--gradient-glow)', color: 'white', border: 'none' }}>${c.price_per_hour}/hr</span>
                       </div>
                       <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{c.name}</h3>
                       <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <MapPin size={16} /> {c.location}
                       </p>
                       <p style={{ fontSize: '0.95rem', marginBottom: '24px', flex: 1 }}>{c.description}</p>
                       <button className="btn btn-primary" onClick={() => { setSelectedCourt(c); setModalOpen(true); setBookingDate(''); setSlots([]); }}>Book Court</button>
                     </div>
                   ))}
                 </div>
               </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
               <div className="animate-slide-up">
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                   <h2 className="heading-md">My Bookings</h2>
                   <button className="btn btn-primary" onClick={() => setActiveTab('courts')}>New Booking</button>
                 </div>
                 
                 {bookings.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                     <p className="text-muted">You have no bookings yet.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     {bookings.map(b => (
                       <div key={b.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                           <div style={{ fontSize: '2.5rem', background: 'var(--bg-tertiary)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                             {EMOJIS[b.sport]}
                           </div>
                           <div>
                             <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{b.court_name}</h3>
                             <div className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', gap: '12px' }}>
                               <span><Calendar size={14} style={{display:'inline', verticalAlign:'sub'}}/> {b.date}</span>
                               <span><Clock size={14} style={{display:'inline', verticalAlign:'sub'}}/> {b.time_slot}</span>
                             </div>
                           </div>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                           <span className={`status-badge status-${b.status}`}>{b.status}</span>
                           {b.status === 'confirmed' && (
                             <button style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => cancelBooking(b.id)}>Cancel</button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
               <div className="animate-slide-up">
                 <h2 className="heading-md">Upcoming Events</h2>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '30px' }}>
                    {events.length === 0 ? <p className="text-muted">No events currently scheduled.</p> : events.map(e => (
                      <div key={e.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '2rem' }}>{EMOJIS[e.sport]}</span>
                          <span className="status-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none' }}>{e.registered_count} / {e.max_participants} Registered</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{e.title}</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} /> {e.event_date} at {e.event_time}
                        </p>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} /> {e.location}
                        </p>
                        <p style={{ fontSize: '0.95rem', marginBottom: '24px', flex: 1 }}>{e.description}</p>
                        <button 
                          className={`btn ${e.is_registered ? 'btn-secondary' : 'btn-primary'}`}
                          disabled={!e.is_registered && e.registered_count >= e.max_participants}
                          onClick={() => toggleEventRegistration(e)}
                        >
                          {e.is_registered ? 'Registered ✅' : e.registered_count >= e.max_participants ? 'Event Full' : 'Register Now'}
                        </button>
                        {e.is_registered === 1 && (
                          <div style={{ textAlign: 'center', marginTop: '12px' }}>
                            <button 
                              style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => toggleEventRegistration(e)}
                            >
                              Cancel Registration
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
               <div className="animate-slide-up glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                 <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 className="heading-md" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy color="#fbbf24" /> Top Athletes</h2>
                 </div>
                 {leaders.length === 0 ? <p style={{ padding: '24px' }}>No sessions recorded yet.</p> : (
                   <div>
                     {leaders.map((l, i) => (
                       <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '40px', color: i < 3 ? '#fbbf24' : 'var(--text-secondary)' }}>
                           {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                         </span>
                         <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {(l.user_name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{l.user_name || 'Anonymous'}</div>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{l.user_email || 'Unknown Email'}</div>
                            </div>
                         </div>
                         <div style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                           {l.total_sessions} <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Sessions</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}
          </>
        )}
      </main>

      {/* Booking Modal */}
      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setModalOpen(false)}><X size={24} /></button>
          
          {selectedCourt && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem' }}>{EMOJIS[selectedCourt.sport]}</span>
                <div>
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedCourt.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>{selectedCourt.location}</p>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Select Date</label>
                <input type="date" className="input-field" value={bookingDate} onChange={(e) => loadSlots(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>

              {bookingDate && (
                <div style={{ marginTop: '20px' }}>
                  <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Available Slots</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {slots.map((s, i) => (
                      <button 
                        key={i}
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.time)}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          border: `1px solid ${selectedSlot === s.time ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          background: selectedSlot === s.time ? 'var(--gradient-glow)' : s.available ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)',
                          color: s.available ? 'white' : 'var(--text-secondary)',
                          cursor: s.available ? 'pointer' : 'not-allowed',
                          opacity: s.available ? 1 : 0.5,
                          transition: 'var(--transition)'
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '30px', opacity: selectedSlot ? 1 : 0.5, pointerEvents: selectedSlot ? 'auto' : 'none' }}
                onClick={confirmBooking}
              >
                Confirm Booking
              </button>
            </>
          )}
        </div>
      </div>

      {/* Event Registration Modal */}
      <div className={`modal-overlay ${eventModalOpen ? 'open' : ''}`}>
        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <button className="modal-close" onClick={() => setEventModalOpen(false)}><X size={24} /></button>
          
          {selectedEvent && (
            <div className="animate-slide-up">
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>{EMOJIS[selectedEvent.sport]}</span>
                <h3 className="heading-md" style={{ marginBottom: '8px' }}>{selectedEvent.title}</h3>
                <p className="text-muted">{selectedEvent.is_registered ? 'Already registered for this event.' : 'Join the game! Confirm your registration below.'}</p>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                  <Calendar size={16} color="var(--accent-primary)" />
                  <span>{selectedEvent.event_date} at {selectedEvent.event_time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <MapPin size={16} color="var(--accent-primary)" />
                  <span>{selectedEvent.location}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className={`btn ${selectedEvent.is_registered ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', padding: '14px' }}
                  onClick={confirmEventRegistration}
                >
                  {selectedEvent.is_registered ? 'Cancel Registration' : 'Confirm Registration'}
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', background: 'transparent' }} onClick={() => setEventModalOpen(false)}>Maybe Later</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
