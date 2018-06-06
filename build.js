const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const babel = require('@babel/core');
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'contests';

const compileFile = async (tmpl, file, data) => {
  const res = tmpl(data);
  await fs.writeFile(path.join(__dirname, `./dist/${file}.html`), res);
};

const run = async (col) => {
  const tmplString = await fs.readFile(path.join(__dirname, './src/index.html'), 'utf-8');
  const tmpl = _.template(tmplString, {
    imports: {
      require: (p) => {
        const cnt = fs.readFileSync(path.join(__dirname, './src/', p), 'utf-8');
        return cnt;
      },
    },
  });
  await fs.emptyDir(path.join(__dirname, './dist/'));
  await fs.mkdir(path.join(__dirname, './dist/assets/'));
  const { code } = await babel.transformFileAsync(
    path.join(__dirname, './src/style.js'),
    {
      ast: false,
      comments: false,
      compact: true,
      filename: './src/style.js',
    },
  );
  await fs.writeFile(path.join(__dirname, './dist/assets/style.js'), code, 'utf-8');
  await fs.copy(
    path.join(__dirname, './src/public/'),
    path.join(__dirname, './dist/assets/'),
  );

  col.find().sort([['no', 1]]).forEach(async (doc) => {
    await compileFile(tmpl, `saishi${doc.no}`, doc);
  }, (err) => { if (err) console.error(err); });
};

MongoClient.connect(url, (err, client) => {
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const col = db.collection('users');
  run(col).then(() => {
    console.log('Done');
    client.close();
  }).catch((e) => {
    console.error(e);
    client.close();
  });
});
