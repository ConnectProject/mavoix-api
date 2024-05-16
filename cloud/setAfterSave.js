/* global Parse */

Parse.Cloud.afterSave(Parse.User, async (request) => {
  console.log('afterSave');
  const user = request.object;

  const roleName = user.get('linkedAccount') || user.id;

  // Fetch the associated role based on user's ID
  let userRole = await new Parse.Query(Parse.Role).equalTo('name', roleName)
    .first({ useMasterKey: true });
  if (userRole) {
    // skip if user is already in user role
    const userCount = await userRole.getUsers().query()
      .equalTo('objectId', user.id)
      .count();
    if (userCount) {
      return;
    }
  } else {

    // Create the role
    const roleACL = new Parse.ACL();
    userRole = new Parse.Role(roleName, roleACL);
  }

  // Add the user to the role
  userRole.getUsers().add(user);
  await userRole.save(null, { useMasterKey: true });
  console.log('user to role');
});
