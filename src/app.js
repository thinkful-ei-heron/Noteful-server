require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const foldersRouter = require('./folders/folders-router');
const noteRouter = require('./notes/notes-router');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

  app.use(morgan(morganOption));
  app.use(helmet());
  app.use(cors());


  app.get('/', (req,res) => {
    res.send('Hello, world');
  });

  app.use(function errorHandler(error,req,res,next) {
    let response;
    if (NODE_ENV === 'production') {
      response = { error: { message: 'server error' } }
    } else {
      console.error(error);
      response = { message: error.message };
    }
    res.status(500).json(response);
  });

  app.use('/api/folders', foldersRouter);
  app.use('/api/notes', noteRouter);

  module.exports = app;