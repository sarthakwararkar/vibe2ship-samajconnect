const { auth } = require("../config/firebase");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided", code: "UNAUTHORIZED" });
  }

  const token = authHeader.split("Bearer ")[1];

  // Development bypass for mock tokens
  if (token && token.startsWith("mock-jwt-token-")) {
    const userKey = token.replace("mock-jwt-token-", "");
    // Map known seeded users, otherwise create a dynamic mock user from the token key
    const knownUsers = {
      sarthak: { uid: "user_sarthak_001", email: "sarthak@example.com", name: "Sarthak Kulkarni" },
      priya:   { uid: "user_priya_002",   email: "priya@example.com",   name: "Priya Deshmukh" },
      ramesh:  { uid: "user_ramesh_003",   email: "ramesh@example.com",  name: "Ramesh Patil" }
    };
    req.user = knownUsers[userKey] || { uid: `user_${userKey}_001`, email: `${userKey}@example.com`, name: userKey };
    return next();
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // { uid, email, name, ... }
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
};

