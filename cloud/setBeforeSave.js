/* global Parse */

Parse.Cloud.beforeSave('ConnectToken', (request) => {
  if (!request.master) {
    throw new Parse.Error(403, 'Users cannot modify their connect token directly');
  }
  const userID = request.object.get('mavoixUserId')

  const acl = new Parse.ACL();
  acl.setRoleReadAccess(userID, true);
  acl.setPublicWriteAccess(false);

  request.object.setACL(acl);
});

Parse.Cloud.beforeSave(Parse.User, (request) => {
  if (request.master) {
    return;
  }

  const acl = new Parse.ACL();
  const linkedAccount = request.object.get('linkedAccount')
  if (linkedAccount) {
    acl.setRoleReadAccess(linkedAccount, true);
  } else {
    acl.setPublicReadAccess(false);
  }
  acl.setPublicWriteAccess(false);
  
  request.object.setACL(acl);
});

const classes = ['Asset', 'Tab', 'TabItem'];

classes.forEach((className) => {
  Parse.Cloud.beforeSave(className, async (request) => {
    if (request.master) {
      return;
    }
    const { object, user } = request;

    if (!user) {
      throw new Parse.Error(401, 'No user authenticated');
    }
    const userField = object.get('user')
    if (userField) {
      if (userField !== user.id) {
        throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Wrong user id');
      }
    } else {
      object.set('user', user.id)
    }

    // Set ACL to allow only the owner to read and write
    const acl = new Parse.ACL();
    acl.setRoleReadAccess(user.id, true);
    acl.setRoleWriteAccess(user.id, true);
    object.setACL(acl);
  });
});