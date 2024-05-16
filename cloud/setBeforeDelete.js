/* global Parse */

Parse.Cloud.beforeDelete(Parse.User, async (request) => {
  const user = request.object;

  // remove all devices associated to user
  const devices = await new Parse.Query(Parse.User)
    .equalTo('linkedAccount', user.id)
    .find();

  for (const device of devices) {
    // eslint-disable-next-line no-await-in-loop
    await device.destroy({ useMasterKey: true });
  }

  // Fetch the associated role based on user's ID
  const roleName = user.get('linkedAccount') || user.id;
  const userRole = await new Parse.Query(Parse.Role)
    .equalTo('name', roleName)
    .first({ useMasterKey: true });

  if (!userRole) {
    return;
  }
  userRole.getUsers().remove(user);
  if (roleName === user.id) {
    await userRole.destroy({ useMasterKey: true });
  }
});
