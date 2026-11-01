/* global Parse */

// Account management for caregiver accounts (username = email). Users cannot write their own _User row
// (see the ACL set in setBeforeSave.js), so these functions act with the master key after checking the
// current password.

const DATA_CLASSES = ['TabItem', 'Tab', 'Asset', 'UsagePhrase', 'UsageSession'];

const getCaregiver = async function (req, password) {
  const { user } = req;
  if (!user) { throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'No user authenticated'); }
  if (user.get('linkedAccount')) { throw new Error('devices cannot manage the account'); }
  if (!password) { throw new Error('current password required'); }
  try {
    await Parse.User.verifyPassword(user.get('username'), password, { useMasterKey: true });
  } catch (err) {
    throw new Error('wrong password');
  }

  return user;
};

Parse.Cloud.define('getAccount', (req) => {
  const { user } = req;
  if (!user) { throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'No user authenticated'); }

  return { email: user.get('email') || user.get('username') };
});

Parse.Cloud.define('updateAccountEmail', async (req) => {
  const { email, password } = req.params;
  const user = await getCaregiver(req, password);
  const newEmail = String(email || '').trim();
  if (!(/^[^@\s]+@[^@\s]+\.[^@\s]+$/u).test(newEmail)) { throw new Error('invalid email'); }

  const existing = await new Parse.Query(Parse.User)
    .equalTo('username', newEmail)
    .first({ useMasterKey: true });
  if (existing && existing.id !== user.id) { throw new Error('email already used'); }

  user.set('username', newEmail);
  user.set('email', newEmail);
  await user.save(null, { useMasterKey: true });

  return { email: newEmail };
});

Parse.Cloud.define('updateAccountPassword', async (req) => {
  const { password, newPassword } = req.params;
  const user = await getCaregiver(req, password);
  if (!newPassword || newPassword.length < 6) { throw new Error('new password too short'); }

  user.setPassword(newPassword);
  await user.save(null, { useMasterKey: true });

  return 'password updated';
});

Parse.Cloud.define('deleteAccount', async (req) => {
  const user = await getCaregiver(req, req.params.password);

  for (const className of DATA_CLASSES) {
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const rows = await new Parse.Query(className)
        .equalTo('user', user.id)
        .limit(1000)
        .find({ useMasterKey: true });
      if (rows.length === 0) { break; }
      // eslint-disable-next-line no-await-in-loop
      await Parse.Object.destroyAll(rows, { useMasterKey: true });
    }
  }
  const tokens = await new Parse.Query('ConnectToken')
    .equalTo('mavoixUserId', user.id)
    .find({ useMasterKey: true });
  await Parse.Object.destroyAll(tokens, { useMasterKey: true });

  // beforeDelete removes the linked devices and the role
  await user.destroy({ useMasterKey: true });

  return 'account deleted';
});
