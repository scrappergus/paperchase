Meteor.methods({
    addUser: function (user) {
      var loggedInUser = Meteor.user()

      if (!loggedInUser || !Roles.userIsInRole(loggedInUser, ['admin'])) {
        throw new Meteor.Error(403, "Access denied")
      }

      var id = Accounts.createUser(user);
      Roles.addUsersToRoles(id, user.roles);
      return id;
    }
})
