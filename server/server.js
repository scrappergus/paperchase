Accounts.onCreateUser(function (options, user) {
	Roles.setRolesOnUserObj(user, ['admin']);

    if (options.profile) {
      user.profile = options.profile
    }

    // other user object changes...
    // ...

    return user;
});