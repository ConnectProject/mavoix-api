import express from 'express'
import http from 'http'
import { ParseServer } from 'parse-server'

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
	require('dotenv').config()
}

const LISTEN_PORT = process.env.PORT
const PUBLIC_URL = process.env.PUBLIC_URL

const app = express()

const parseServer = new ParseServer({
	databaseURI: process.env.MONGODB_ADDON_URI,
	appId: process.env.APP_ID,
	masterKey: process.env.MASTER_KEY,
	javascriptKey: process.env.JAVASCRIPT_KEY,
	fileKey: process.env.FILE_KEY,
	serverURL: `http://${process.env.HOST}:${LISTEN_PORT}`,
	...(PUBLIC_URL && {publicServerURL: PUBLIC_URL}),
	liveQuery: {
		classNames: ['Tab', 'TabItem', 'Session']
	}
})

app.use('/', parseServer)

const server = http.createServer(app)

server.listen(LISTEN_PORT).on('listening', () => {
	console.log(`Server listening on port ${LISTEN_PORT}`)
})

ParseServer.createLiveQueryServer(server)
