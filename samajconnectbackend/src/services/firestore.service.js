const { db, FieldValue } = require("../config/firebase");

/**
 * Generic Firestore CRUD helpers to reduce boilerplate across controllers.
 */

/**
 * Create a document in a collection.
 * Returns { id, ...data }.
 */
async function createDoc(collection, data) {
  const ref = db.collection(collection).doc();
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  await ref.set(docData);
  return { id: ref.id, ...docData };
}

/**
 * Get a single document by ID.
 * Returns null if not found.
 */
async function getDoc(collection, id) {
  const snap = await db.collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Update a document by ID.
 * Automatically sets updatedAt.
 */
async function updateDoc(collection, id, data) {
  const ref = db.collection(collection).doc(id);
  await ref.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp()
  });
  return { id, ...data };
}

/**
 * Delete a document by ID.
 */
async function deleteDoc(collection, id) {
  await db.collection(collection).doc(id).delete();
  return { id, deleted: true };
}

/**
 * Query documents with optional filters.
 * @param {string} collection - Firestore collection name
 * @param {Array} filters - Array of [field, operator, value]
 * @param {string} orderByField - Field to order by
 * @param {string} orderDir - "asc" or "desc"
 * @param {number} limitCount - Max results
 */
async function queryDocs(collection, filters = [], orderByField = "createdAt", orderDir = "desc", limitCount = 50) {
  let query = db.collection(collection);

  for (const [field, operator, value] of filters) {
    query = query.where(field, operator, value);
  }

  if (orderByField) {
    query = query.orderBy(orderByField, orderDir);
  }

  if (limitCount) {
    query = query.limit(limitCount);
  }

  const snap = await query.get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Calculate Haversine distance between two lat/lng points.
 * Returns distance in meters.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get bounding box for a radius around a point (for geo queries).
 * Returns { minLat, maxLat, minLng, maxLng }.
 */
function getBoundingBox(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111000;
  const lngDelta = radiusMeters / (111000 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

module.exports = {
  createDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  queryDocs,
  haversineDistance,
  getBoundingBox
};
