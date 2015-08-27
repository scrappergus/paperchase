
Meteor.methods({
    addUser: function (user) {
      console.log('..addUser');
      var loggedInUser = Meteor.user()

      if (!loggedInUser || !Roles.userIsInRole(loggedInUser, ['admin'])) {
        throw new Meteor.Error(403, "Access denied")
      }

      return Accounts.createUser(user);
    }
})
