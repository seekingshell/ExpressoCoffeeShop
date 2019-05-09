const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const apiRouter = require('./api/api');

app.use(bodyParser.json());
app.use(cors());
app.use('/api', apiRouter);

module.exports = app;
