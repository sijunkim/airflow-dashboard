const express = require('express');
const compression = require('compression');
const path = require('path');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', apiRouter);

app.listen(PORT, () => {
  console.log(`Dashboard running on port ${PORT}`);
  console.log(`Data directory: ${process.env.DATA_DIR || '/data'}`);
});
