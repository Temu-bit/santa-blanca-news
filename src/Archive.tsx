import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';

export default function Archive() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
        
        // Alle Artikel abfragen (ohne Zeitlimit)
        const q = query(collection(db, 'articles'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const articlesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setArticles(articlesData);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } else {
        navigate('/'); // Kein Admin? Raus hier!
      }
    };

    checkAdminAndFetch();
  }, [navigate]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Lade Geheim-Archiv...</div>;
  }

  if (!isAdmin) return null; // Sicherstellen, dass nichts gerendert wird, falls jemand sich reinschleicht

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      <h2 className="newspaper-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Das Chef-Archiv 🗄️</h2>
      <p style={{ marginBottom: '3rem', color: 'var(--text-muted)' }}>
        Hier siehst du ausnahmslos alle Artikel, die jemals veröffentlicht wurden. Normale Leser haben hier keinen Zutritt.
      </p>

      {articles.map(article => (
        <article key={article.id} className="article-card" style={{ opacity: 0.9 }}>
          <h2 className="article-title">{article.title}</h2>
          <div className="article-meta">
            <span>Von {article.author}</span>
            <span>{article.date}</span>
          </div>
          <p className="article-content">{article.excerpt}</p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            👍 {article.likes || 0} Likes insgesamt
          </div>
        </article>
      ))}
    </div>
  );
}
