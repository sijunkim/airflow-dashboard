const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const apiRouter = require('./routes/api');
const { DATA_DIR } = require('./services/dataReader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

app.get('/health', (_req, res) => {
  const dataAccessible = fs.existsSync(DATA_DIR);
  res.status(dataAccessible ? 200 : 503).json({
    status: dataAccessible ? 'ok' : 'degraded',
    dataDir: DATA_DIR,
    dataDirAccessible: dataAccessible,
  });
});

app.use('/api/v1', apiRouter);

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Dashboard running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  if (!fs.existsSync(DATA_DIR)) {
    console.warn(`WARNING: Data directory not found: ${DATA_DIR}`);
  }
});
