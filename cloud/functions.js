/* eslint-disable camelcase */
/* global Parse */
import url from 'url';

import axios from 'axios';

const { CONNECT_URL, CONNECT_CLIENT_ID, CONNECT_CLIENT_SECRET } = process.env;

const getUserId = function (req) {
  return req.user.get('linkedAccount') || req.user.id;
};

Parse.Cloud.define('resetDevice', async (req) => {
  const { username, password } = req.params;
  const device = await new Parse.Query(Parse.User)
    .equalTo('username', username)
    .equalTo('linkedAccount', getUserId(req))
    .first();
  if (!device) { throw new Error('device not found'); }
  device.setPassword(password);
  await device.save(null, { useMasterKey: true });

  return 'password updated';
});

Parse.Cloud.define('removeDevice', async (req) => {
  const { username } = req.params;
  const device = await new Parse.Query(Parse.User)
    .equalTo('username', username)
    .equalTo('linkedAccount', getUserId(req))
    .first({ useMasterKey: true });
  if (!device) { throw new Error('device not found'); }
  await device.destroy({ useMasterKey: true });

  return 'device removed';
});

Parse.Cloud.define('linkWithConnect', async (req) => {
  const { authorizationCode, redirectUri } = req.params;
  const userId = getUserId(req);

  const { data: tokenData } = await axios.post(
    `${CONNECT_URL}/oauth/token`,
    new url.URLSearchParams({
      client_id: CONNECT_CLIENT_ID,
      client_secret: CONNECT_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { data: userData } = await axios.get(`${CONNECT_URL}/oauth/user`, {
    headers: { Authorization: 'Bearer ' + tokenData.access_token }
  });

  const prevTokens = await new Parse.Query('ConnectToken')
    .equalTo('mavoixUserId', userId)
    .find();

  if (prevTokens.length) {
    await Parse.Object.destroyAll(prevTokens, { useMasterKey: true });
  }

  const ConnectToken = Parse.Object.extend(
    'ConnectToken'
  );
  const connectToken = new ConnectToken({
    mavoixUserId: userId,
    connectUserId: userData.id,
    refreshToken: tokenData.refresh_token,
    accessToken: tokenData.access_token
  });

  await connectToken.save(null, {
    useMasterKey: true
  });

  return {
    connectUserId: connectToken?.get('connectUserId'),
    accessToken: tokenData?.access_token
  };
});

// eslint-disable-next-line max-statements
Parse.Cloud.define('getConnectToken', async (req) => {
  const userId = getUserId(req);
  let tokenData;

  const connectToken = await new Parse.Query('ConnectToken')
    .equalTo('mavoixUserId', userId)
    .first({ useMasterKey: true });

  if (connectToken) {
    // test if token is still valid
    try {
      await axios.get(`${CONNECT_URL}/oauth/user`, {
        headers: { Authorization: 'Bearer ' + connectToken.get('accessToken') }
      });
    } catch (err) {
      if (err.response.status !== 401) {
        throw err;
      }
      // access token is no longer valid, try refresh token
      try {
        tokenData = (await axios.post(
          `${CONNECT_URL}/oauth/token`,
          new url.URLSearchParams({
            client_id: CONNECT_CLIENT_ID,
            client_secret: CONNECT_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: connectToken.get('refreshToken')
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )).data;

        connectToken.set({
          refreshToken: tokenData.refresh_token,
          accessToken: tokenData.access_token
        });
        await connectToken.save(null, {
          useMasterKey: true
        });
      } catch (err2) {
        // if refresh token is not valid
        if (err2.response.status === 400) {
          await connectToken.destroy({ useMasterKey: true });
        }
        throw err2;
      }
    }
  }

  return {
    connectUserId: connectToken?.get('connectUserId'),
    accessToken: tokenData?.access_token
  };
});

Parse.Cloud.define('unlinkFromConnect', async (req) => {
  const userId = getUserId(req);

  const connectTokens = await new Parse.Query('ConnectToken')
    .equalTo('mavoixUserId', userId)
    .find();

  if (connectTokens.length === 0) { throw new Error('not connected to connect'); }
  await Parse.Object.destroyAll(connectTokens, { useMasterKey: true });

  return 'disconnected from connect';
});
