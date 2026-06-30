const { db, FieldValue } = require("../config/firebase");
const geminiService = require("../services/gemini.service");
const trustService = require("../services/trust.service");

/**
 * POST /api/hub/questions — Post a question.
 */
async function createQuestion(req, res, next) {
  try {
    const uid = req.user.uid;
    const { title, body, photoUrl, language, ward, city } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required", code: "MISSING_FIELDS" });
    }

    // Get user profile
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found", code: "NOT_REGISTERED" });
    }
    const user = userSnap.data();

    // 1. Content moderation
    let moderation = { isAppropriate: true, confidence: 1.0, reason: null };
    try {
      moderation = await geminiService.moderateContent(title + " " + body, "question");
    } catch (err) {
      console.warn("Content moderation failed:", err.message);
    }

    if (!moderation.isAppropriate) {
      return res.status(400).json({
        error: "Content flagged as inappropriate",
        reason: moderation.reason,
        code: "CONTENT_FLAGGED"
      });
    }

    // 2. AI categorization
    let aiCategory = { category: "other", suggestedExpertType: "General Expert", tags: [], priority: "medium", language: "English" };
    try {
      aiCategory = await geminiService.categorizeQuestion(title, body);
    } catch (err) {
      console.warn("Question categorization failed:", err.message);
    }

    // 3. Find similar existing questions
    let similarQuestions = [];
    try {
      const existingQs = await db.collection("questions")
        .where("city", "==", city || "Latur")
        .where("status", "in", ["answered", "solved"])
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const existingData = existingQs.docs.map(d => ({ id: d.id, ...d.data() }));
      if (existingData.length > 0) {
        const similarResult = await geminiService.findSimilarQuestions(title, existingData);
        if (similarResult.hasSimilar && similarResult.similarIds.length > 0) {
          similarQuestions = existingData.filter(q => similarResult.similarIds.includes(q.id));
        }
      }
    } catch (err) {
      console.warn("Similar questions search failed:", err.message);
    }

    // 4. Create question
    const questionRef = db.collection("questions").doc();
    await questionRef.set({
      askerId: uid,
      askerName: user.name,
      askerTier: user.tier,
      title,
      body,
      photoUrl: photoUrl || null,
      category: aiCategory.category,
      aiCategory: aiCategory.category,
      aiRoutedTo: aiCategory.suggestedExpertType,
      aiTags: aiCategory.tags || [],
      language: language || aiCategory.language || "English",
      ward: ward || user.ward || "",
      city: city || user.city || "Latur",
      status: "open",
      answerCount: 0,
      upvotes: 0,
      upvotedBy: [],
      isFeatured: false,
      viewCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // 5. Award +5 points
    await trustService.addPoints(uid, "question_asked", questionRef.id, "question");

    res.status(201).json({
      id: questionRef.id,
      aiCategory: aiCategory.category,
      aiTags: aiCategory.tags,
      aiRoutedTo: aiCategory.suggestedExpertType,
      similarQuestions: similarQuestions.map(q => ({ id: q.id, title: q.title, status: q.status })),
      message: "Question posted successfully",
      pointsAwarded: 5
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/hub/questions — List questions with filters.
 */
async function listQuestions(req, res, next) {
  try {
    const {
      city, ward, category, status,
      sortBy = "createdAt", order = "desc",
      limit = 20
    } = req.query;

    let query = db.collection("questions");

    if (city) query = query.where("city", "==", city);
    if (ward) query = query.where("ward", "==", ward);
    if (category) query = query.where("category", "==", category);
    if (status) query = query.where("status", "==", status);

    query = query.orderBy(sortBy, order).limit(parseInt(limit));

    const snap = await query.get();
    const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ questions, count: questions.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/hub/questions/:id — Get question + all answers.
 */
async function getQuestion(req, res, next) {
  try {
    const { id } = req.params;

    const questionSnap = await db.collection("questions").doc(id).get();
    if (!questionSnap.exists) {
      return res.status(404).json({ error: "Question not found", code: "QUESTION_NOT_FOUND" });
    }

    // Increment view count
    await db.collection("questions").doc(id).update({
      viewCount: FieldValue.increment(1)
    });

    // Get answers
    const answersSnap = await db.collection("questions").doc(id)
      .collection("answers")
      .orderBy("createdAt", "desc")
      .get();
    const answers = answersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      question: { id: questionSnap.id, ...questionSnap.data() },
      answers,
      answerCount: answers.length
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/hub/questions/:id/answers — Post an answer.
 */
async function postAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { body, photoUrl } = req.body;

    if (!body) {
      return res.status(400).json({ error: "Answer body is required", code: "MISSING_BODY" });
    }

    // Get question
    const questionSnap = await db.collection("questions").doc(id).get();
    if (!questionSnap.exists) {
      return res.status(404).json({ error: "Question not found", code: "QUESTION_NOT_FOUND" });
    }

    // Get user profile
    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.data();

    // Create answer in subcollection
    const answerRef = db.collection("questions").doc(id).collection("answers").doc();
    await answerRef.set({
      expertId: uid,
      expertName: user.name,
      expertTier: user.tier,
      expertCategory: user.isExpert ? (user.expertCategories[0] || "general") : "community",
      body,
      photoUrl: photoUrl || null,
      upvotes: 0,
      upvotedBy: [],
      isAccepted: false,
      createdAt: FieldValue.serverTimestamp()
    });

    // Update question answer count and status
    const question = questionSnap.data();
    await db.collection("questions").doc(id).update({
      answerCount: (question.answerCount || 0) + 1,
      status: question.status === "open" ? "answered" : question.status,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award +15 points to answerer
    await trustService.addPoints(uid, "answer_given", id, "question");

    // Notify question asker
    await trustService.addNotification(
      question.askerId, "answer_received",
      "New Answer! 💡",
      `${user.name} answered your question: "${question.title.slice(0, 40)}..."`,
      id
    );

    res.status(201).json({
      id: answerRef.id,
      message: "Answer posted successfully",
      pointsAwarded: 15
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/hub/questions/:id/answers/:answerId/accept — Accept an answer.
 */
async function acceptAnswer(req, res, next) {
  try {
    const { id, answerId } = req.params;
    const uid = req.user.uid;

    // Get question
    const questionSnap = await db.collection("questions").doc(id).get();
    if (!questionSnap.exists) {
      return res.status(404).json({ error: "Question not found", code: "QUESTION_NOT_FOUND" });
    }

    const question = questionSnap.data();
    if (question.askerId !== uid) {
      return res.status(403).json({ error: "Only the question asker can accept answers", code: "UNAUTHORIZED" });
    }

    // Get answer
    const answerSnap = await db.collection("questions").doc(id).collection("answers").doc(answerId).get();
    if (!answerSnap.exists) {
      return res.status(404).json({ error: "Answer not found", code: "ANSWER_NOT_FOUND" });
    }

    const answer = answerSnap.data();

    // Accept the answer
    await db.collection("questions").doc(id).collection("answers").doc(answerId).update({
      isAccepted: true
    });

    // Update question status to solved
    await db.collection("questions").doc(id).update({
      status: "solved",
      updatedAt: FieldValue.serverTimestamp()
    });

    // Award +25 points to answerer
    await trustService.addPoints(answer.expertId, "answer_accepted", id, "question");

    // Notify expert
    await trustService.addNotification(
      answer.expertId, "answer_accepted",
      "Answer Accepted! 🏆 +25 pts",
      `Your answer to "${question.title.slice(0, 40)}..." was accepted as the solution!`,
      id
    );

    // Check if answerer now has 10+ accepted answers → add badge
    const allAcceptedSnap = await db.collectionGroup("answers")
      .where("expertId", "==", answer.expertId)
      .where("isAccepted", "==", true)
      .get();

    if (allAcceptedSnap.size >= 10) {
      const expertRef = db.collection("users").doc(answer.expertId);
      const expertSnap = await expertRef.get();
      const badges = expertSnap.data()?.badges || [];
      if (!badges.includes("expert_solver")) {
        await expertRef.update({
          badges: FieldValue.arrayUnion("expert_solver"),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    res.json({
      message: "Answer accepted as solution",
      questionStatus: "solved",
      pointsAwarded: 25
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/hub/questions/:id/upvote — Upvote question.
 */
async function upvoteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const questionSnap = await db.collection("questions").doc(id).get();
    if (!questionSnap.exists) {
      return res.status(404).json({ error: "Question not found", code: "QUESTION_NOT_FOUND" });
    }

    const question = questionSnap.data();
    if (question.upvotedBy && question.upvotedBy.includes(uid)) {
      return res.status(400).json({ error: "Already upvoted", code: "ALREADY_UPVOTED" });
    }

    await db.collection("questions").doc(id).update({
      upvotes: (question.upvotes || 0) + 1,
      upvotedBy: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ upvotes: (question.upvotes || 0) + 1 });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/hub/answers/:answerId/upvote — Upvote an answer.
 */
async function upvoteAnswer(req, res, next) {
  try {
    const { answerId } = req.params;
    const uid = req.user.uid;

    // We need to find which question this answer belongs to
    // Search across all questions' answers subcollections
    const questionsSnap = await db.collection("questions").get();

    let targetAnswerRef = null;
    let answerData = null;

    for (const qDoc of questionsSnap.docs) {
      const aSnap = await db.collection("questions").doc(qDoc.id).collection("answers").doc(answerId).get();
      if (aSnap.exists) {
        targetAnswerRef = aSnap.ref;
        answerData = aSnap.data();
        break;
      }
    }

    if (!targetAnswerRef || !answerData) {
      return res.status(404).json({ error: "Answer not found", code: "ANSWER_NOT_FOUND" });
    }

    if (answerData.upvotedBy && answerData.upvotedBy.includes(uid)) {
      return res.status(400).json({ error: "Already upvoted", code: "ALREADY_UPVOTED" });
    }

    await targetAnswerRef.update({
      upvotes: (answerData.upvotes || 0) + 1,
      upvotedBy: FieldValue.arrayUnion(uid)
    });

    res.json({ upvotes: (answerData.upvotes || 0) + 1 });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/hub/questions/search — Search questions.
 */
async function searchQuestions(req, res, next) {
  try {
    const { q, category, city = "Latur", limit = 20 } = req.query;

    let query = db.collection("questions").where("city", "==", city);
    if (category) query = query.where("category", "==", category);

    query = query.orderBy("createdAt", "desc").limit(100);

    const snap = await query.get();
    let questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Simple text search (in-memory since Firestore doesn't support full-text search)
    if (q) {
      const searchTerm = q.toLowerCase();
      questions = questions.filter(question =>
        question.title.toLowerCase().includes(searchTerm) ||
        question.body.toLowerCase().includes(searchTerm) ||
        (question.aiTags || []).some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    questions = questions.slice(0, parseInt(limit));

    res.json({ questions, count: questions.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/hub/experts — List experts.
 */
async function listExperts(req, res, next) {
  try {
    const { category, city, limit = 20 } = req.query;

    let query = db.collection("users").where("isExpert", "==", true);
    if (city) query = query.where("city", "==", city);

    const snap = await query.limit(parseInt(limit)).get();
    let experts = snap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      photoUrl: doc.data().photoUrl,
      trustScore: doc.data().trustScore,
      tier: doc.data().tier,
      expertCategories: doc.data().expertCategories,
      ward: doc.data().ward,
      city: doc.data().city
    }));

    if (category) {
      experts = experts.filter(e => e.expertCategories.includes(category));
    }

    res.json({ experts, count: experts.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/hub/categories — Get all categories with question counts.
 */
async function getCategories(req, res, next) {
  try {
    const city = req.query.city || "Latur";

    const snap = await db.collection("questions").where("city", "==", city).get();
    const categoryCounts = {};

    snap.docs.forEach(doc => {
      const cat = doc.data().category || "other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ categories, totalQuestions: snap.size });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/hub/ai-category — Categorize a community question.
 */
async function getAiCategory(req, res, next) {
  try {
    const { title, body } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title is required", code: "MISSING_TITLE" });
    }
    const aiCategory = await geminiService.categorizeQuestion(title, body || "");
    res.json(aiCategory);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createQuestion,
  listQuestions,
  getQuestion,
  postAnswer,
  acceptAnswer,
  upvoteQuestion,
  upvoteAnswer,
  searchQuestions,
  listExperts,
  getCategories,
  getAiCategory
};
