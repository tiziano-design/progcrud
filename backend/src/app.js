const express = require('express');
const cors = require('cors');
const sociosRouter = require('./routes/socios');
const authRouter = require('./routes/auth');
const { router: uploadRouter } = require('./routes/upload');
const { AppError } = require('./errors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/socios', sociosRouter);
app.use('/upload', uploadRouter);

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  console.error('💥 ERROR INESPERADO:', err);
  res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor de forma interna.'
  });
});

module.exports = app;
