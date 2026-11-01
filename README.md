# Ma Voix - API

## Preparation
1. Prepare the repo
> `git clone https://github.com/ConnectProject/mavoix-api.git`

> `npm install`


2. Load environment variables
> To load environment variables you can copy `.env.example` to a file called `.env` and do as described inside in this first file

## Running
> `npm start`

## Admin UI (Parse Dashboard)
This API has no admin UI of its own; Parse Dashboard is installed as a dev dependency. With the API running:

> `npm run dashboard`

Then open http://127.0.0.1:4040. The script uses `appId` `mavoix-api` and master key `masterKey`; if your `.env` has other values, edit the `dashboard` script in `package.json`. The dashboard uses the master key, so keep it bound to localhost.
