import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import express from 'express';
import { ParseServer } from 'parse-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  dotenv.config();
}

const LISTEN_PORT = process.env.PORT;
const {PUBLIC_URL} = process.env;

const app = express();

const parseServer = new ParseServer({
  databaseURI: process.env.MONGODB_ADDON_URI,
  cloud: path.join(__dirname, 'cloud/main.js'),
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  javascriptKey: process.env.JAVASCRIPT_KEY,
  fileKey: process.env.FILE_KEY,
  serverURL: `http://${process.env.HOST}:${LISTEN_PORT}`,
  ...(PUBLIC_URL && { publicServerURL: PUBLIC_URL }),
  liveQuery: {
    classNames: ['Tab', 'TabItem', 'Session', 'ConnectToken']
  },
  protectedFields: {
    _User: { '*': ['email'] },
    ConnectToken: { '*': ['refreshToken'] }
  }
});

await parseServer.start();

app.use('/', parseServer.app);

const server = http.createServer(app);

server.listen(LISTEN_PORT).on('listening', () => {
  console.log(`Server listening on port ${LISTEN_PORT}`);
});

ParseServer.createLiveQueryServer(server);
