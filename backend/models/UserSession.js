const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Setup local JSON file database
const adapter = new FileSync(path.join(__dirname, '..', 'db.json'));
const db = low(adapter);

// Set default collections
db.defaults({ sessions: [] }).write();

module.exports = {
  // Simple create wrapper
  create: (sessionData) => {
    const newSession = {
      id: Date.now().toString(),
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    db.get('sessions').push(newSession).write();
    return newSession;
  },
  
  // Simple update wrapper
  findByIdAndUpdate: (id, updateData) => {
    return db.get('sessions')
             .find({ id })
             .assign(updateData)
             .write();
  }
};
