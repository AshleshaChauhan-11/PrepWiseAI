import React, { useState, useEffect } from 'react';
import flashcardService from '../services/flashcardService';
import { Layers, Star, ArrowRight, Loader2, BookOpen } from 'lucide-react';

const FlashcardDeckList = ({ onSelectDocument }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const res = await flashcardService.getAllFlashcardSets();
      setDecks(res.data || []);
    } catch (err) {
      console.error('Failed to load flashcard decks:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decks-container">
      <div className="page-header">
        <div>
          <h2>Flashcard Decks</h2>
          <p>Review and master concepts by document set using active recall.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-card">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p>Loading flashcard sets...</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="empty-state-card">
          <Layers size={48} className="empty-icon" />
          <h3>No flashcard decks found</h3>
          <p>Open any document in your library and click "Generate AI Flashcards" to create study decks.</p>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map((deck, idx) => (
            <div
              key={idx}
              className="deck-card"
              onClick={() => onSelectDocument(deck.document?._id)}
            >
              <div className="deck-card-icon">
                <Layers size={24} />
              </div>
              <h3 className="deck-title">{deck.document?.title || 'Study Deck'}</h3>
              <span className="deck-filename">{deck.document?.fileName}</span>

              <div className="deck-stats">
                <span className="deck-total-cards">
                  <strong>{deck.totalCards}</strong> Total Cards
                </span>
                <span className="deck-starred-cards">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <strong>{deck.starredCards}</strong> Starred
                </span>
              </div>

              <button className="deck-study-btn">
                <span>Practice Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardDeckList;
