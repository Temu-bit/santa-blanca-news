import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Bitte einen Anzeigenamen eingeben.');
          return;
        }
        // Neuen Nutzer registrieren
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // In Firestore anlegen
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          name: name.trim(),
          role: 'reader' // Standard: Nur lesen und liken
        });
      } else {
        // Einloggen
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Nach dem Login/Registrieren zurück auf die Hauptseite (Zeitung) schicken
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-headline)' }}>
        {isRegister ? 'Presseausweis beantragen' : 'Redaktions-Login'}
      </h2>
      
      {error && (
        <div style={{ background: '#ffcccc', color: '#cc0000', padding: '0.8rem', marginBottom: '1rem', border: '1px solid #cc0000' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isRegister && (
          <div style={{ textAlign: 'left' }}>
            <input 
              type="text" 
              placeholder="Dein richtiger Name (z.B. Leon)" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', paddingLeft: '0.2rem' }}>
              💡 Tipp: Trag deinen echten Namen ein, damit dich deine Freunde im Artikel wiedererkennen!
            </p>
          </div>
        )}
        <input 
          type="email" 
          placeholder="E-Mail Adresse" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input-field"
          required
        />
        <input 
          type="password" 
          placeholder="Passwort" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-field"
          required
        />
        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          {isRegister ? 'Registrieren' : 'Einloggen'}
        </button>
      </form>

      <button 
        onClick={() => setIsRegister(!isRegister)} 
        className="btn"
        style={{ marginTop: '1.5rem', width: '100%', borderStyle: 'dashed' }}
      >
        {isRegister ? 'Bereits registriert? Hier einloggen.' : 'Neuer Leser? Hier registrieren.'}
      </button>
    </div>
  );
}
