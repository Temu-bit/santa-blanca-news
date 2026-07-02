import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Home from './Home';
import Login from './Login';
import Dashboard from './Dashboard';
import Archive from './Archive';
import mascotImg from './assets/mascot.png';
import './index.css';

function NavBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.role === 'admin');
          setCurrentUser({ name: data.name || user.email });
        }
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Links: Eingeloggt als... */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {currentUser ? (
            <span>👤 Eingeloggt als <strong>{currentUser.name}</strong></span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>Nicht eingeloggt</span>
          )}
        </div>

        {/* Rechts: Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderColor: 'transparent' }}>📰 Startseite</Link>
          {isAdmin && (
            <Link to="/archiv" className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderColor: 'transparent' }}>🗄️ Archiv</Link>
          )}
          {currentUser && (
            <Link to="/dashboard" className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderColor: 'transparent' }}>Dashboard</Link>
          )}
          {currentUser ? (
            <button onClick={handleLogout} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', cursor: 'pointer', background: 'none', color: 'var(--text-dark)', borderColor: 'var(--border-heavy)' }}>
              🚪 Abmelden
            </button>
          ) : (
            <Link to="/login" className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Redaktions-Login</Link>
          )}
        </div>
      </div>

      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1 className="newspaper-title">Santa Blanca News</h1>
      </Link>
      <div className="newspaper-date">
        Ausgabe vom {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="container">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/archiv" element={<Archive />} />
          </Routes>
        </main>
        <img src={mascotImg} alt="Santa Blanca Reporter Mascot" className="mascot" />
      </div>
    </Router>
  );
}

export default App;
