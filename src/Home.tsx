import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    // Nur Artikel der letzten 7 Tage anzeigen
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const q = query(
      collection(db, 'articles'),
      where('timestamp', '>=', sevenDaysAgo),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articlesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArticles(articlesData);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (articleId: string, currentLikes: number, likedBy: string[] = []) => {
    if (!auth.currentUser) {
      alert('Bitte logge dich ein, um Artikel zu liken!');
      return;
    }

    const userId = auth.currentUser.uid;
    const hasLiked = likedBy.includes(userId);
    const articleRef = doc(db, 'articles', articleId);

    try {
      if (hasLiked) {
        await updateDoc(articleRef, {
          likes: currentLikes - 1,
          likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(articleRef, {
          likes: currentLikes + 1,
          likedBy: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error("Fehler beim Liken:", error);
    }
  };

  if (articles.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Noch keine Zeitungsartikel vorhanden. Das SB News-Team arbeitet bestimmt gerade an der nächsten Schlagzeile!</div>;
  }

  return (
    <div>
      {articles.map(article => {
        const hasLiked = auth.currentUser ? (article.likedBy || []).includes(auth.currentUser.uid) : false;
        
        return (
          <article key={article.id} className="article-card">
            <h2 className="article-title">{article.title}</h2>
            <div className="article-meta">
              <span>Von {article.author}</span>
              <span>{article.date}</span>
            </div>
            <p className="article-content">{article.excerpt}</p>
            <button 
              className={`like-btn ${hasLiked ? 'liked' : ''}`}
              onClick={() => handleLike(article.id, article.likes || 0, article.likedBy)}
            >
              {hasLiked ? '🔥' : '👍'} {article.likes || 0} Likes
            </button>
          </article>
        );
      })}
    </div>
  );
}
