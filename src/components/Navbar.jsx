import { useAuth } from '../App';
import { LogOut, Trophy } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'courts', label: 'Courts' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'events', label: 'Events' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="glass" style={{
      position: 'sticky', top: 0, zIndex: 50, padding: '16px 24px', 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)', borderLeft: 'none', borderRight: 'none', borderTop: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setActiveTab('home')}>
        <Trophy color="var(--accent-primary)" size={24} />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          Sport<span style={{ color: 'var(--accent-primary)' }}>Zone</span>
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
              background: activeTab === item.id ? 'var(--gradient-glow)' : 'transparent',
              transition: 'var(--transition)'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'none' }} className="user-name">
            {user.name.split(' ')[0]}
          </span>
        </div>
        
        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}
