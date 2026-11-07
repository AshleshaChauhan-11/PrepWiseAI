import React, { useState, useEffect } from 'react';
import documentService from '../services/documentService';
import flashcardService from '../services/flashcardService';
import quizService from '../services/quizService';
import aiService from '../services/aiService';
import { 
  ArrowLeft, 
  Layers, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Star, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  HelpCircle, 
  AlertCircle,
  Loader2,
  Award,
  Check,
  X
} from 'lucide-react';

const StudyWorkspace = ({ documentId, onBack }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards', 'quiz', 'chat', 'summary'
  const [error, setError] = useState('');

  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);

  // Quizzes state
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Summary state
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [conceptQuery, setConceptQuery] = useState('');
  const [conceptExplanation, setConceptExplanation] = useState('');
  const [explainingConcept, setExplainingConcept] = useState(false);

  useEffect(() => {
    loadDocumentData();
  }, [documentId]);

  const loadDocumentData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await documentService.getDocumentById(documentId);
      const docData = res.data;
      setDocument(docData);

      // Load flashcards
      try {
        const fcRes = await flashcardService.getFlashcardsForDocument(documentId);
        // Backend returns flashcard sets containing an array of cards
        const allCards = [];
        (fcRes.data || []).forEach((set) => {
          if (Array.isArray(set.cards)) {
            set.cards.forEach((c) => allCards.push({ ...c, setId: set._id }));
          } else if (set.question && set.answer) {
            allCards.push(set);
          }
        });
        setFlashcards(allCards);
      } catch (err) {
        console.error('Error loading flashcards:', err);
      }

      // Load quizzes
      try {
        const qzRes = await quizService.getQuizzesForDocument(documentId);
        setQuizzes(qzRes.data || []);
      } catch (err) {
        console.error('Error loading quizzes:', err);
      }

      // Load chat history
      try {
        const chatRes = await aiService.getChatHistory(documentId);
        if (chatRes && chatRes.chatHistory) {
          const formatted = [];
          chatRes.chatHistory.reverse().forEach((item) => {
            if (item.messages && Array.isArray(item.messages)) {
              item.messages.forEach((m) => formatted.push(m));
            } else if (item.userMessage && item.aiResponse) {
              formatted.push({ role: 'user', content: item.userMessage });
              formatted.push({ role: 'assistant', content: item.aiResponse });
            }
          });
          setMessages(formatted);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
      setError(err.error || err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // --- Flashcard Actions ---
  const handleGenerateFlashcards = async () => {
    setGeneratingCards(true);
    try {
      const res = await aiService.generateFlashcards(documentId, { count: 10 });
      // Reload flashcards
      const fcRes = await flashcardService.getFlashcardsForDocument(documentId);
      const allCards = [];
      (fcRes.data || []).forEach((set) => {
        if (Array.isArray(set.cards)) {
          set.cards.forEach((c) => allCards.push({ ...c, setId: set._id }));
        } else if (set.question && set.answer) {
          allCards.push(set);
        }
      });
      setFlashcards(allCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err) {
      alert(err.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleToggleStar = async (card) => {
    try {
      await flashcardService.toggleStar(card._id);
      setFlashcards((prev) =>
        prev.map((c) => (c._id === card._id ? { ...c, isStarred: !c.isStarred } : c))
      );
    } catch (err) {
      console.error('Failed to star card:', err);
    }
  };

  const handleReviewCard = async (card) => {
    try {
      await flashcardService.reviewFlashcard(card._id);
      setFlashcards((prev) =>
        prev.map((c) =>
          c._id === card._id
            ? { ...c, reviewCount: (c.reviewCount || 0) + 1, lastReviewed: new Date() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to review card:', err);
    }
  };

  // --- Quiz Actions ---
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await aiService.generateQuiz(documentId, { count: 5 });
      const newQuiz = res.quiz;
      setQuizzes((prev) => [newQuiz, ...prev]);
      setActiveQuiz(newQuiz);
      setUserAnswers({});
      setQuizResult(null);
    } catch (err) {
      alert(err.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectOption = (questionIndex, option) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < activeQuiz.questions.length) {
      if (!window.confirm(`You answered ${answeredCount} of ${activeQuiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      const answersPayload = activeQuiz.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedAnswer: userAnswers[idx] || '',
      }));

      const res = await quizService.submitQuiz(activeQuiz._id, answersPayload);
      const resultsRes = await quizService.getQuizResults(activeQuiz._id);
      setQuizResult(resultsRes.data);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // --- Chat Actions ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendingChat) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setSendingChat(true);

    try {
      const res = await aiService.chat(documentId, userText);
      const reply = res.response || res.message || 'No reply generated.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error while analyzing this document.' },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  // --- Summary Actions ---
  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await aiService.generateSummary(documentId);
      setSummary(res.summary || res);
    } catch (err) {
      alert(err.message || 'Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExplainConcept = async (e) => {
    e.preventDefault();
    if (!conceptQuery.trim() || explainingConcept) return;

    setExplainingConcept(true);
    try {
      const res = await aiService.explainConcept(documentId, conceptQuery.trim());
      setConceptExplanation(res.explanation || res);
    } catch (err) {
      alert(err.message || 'Failed to explain concept');
    } finally {
      setExplainingConcept(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading">
        <Loader2 size={40} className="animate-spin text-accent" />
        <p>Loading document and study resources...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="workspace-error">
        <AlertCircle size={40} className="text-danger" />
        <h3>Failed to load document</h3>
        <p>{error || 'Document not found.'}</p>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Documents
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="workspace-container">
      {/* Workspace Top Bar */}
      <div className="workspace-nav">
        <button className="back-link-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back to Library</span>
        </button>

        <div className="workspace-doc-meta">
          <h2 title={document.title}>{document.title}</h2>
          <span className="doc-meta-badge">{document.fileName}</span>
        </div>

        <div className="workspace-tabs">
          <button
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            <Layers size={16} />
            <span>Flashcards ({flashcards.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <CheckCircle size={16} />
            <span>Quizzes ({quizzes.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            <span>AI Study Chat</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('summary');
              if (!summary) handleGenerateSummary();
            }}
          >
            <FileText size={16} />
            <span>Summary</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="workspace-content">
        {/* TAB 1: FLASHCARDS */}
        {activeTab === 'flashcards' && (
          <div className="flashcards-view">
            <div className="view-toolbar">
              <div className="toolbar-info">
                <h3>Active Recall Flashcards</h3>
                <p>Click on the card to flip and check your answer.</p>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateFlashcards}
                disabled={generatingCards}
              >
                {generatingCards ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate AI Flashcards</span>
                  </>
                )}
              </button>
            </div>

            {flashcards.length === 0 ? (
              <div className="empty-tab-panel">
                <Layers size={48} className="empty-icon" />
                <h3>No flashcards generated yet</h3>
                <p>Let AI automatically extract key definitions, formulas, and concepts from this document.</p>
                <button
                  className="btn-primary"
                  onClick={handleGenerateFlashcards}
                  disabled={generatingCards}
                >
                  <Sparkles size={16} />
                  <span>Generate First 10 Flashcards</span>
                </button>
              </div>
            ) : (
              <div className="flashcard-study-arena">
                <div className="arena-controls-top">
                  <span className="card-counter">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <div className="card-top-actions">
                    <button
                      className={`btn-icon-star ${currentCard?.isStarred ? 'starred' : ''}`}
                      onClick={() => handleToggleStar(currentCard)}
                      title="Star for revision"
                    >
                      <Star size={18} fill={currentCard?.isStarred ? '#f59e0b' : 'none'} />
                    </button>
                    <button
                      className="btn-small-secondary"
                      onClick={() => handleReviewCard(currentCard)}
                    >
                      Mark Reviewed ({currentCard?.reviewCount || 0})
                    </button>
                  </div>
                </div>

                {/* 3D Flip Card */}
                <div
                  className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner">
                    {/* Front: Question */}
                    <div className="flashcard-face flashcard-front">
                      <span className="face-label">Question</span>
                      <p className="card-text">{currentCard?.question}</p>
                      <span className="flip-hint">
                        <RotateCw size={14} /> Click to reveal answer
                      </span>
                    </div>

                    {/* Back: Answer */}
                    <div className="flashcard-face flashcard-back">
                      <span className="face-label face-label-answer">Answer</span>
                      <p className="card-text">{currentCard?.answer}</p>
                      <span className="flip-hint">
                        <RotateCw size={14} /> Click to return to question
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="card-nav-controls">
                  <button
                    className="btn-nav"
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIndex((i) => i - 1);
                    }}
                  >
                    <ChevronLeft size={20} />
                    <span>Previous</span>
                  </button>

                  <div className="card-dots">
                    {flashcards.slice(0, 15).map((_, i) => (
                      <span
                        key={i}
                        className={`dot ${i === currentCardIndex ? 'active' : ''}`}
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex(i);
                        }}
                      />
                    ))}
                  </div>

                  <button
                    className="btn-nav"
                    disabled={currentCardIndex === flashcards.length - 1}
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIndex((i) => i + 1);
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZZES */}
        {activeTab === 'quiz' && (
          <div className="quiz-view">
            <div className="view-toolbar">
              <div className="toolbar-info">
                <h3>Interactive Practice Quizzes</h3>
                <p>Test your knowledge with 4-option multiple choice questions.</p>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
              >
                {generatingQuiz ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate New Quiz</span>
                  </>
                )}
              </button>
            </div>

            {quizzes.length === 0 && !activeQuiz ? (
              <div className="empty-tab-panel">
                <CheckCircle size={48} className="empty-icon" />
                <h3>No quizzes generated yet</h3>
                <p>Generate a quiz based on this document to test your exam readiness.</p>
                <button
                  className="btn-primary"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                >
                  <Sparkles size={16} />
                  <span>Generate 5-Question Quiz</span>
                </button>
              </div>
            ) : !activeQuiz ? (
              <div className="quiz-list-grid">
                {quizzes.map((q) => (
                  <div key={q._id} className="quiz-card-item">
                    <h4>{q.title}</h4>
                    <span className="quiz-meta-info">
                      {q.questions?.length || q.totalQuestions} Questions •{' '}
                      {q.completedAt ? `Score: ${q.score}%` : 'Not completed yet'}
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setActiveQuiz(q);
                        setUserAnswers({});
                        setQuizResult(null);
                      }}
                    >
                      {q.completedAt ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                ))}
              </div>
            ) : quizResult ? (
              /* Quiz Results Banner */
              <div className="quiz-results-container">
                <div className="results-hero">
                  <div className="score-circle">
                    <span className="score-num">{quizResult.quiz?.score ?? 0}%</span>
                    <span className="score-sub">Final Score</span>
                  </div>
                  <h3>
                    {quizResult.quiz?.score >= 80
                      ? 'Outstanding Mastery! 🌟'
                      : quizResult.quiz?.score >= 60
                      ? 'Good job! A bit more revision will make it perfect! 📚'
                      : 'Keep practicing! Review the explanations below. 💪'}
                  </h3>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizResult(null);
                    }}
                  >
                    Back to All Quizzes
                  </button>
                </div>

                <div className="results-breakdown">
                  {quizResult.results?.map((res, index) => (
                    <div
                      key={index}
                      className={`result-question-card ${res.isCorrect ? 'correct' : 'incorrect'}`}
                    >
                      <div className="question-header">
                        <span className="q-index">Question {index + 1}</span>
                        <span className="result-indicator">
                          {res.isCorrect ? (
                            <span className="text-success">
                              <Check size={16} /> Correct
                            </span>
                          ) : (
                            <span className="text-danger">
                              <X size={16} /> Incorrect
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="q-title">{res.question}</p>

                      <div className="options-review">
                        {res.options?.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`review-option ${
                              opt === res.correctAnswer
                                ? 'option-correct'
                                : opt === res.selectedAnswer
                                ? 'option-wrong'
                                : ''
                            }`}
                          >
                            <span>{opt}</span>
                            {opt === res.correctAnswer && (
                              <span className="badge-tag">Correct Answer</span>
                            )}
                            {opt === res.selectedAnswer && !res.isCorrect && (
                              <span className="badge-tag tag-wrong">Your Answer</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {res.explanation && (
                        <div className="explanation-box">
                          <strong>Explanation:</strong> {res.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Quiz Taking Arena */
              <div className="quiz-arena">
                <div className="quiz-arena-header">
                  <h4>{activeQuiz.title}</h4>
                  <button
                    className="btn-link"
                    onClick={() => setActiveQuiz(null)}
                  >
                    Cancel Quiz
                  </button>
                </div>

                <div className="quiz-questions-list">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={idx} className="quiz-question-box">
                      <div className="q-number">Question {idx + 1} of {activeQuiz.questions.length}</div>
                      <p className="q-text">{q.question}</p>

                      <div className="options-grid">
                        {q.options.map((option, optIdx) => (
                          <label
                            key={optIdx}
                            className={`option-label ${userAnswers[idx] === option ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${idx}`}
                              checked={userAnswers[idx] === option}
                              onChange={() => handleSelectOption(idx, option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="quiz-submit-footer">
                  <button
                    className="btn-primary btn-large"
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Evaluating Answers...</span>
                      </>
                    ) : (
                      'Submit Quiz & View Results'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI STUDY CHAT */}
        {activeTab === 'chat' && (
          <div className="chat-view">
            <div className="chat-thread">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="tutor-avatar">
                    <Sparkles size={28} />
                  </div>
                  <h3>Your AI Study Assistant</h3>
                  <p>Ask anything about this document. The AI retrieves relevant chunks and explains concepts clearly.</p>

                  <div className="prompt-chips">
                    <button
                      className="chip"
                      onClick={() =>
                        setInputMessage('What are the 3 most critical points to memorize from this document?')
                      }
                    >
                      💡 3 most critical points
                    </button>
                    <button
                      className="chip"
                      onClick={() =>
                        setInputMessage('Give me a high-yield summary of key terms and formulas.')
                      }
                    >
                      📖 Key terms & definitions
                    </button>
                    <button
                      className="chip"
                      onClick={() =>
                        setInputMessage('What are likely exam questions based on this text?')
                      }
                    >
                      🎯 Potential exam questions
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div className="message-bubble">
                      <span className="message-role">
                        {msg.role === 'user' ? 'You' : 'PrepWise AI'}
                      </span>
                      <p className="message-content">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {sendingChat && (
                <div className="chat-message assistant">
                  <div className="message-bubble typing-bubble">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing document chunks...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="text"
                placeholder="Ask a question about this document..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={sendingChat}
              />
              <button
                type="submit"
                className="btn-send"
                disabled={!inputMessage.trim() || sendingChat}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SUMMARY & CONCEPT EXPLAINER */}
        {activeTab === 'summary' && (
          <div className="summary-view">
            <div className="summary-card">
              <div className="summary-card-header">
                <h3>Executive Document Summary</h3>
                <button
                  className="btn-secondary btn-small"
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                >
                  <RotateCw size={14} className={loadingSummary ? 'animate-spin' : ''} />
                  <span>Regenerate</span>
                </button>
              </div>

              {loadingSummary ? (
                <div className="loading-state-card">
                  <Loader2 size={28} className="animate-spin text-accent" />
                  <p>Synthesizing concise 150-word document summary...</p>
                </div>
              ) : (
                <div className="summary-body">
                  <p className="summary-text">{summary || 'No summary generated yet.'}</p>
                </div>
              )}
            </div>

            {/* Deep-Dive Concept Explainer */}
            <div className="concept-explainer-card">
              <h3>🔍 Deep-Dive Concept Explainer</h3>
              <p>Type any difficult keyword, formula, or concept from your notes for a detailed breakdown with examples.</p>

              <form onSubmit={handleExplainConcept} className="concept-form">
                <input
                  type="text"
                  placeholder="e.g., Paging vs Segmentation, Virtual Memory, Concurrency..."
                  value={conceptQuery}
                  onChange={(e) => setConceptQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!conceptQuery.trim() || explainingConcept}
                >
                  {explainingConcept ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Explaining...</span>
                    </>
                  ) : (
                    'Explain Concept'
                  )}
                </button>
              </form>

              {conceptExplanation && (
                <div className="concept-result-box">
                  <h4>Explanation for "{conceptQuery}":</h4>
                  <p>{conceptExplanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyWorkspace;

