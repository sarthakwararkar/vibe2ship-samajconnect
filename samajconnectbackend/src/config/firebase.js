const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, "\n") : "",
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

let db;
let auth;
let storage;
let FieldValue;
let Timestamp;
let dbMode = "live";
let dbError = null;

const isCloudRun = !!process.env.K_SERVICE;
const useMock = process.env.USE_MOCK_FIRESTORE === "true" || (process.env.NODE_ENV === "development" && !isCloudRun);

if (useMock) {
  console.log("🔥 [SamajConnect] Using local JSON file mock database...");
  dbMode = "mock";
  dbError = "USE_MOCK_FIRESTORE enabled or NODE_ENV is development";
  const mock = require("./mockFirestore");
  db = mock.db;
  FieldValue = mock.FieldValue;
  Timestamp = mock.Timestamp;
  
  // Mock Firebase Auth verifyIdToken for dev offline mode
  auth = {
    verifyIdToken: async (token) => {
      const cleanToken = token.replace("mock-jwt-token-", "");
      if (cleanToken === "priya") {
        return { uid: "user_priya_002", email: "priya@example.com", name: "Priya Deshmukh" };
      } else if (cleanToken === "ramesh") {
        return { uid: "user_ramesh_003", email: "ramesh@example.com", name: "Ramesh Patil" };
      }
      return { uid: "user_sarthak_001", email: "sarthak@example.com", name: "Sarthak Kulkarni" };
    }
  };
  
  // Mock storage bucket helpers
  storage = {
    bucket: () => ({ name: "local-mock-bucket" })
  };
} else {
  try {
    if (process.env.NODE_ENV === "production") {
      // In production (Cloud Run), use Application Default Credentials (ADC)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "samajconnet",
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "samajconnet.firebasestorage.app"
        });
      }
    } else {
      // In development, require local service account credentials
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Missing or incomplete Firebase Admin SDK credentials in environment variables.");
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    FieldValue = admin.firestore.FieldValue;
    Timestamp = admin.firestore.Timestamp;
    console.log("🔥 [SamajConnect] Successfully connected to live Firebase / Firestore database!");
  } catch (err) {
    console.warn("⚠️ [SamajConnect] Live Firebase initialization failed, falling back to mock database:", err.message);
    dbMode = "mock";
    dbError = err.message;
    const mock = require("./mockFirestore");
    db = mock.db;
    FieldValue = mock.FieldValue;
    Timestamp = mock.Timestamp;
    
    // Mock Firebase Auth verifyIdToken for dev offline mode
    auth = {
      verifyIdToken: async (token) => {
        const cleanToken = token.replace("mock-jwt-token-", "");
        if (cleanToken === "priya") {
          return { uid: "user_priya_002", email: "priya@example.com", name: "Priya Deshmukh" };
        } else if (cleanToken === "ramesh") {
          return { uid: "user_ramesh_003", email: "ramesh@example.com", name: "Ramesh Patil" };
        }
        return { uid: "user_sarthak_001", email: "sarthak@example.com", name: "Sarthak Kulkarni" };
      }
    };
    
    // Mock storage bucket helpers
    storage = {
      bucket: () => ({ name: "local-mock-bucket" })
    };
  }
}

module.exports = { admin, db, auth, storage, FieldValue, Timestamp, dbMode, dbError };


