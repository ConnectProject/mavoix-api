function EnvError(name) {
	return Error(`Please launch server with the following env variable: ${name}`)
}

export function checkEnv() {
	const env = process.env

	console.log(env)
	if (!env.DATABASE_URI)
		throw EnvError('DATABASE_URI')
	if (!env.APP_ID)
		throw EnvError('APP_ID')
	if (!env.JAVASCRIPT_KEY)
		throw EnvError('JAVASCRIPT_KEY')
	if (!env.MASTER_KEY)
		throw EnvError('MASTER_KEY')
	if (!env.FILE_KEY)
		throw EnvError('FILE_KEY')
}