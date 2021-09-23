/* global Parse */

Parse.Cloud.beforeSave('ConnectToken', (req) => {
  const acl = new Parse.ACL();

  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);

  req.object.set('ACL', acl);
});