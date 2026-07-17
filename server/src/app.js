const express = require('express');

const helmet = require('helmet');

const cors = require('cors');

const morgan = require('morgan');

const cookieParser = require('cookie-parser');

const mongoSanitize = require('express-mongo-sanitize');

const routes = require('./routes');

const rateLimit = require('express-rate-limit');


const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));

app.use(express.json());

app.use(cookieParser());

app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
});

app.use('/api/v1', limiter, routes);

app.use(errorHandler);

module.exports = app;