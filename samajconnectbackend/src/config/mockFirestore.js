const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "../../db_local");

// Helper to read JSON file
function readData(collection) {
  const filePath = path.join(DB_DIR, `${collection}.json`);
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content || "[]");
  } catch (err) {
    return [];
  }
}

// Helper to write JSON file
function writeData(collection, data) {
  const filePath = path.join(DB_DIR, `${collection}.json`);
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

class DocumentReference {
  constructor(collectionPath, id) {
    this._collectionPath = collectionPath;
    this.id = id || Math.random().toString(36).substring(2, 15);
  }

  async get() {
    const list = readData(this._collectionPath);
    const item = list.find(x => x.id === this.id);
    return new DocumentSnapshot(this.id, item, this._collectionPath);
  }

  async set(data) {
    const list = readData(this._collectionPath);
    const index = list.findIndex(x => x.id === this.id);
    const cleanData = JSON.parse(JSON.stringify(data));
    const existingDoc = index > -1 ? list[index] : {};
    const resolvedData = resolveSpecialValues(cleanData, existingDoc);
    
    const record = { id: this.id, ...resolvedData };
    if (index > -1) {
      list[index] = record;
    } else {
      list.push(record);
    }
    writeData(this._collectionPath, list);
    return this;
  }

  async update(data) {
    const list = readData(this._collectionPath);
    const index = list.findIndex(x => x.id === this.id);
    if (index === -1) {
      throw new Error(`Document not found: ${this._collectionPath}/${this.id}`);
    }
    const cleanData = JSON.parse(JSON.stringify(data));
    const resolvedData = resolveSpecialValues(cleanData, list[index]);
    
    list[index] = { ...list[index], ...resolvedData };
    writeData(this._collectionPath, list);
    return this;
  }

  async delete() {
    const list = readData(this._collectionPath);
    const newList = list.filter(x => x.id !== this.id);
    writeData(this._collectionPath, newList);
    return this;
  }

  collection(subcollectionName) {
    return new CollectionReference(`${this._collectionPath}_sub_${subcollectionName}_parent_${this.id}`);
  }
}

class DocumentSnapshot {
  constructor(id, data, collectionPath) {
    this.id = id;
    this._data = data;
    this.exists = data !== null && data !== undefined;
    this.ref = new DocumentReference(collectionPath, id);
  }
  data() {
    return this._data ? JSON.parse(JSON.stringify(this._data)) : undefined;
  }
}

class QuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

function resolveSpecialValues(data, existingDoc) {
  if (!data || typeof data !== "object") return data;
  
  if (Array.isArray(data)) {
    return data.map((item, idx) => {
      const existingItem = existingDoc && Array.isArray(existingDoc) ? existingDoc[idx] : undefined;
      return resolveSpecialValues(item, existingItem);
    });
  }
  
  const result = { ...data };
  
  for (const key in result) {
    const val = result[key];
    if (val && typeof val === "object") {
      if (val.__serverTimestamp) {
        result[key] = new Date().toISOString();
      } else if (val.__increment !== undefined) {
        const current = existingDoc && existingDoc[key] !== undefined ? Number(existingDoc[key]) : 0;
        result[key] = current + val.__increment;
      } else if (val.__arrayUnion !== undefined) {
        const currentArray = existingDoc && Array.isArray(existingDoc[key]) ? existingDoc[key] : [];
        const newArray = [...currentArray];
        val.__arrayUnion.forEach(item => {
          const exists = newArray.some(x => {
            if (typeof x === "object" && typeof item === "object") {
              return JSON.stringify(x) === JSON.stringify(item);
            }
            return x === item;
          });
          if (!exists) {
            newArray.push(item);
          }
        });
        result[key] = newArray;
      } else if (val.__arrayRemove !== undefined) {
        const currentArray = existingDoc && Array.isArray(existingDoc[key]) ? existingDoc[key] : [];
        result[key] = currentArray.filter(x => {
          return !val.__arrayRemove.some(item => {
            if (typeof x === "object" && typeof item === "object") {
              return JSON.stringify(x) === JSON.stringify(item);
            }
            return x === item;
          });
        });
      } else {
        const existingNested = existingDoc && existingDoc[key] ? existingDoc[key] : undefined;
        result[key] = resolveSpecialValues(val, existingNested);
      }
    }
  }
  return result;
}

class Query {
  constructor(collection, items) {
    this.collection = collection;
    this.items = items;
  }

  where(field, operator, value) {
    const filtered = this.items.filter(item => {
      const val = item[field];
      if (operator === "==") return val === value;
      if (operator === "!=") return val !== value;
      if (operator === ">") return val > value;
      if (operator === ">=") return val >= value;
      if (operator === "<") return val < value;
      if (operator === "<=") return val <= value;
      if (operator === "array-contains") return Array.isArray(val) && val.includes(value);
      if (operator === "in") return Array.isArray(value) && value.includes(val);
      return false;
    });
    return new Query(this.collection, filtered);
  }

  orderBy(field, direction = "asc") {
    const sorted = [...this.items].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (typeof valA === "string") {
        return direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return direction === "asc" ? valA - valB : valB - valA;
    });
    return new Query(this.collection, sorted);
  }

  limit(count) {
    return new Query(this.collection, this.items.slice(0, count));
  }

  async get() {
    const docs = this.items.map(item => new DocumentSnapshot(item.id, item, this.collection));
    return new QuerySnapshot(docs);
  }
}

class CollectionReference extends Query {
  constructor(collection) {
    super(collection, readData(collection));
  }

  doc(id) {
    return new DocumentReference(this.collection, id);
  }

  async add(data) {
    const docRef = new DocumentReference(this.collection);
    await docRef.set(data);
    return docRef;
  }
}

class WriteBatch {
  constructor() {
    this.operations = [];
  }

  set(docRef, data) {
    this.operations.push(() => docRef.set(data));
    return this;
  }

  update(docRef, data) {
    this.operations.push(() => docRef.update(data));
    return this;
  }

  delete(docRef) {
    this.operations.push(() => docRef.delete());
    return this;
  }

  async commit() {
    for (const op of this.operations) {
      await op();
    }
  }
}

const mockDb = {
  collection: (name) => new CollectionReference(name),
  collectionGroup: (name) => {
    if (!fs.existsSync(DB_DIR)) {
      return new Query(name, []);
    }
    const files = fs.readdirSync(DB_DIR);
    const pattern = `_sub_${name}_parent_`;
    let allItems = [];
    files.forEach(file => {
      if (file.includes(pattern) && file.endsWith(".json")) {
        const collectionName = file.replace(".json", "");
        const items = readData(collectionName);
        allItems = allItems.concat(items);
      }
    });
    return new Query(name, allItems);
  },
  batch: () => new WriteBatch()
};

const mockFieldValue = {
  serverTimestamp: () => ({ __serverTimestamp: true }),
  increment: (val) => ({ __increment: val }),
  arrayUnion: (...elements) => ({ __arrayUnion: elements }),
  arrayRemove: (...elements) => ({ __arrayRemove: elements })
};

const mockTimestamp = {
  now: () => ({ toMillis: () => Date.now(), toDate: () => new Date() }),
  fromDate: (date) => ({ toMillis: () => date.getTime(), toDate: () => date })
};

module.exports = {
  db: mockDb,
  FieldValue: mockFieldValue,
  Timestamp: mockTimestamp
};
