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
    const flashcard = await Flashcard.findOne({
      _id: req.params.cardId,
      userId: req.user._id,
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: "Flashcard not found",
      });
    }

    flashcard.reviewCount = (flashcard.reviewCount || 0) + 1;
    flashcard.lastReviewed = new Date();

    await flashcard.save();

    res.status(200).json({
      success: true,
      data: flashcard,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.cardId,
      userId: req.user._id,
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: "Flashcard not found",
      });
    }

    flashcard.isStarred = !flashcard.isStarred;

    await flashcard.save();

    res.status(200).json({
      success: true,
      data: flashcard,
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

