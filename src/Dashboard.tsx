import { useState, useEffect, FormEvent } from 'react';
import { auth, db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TrophySection from './TrophySection';

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [myTrophies, setMyTrophies] = useState<any[]>([]);
  
  // Artikel-Formular
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoleAndData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Eigene Rolle abfragen
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);
        setUserName(userData.name || user.email);
        setMyTrophies(userData.trophies || []);
        
        // Wenn Admin, lade alle Nutzer für die Rechte-Verwaltung
        if (userData.role === 'admin') {
          const snapshot = await getDocs(collection(db, 'users'));
          const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsers(usersList);
        }
      } else {
        setRole('reader'); // Fallback
      }
    };

    fetchRoleAndData();
  }, [navigate]);

  const handleCreateArticle = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'articles'), {
        title,
        excerpt,
        author: userName,
        authorId: auth.currentUser.uid,
        date: new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
        timestamp: Date.now(),
        likes: 0,
        likedBy: []
      });
      setTitle('');
      setExcerpt('');
      alert('Artikel erfolgreich veröffentlicht!');
    } catch (error) {
      console.error(error);
      alert('Fehler beim Speichern des Artikels. Hast du die Firebase-Regeln richtig eingestellt?');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert('Fehler beim Ändern der Rolle.');
    }
  };

  const [myArticles, setMyArticles] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchMyArticles = async () => {
      const q = query(collection(db, 'articles'), orderBy('timestamp', 'desc'));
      const { onSnapshot } = await import('firebase/firestore');
      const unsub = onSnapshot(q, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Artikel-Zähler pro Autor berechnen (alle Artikel, nicht nur letzte 7 Tage)
        const counts: Record<string, number> = {};
        all.forEach((a: any) => {
          if (a.authorId) {
            counts[a.authorId] = (counts[a.authorId] || 0) + 1;
          }
        });
        setArticleCounts(counts);

        // Admins sehen alle, Redakteure nur ihre eigenen
        const filtered = role === 'admin'
          ? all
          : all.filter((a: any) => a.authorId === auth.currentUser?.uid);
        setMyArticles(filtered);
      });
      return unsub;
    };
    fetchMyArticles();
  }, [role]);

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Artikel wirklich löschen? Das kann nicht rückgängig gemacht werden!')) return;
    try {
      await deleteDoc(doc(db, 'articles', articleId));
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen.');
    }
  };

  if (!role) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Lade Redaktions-Daten...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      <h2 className="newspaper-title" style={{ fontSize: '2.5rem' }}>Redaktion</h2>

      {/* TROPHÄEN (Nur für Redakteure & Admin) */}
      {(role === 'admin' || role === 'editor') && (
        <TrophySection role={role} myTrophies={myTrophies} />
      )}

      {/* ZEITUNG SCHREIBEN (Für Admin & Redakteure) */}
      {(role === 'admin' || role === 'editor') ? (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border-heavy)' }}>Neue Schlagzeile verfassen als {userName}</h3>
          <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Überschrift (z.B. Drama am Server!)" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field"
              required
            />
            <textarea 
              placeholder="Der Artikel-Text..." 
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="input-field"
              rows={6}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Artikel in den Druck geben</button>
          </form>

          {/* Eigene Artikel verwalten */}
          {myArticles.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border-heavy)' }}>
                {role === 'admin' ? '🗑️ Alle Artikel verwalten' : '🗑️ Meine Artikel'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {myArticles.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', border: '1px solid var(--border-light)', gap: '1rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{a.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Von {a.author} · {a.date}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteArticle(a.id)}
                      className="btn"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderColor: '#cc0000', color: '#cc0000', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '2rem', background: '#ffebeb', border: '1px solid #cc0000', marginBottom: '3rem' }}>
          <h3>Zutritt verweigert</h3>
          <p>Du bist aktuell nur "Leser". Bitte den Chef-Redakteur um einen Presseausweis, um Artikel schreiben zu dürfen.</p>
        </div>
      )}

      {/* MITARBEITER VERWALTUNG (Nur für Admin) */}
      {role === 'admin' && (
        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border-heavy)' }}>Mitarbeiter-Verwaltung (Chef-Bereich)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.map(u => {
              const count = articleCounts[u.id] || 0;
              const isMe = u.id === auth.currentUser?.uid;
              return (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-light)', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <strong>{u.name || u.email}</strong>
                      {u.name && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({u.email})</span>}
                      {isMe && <span style={{ fontSize: '0.7rem', background: '#1a1a1a', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>Du</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                      <span>Rolle: <strong>{u.role === 'admin' ? '👑 Chef' : u.role === 'editor' ? '✍️ Redakteur' : '📖 Leser'}</strong></span>
                      <span>📝 <strong>{count}</strong> {count === 1 ? 'Artikel' : 'Artikel'} veröffentlicht</span>
                    </div>
                  </div>
                  {!isMe && (
                    <select 
                      value={u.role} 
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                      className="input-field"
                      style={{ width: 'auto', marginBottom: 0, padding: '0.4rem', flexShrink: 0 }}
                    >
                      <option value="reader">Leser</option>
                      <option value="editor">Redakteur</option>
                      <option value="admin">Chef-Redakteur</option>
                    </select>
                  )}
                </div>
              );
            })}
            {users.length === 0 && <p>Keine anderen Nutzer gefunden.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
