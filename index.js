import express from 'express'
import http from 'http'
import { ParseServer } from 'parse-server'

import { checkEnv } from './utils'

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
	require('dotenv').config()
}
checkEnv()


const LISTEN_PORT = process.env.LISTEN_PORT

const app = express()

const parseServer = new ParseServer({
	databaseURI: process.env.DATABASE_URI,
	appId: process.env.APP_ID,
	masterKey: process.env.MASTER_KEY,
	javascriptKey: process.env.JAVASCRIPT_KEY,
	fileKey: process.env.FILE_KEY,
	serverURL: `http://localhost:${LISTEN_PORT}/`,
	liveQuery: {
		classNames: ['Tab', 'TabItem']
	}
})

app.use('/', parseServer)

const server = http.createServer(app)

server.listen(LISTEN_PORT).on('listening', () => {
	console.log(`Server listening on port ${LISTEN_PORT}`)
})

ParseServer.createLiveQueryServer(server)