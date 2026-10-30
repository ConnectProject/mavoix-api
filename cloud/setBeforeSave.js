/* global Parse */

Parse.Cloud.beforeSave('ConnectToken', (request) => {
  if (!request.master) {
    throw new Parse.Error(403, 'Users cannot modify their connect token directly');
  }
  const userID = request.object.get('mavoixUserId');

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
  const linkedAccount = request.object.get('linkedAccount');
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
  Parse.Cloud.beforeSave(className, (request) => {
    if (request.master) {
      return;
    }
    const { object, user } = request;

    if (!user) {
      throw new Parse.Error(401, 'No user authenticated');
    }
    const userField = object.get('user');
    if (userField) {
      if (userField !== user.id) {
        throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Wrong user id');
      }
    } else {
      object.set('user', user.id);
    }

    // Set ACL to allow only the owner to read and write
    const acl = new Parse.ACL();
    acl.setRoleReadAccess(user.id, true);
    acl.setRoleWriteAccess(user.id, true);
    object.setACL(acl);
  });
});

// Usage recorded by the app (read by the panel's "Statistiques" page).
// A device (DeviceUser) writes on behalf of the caregiver account it is linked to, so the owner is
// `linkedAccount || id`; both accounts belong to the role named after the owner (see setAfterSave.js).
const usageClasses = ['UsageSession', 'UsagePhrase'];

usageClasses.forEach((className) => {
  Parse.Cloud.beforeSave(className, (request) => {
    if (request.master) {
      return;
    }
    const { object, user } = request;

    if (!user) {
      throw new Parse.Error(401, 'No user authenticated');
    }
    const ownerId = user.get('linkedAccount') || user.id;
    const userField = object.get('user');
    if (userField && userField !== ownerId) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Wrong user id');
    }
    object.set('user', ownerId);
    // the writing account, set here so that it cannot be forged
    object.set('device', user.id);

    // Only the owner account and its devices can read and write
    const acl = new Parse.ACL();
    acl.setRoleReadAccess(ownerId, true);
    acl.setRoleWriteAccess(ownerId, true);
    object.setACL(acl);
  });
});
