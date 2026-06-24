import Flashcard from "../models/Flashcard.js";

export const getFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      userId: req.user._id,
      documentId: req.params.documentId,
    })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcards.length,
      data: flashcards,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFlashcardSets = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      userId: req.user._id,
    }).populate("documentId", "title fileName");

    const groupedSets = {};

    flashcards.forEach((card) => {
      const docId = card.documentId._id.toString();

      if (!groupedSets[docId]) {
        groupedSets[docId] = {
          document: card.documentId,
          totalCards: 0,
          starredCards: 0,
        };
      }

      groupedSets[docId].totalCards++;

      if (card.isStarred) {
        groupedSets[docId].starredCards++;
      }
    });

    res.status(200).json({
      success: true,
      count: Object.keys(groupedSets).length,
      data: Object.values(groupedSets),
    });
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req, res, next) => {
  try {
    const flashcardDoc = await Flashcard.findOne({
      userId: req.user._id,
      "cards._id": req.params.cardId,
    });

    if (!flashcardDoc) {
      return res.status(404).json({
        success: false,
        message: "Flashcard not found",
      });
    }

    const card = flashcardDoc.cards.id(req.params.cardId);

    card.reviewCount += 1;
    card.lastReviewed = new Date();

    await flashcardDoc.save();

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const flashcardDoc = await Flashcard.findOne({
      userId: req.user._id,
      "cards._id": req.params.cardId,
    });

    if (!flashcardDoc) {
      return res.status(404).json({
        success: false,
        message: "Flashcard not found",
      });
    }

    const card = flashcardDoc.cards.find(
      (c) => c._id.toString() === req.params.cardId
    );

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found in flashcard set",
      });
    }

    card.isStarred = !card.isStarred;

    await flashcardDoc.save();

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const deletedCards = await Flashcard.deleteMany({
      documentId: req.params.id,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      deletedCount: deletedCards.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

