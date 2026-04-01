import { useState } from 'react';
import { useAuth } from '../App';
import { request } from '../api';
import { Trophy } from 'lucide-react';

export default function Auth() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const data = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (data.success) {
        login(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginBottom: '16px' }}>
            <Trophy size={32} color="var(--accent-primary)" />
          </div>
          <h2 className="heading-md">{isLogin ? 'Welcome Back' : 'Join SportZone'}</h2>
          <p className="text-muted">Enter your details below to continue.</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" name="name" className="input-field" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>
          )}
          
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" name="email" className="input-field" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" name="password" className="input-field" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength="4" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button className="text-gradient" style={{ fontWeight: '600', marginLeft: '6px' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
