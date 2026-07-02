import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

interface Trophy {
  month: string;
  rank: 'gold' | 'silver' | 'bronze';
  articleTitle: string;
  likes: number;
  awardedAt: number;
}

interface TrophySectionProps {
  role: string;
  myTrophies: Trophy[];
}

const rankConfig = {
  gold:   { emoji: '🥇', label: 'Gold',   color: '#B8860B', bg: '#fffbeb' },
  silver: { emoji: '🥈', label: 'Silber', color: '#808080', bg: '#f5f5f5' },
  bronze: { emoji: '🥉', label: 'Bronze', color: '#8B4513', bg: '#fdf6f0' },
};

export default function TrophySection({ role, myTrophies }: TrophySectionProps) {
  const [monthlyArticles, setMonthlyArticles] = useState<any[]>([]);
  const [awarding, setAwarding] = useState(false);

  const currentMonth = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('likes', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const articles = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((a: any) => a.timestamp >= startOfMonth);
      setMonthlyArticles(articles);
    });
    return () => unsub();
  }, []);

  const handleAward = async (rank: 'gold' | 'silver' | 'bronze', article: any) => {
    if (!article.authorId) {
      alert('Dieser Artikel hat keine Autor-ID. Er wurde möglicherweise vor dem Update erstellt.');
      return;
    }
    const rc = rankConfig[rank];
    if (!confirm(`${rc.emoji} ${rc.label}-Trophäe für "${article.title}" an ${article.author} vergeben?`)) return;

    setAwarding(true);
    try {
      const trophy: Trophy = {
        month: currentMonth,
        rank,
        articleTitle: article.title,
        likes: article.likes || 0,
        awardedAt: Date.now()
      };
      await updateDoc(doc(db, 'users', article.authorId), {
        trophies: arrayUnion(trophy)
      });
      alert(`${rc.emoji} Trophäe erfolgreich an ${article.author} vergeben!`);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Vergeben der Trophäe.');
    }
    setAwarding(false);
  };

  // Trophäen nach Rang gruppieren für die Anzeige
  const goldCount   = myTrophies.filter(t => t.rank === 'gold').length;
  const silverCount = myTrophies.filter(t => t.rank === 'silver').length;
  const bronzeCount = myTrophies.filter(t => t.rank === 'bronze').length;

  return (
    <div style={{ marginBottom: '4rem' }}>

      {/* ── MEINE TROPHÄEN ── */}
      <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--border-heavy)' }}>
        🏆 Meine Trophäen-Sammlung
      </h3>

      {/* Kurzübersicht */}
      {myTrophies.length > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[['gold', goldCount], ['silver', silverCount], ['bronze', bronzeCount]].map(([rank, count]) => {
            const rc = rankConfig[rank as keyof typeof rankConfig];
            return count > 0 ? (
              <div key={rank as string} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.1rem' }}>
                <span>{rc.emoji}</span>
                <strong style={{ color: rc.color }}>×{count}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rc.label}</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {myTrophies.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
          Noch keine Trophäen. Schreib gute Artikel und hol dir Gold! 💪
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {[...myTrophies].reverse().map((t, i) => {
            const rc = rankConfig[t.rank];
            return (
              <div key={i} style={{
                border: `2px solid ${rc.color}`,
                background: rc.bg,
                padding: '1rem',
                textAlign: 'center',
                minWidth: '130px',
                maxWidth: '160px',
              }}>
                <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>{rc.emoji}</div>
                <div style={{ fontWeight: 'bold', color: rc.color, marginTop: '0.3rem' }}>{rc.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t.month}</div>
                <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', fontStyle: 'italic' }}>„{t.articleTitle}"</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>👍 {t.likes} Likes</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADMIN: TROPHÄEN VERGEBEN ── */}
      {role === 'admin' && (
        <>
          <h3 style={{ marginBottom: '0.5rem', borderBottom: '2px solid var(--border-heavy)', marginTop: '3rem' }}>
            🎖️ Champion des Monats vergeben — {currentMonth}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
            Die Top-3 Artikel dieses Monats nach Likes. Klick auf "Vergeben" um die Trophäe direkt in die Sammlung des Redakteurs zu schreiben.
          </p>

          {monthlyArticles.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Noch keine Artikel diesen Monat.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {monthlyArticles.slice(0, 3).map((article, index) => {
                const rank = (['gold', 'silver', 'bronze'] as const)[index];
                const rc = rankConfig[rank];
                return (
                  <div key={article.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    border: `2px solid ${rc.color}`,
                    background: rc.bg,
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                      <span style={{ fontSize: '2rem' }}>{rc.emoji}</span>
                      <div>
                        <strong>{article.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Von {article.author} · 👍 {article.likes || 0} Likes
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAward(rank, article)}
                      disabled={awarding}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', flexShrink: 0 }}
                    >
                      {rc.emoji} Vergeben
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
