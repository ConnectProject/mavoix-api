/* global Parse */

Parse.Cloud.define('resetDevice', async req => {
  const { username, password } = req.params
  const model = await new Parse.Query(Parse.User)
    .equalTo('username', username)
    .equalTo('linkedAccount', req.user.id)
    .first()
  if (!model) throw 'device not found'
  model.setPassword(password)
  await model.save(null, { useMasterKey: true });
  return 'password updated';
});

Parse.Cloud.define('removeDevice', async req => {
  const { username } = req.params
  Parse.Cloud.useMasterKey();
  const model = await new Parse.Query(Parse.User)
    .equalTo('username', username)
    .equalTo('linkedAccount', req.user.id)
    .first()
  if (!model) throw 'device not found'
  await model.destroy({ useMasterKey: true })
  return 'device removed';
});