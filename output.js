const fs = require('fs-extra');
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'contests';

MongoClient.connect(url, (err, client) => {
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const col = db.collection('users');
  col.find().sort([['no', 1]]).toArray((err, docs) => {
    const fo = 'dump.json'
    fs.writeFileSync(fo, JSON.stringify(docs, null, 4), (e) => {if(e) console.error(e);})
  });
  console.log('Done.');
  client.close();
});
