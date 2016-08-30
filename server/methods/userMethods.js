Meteor.methods({
    addUser: function (user) {
      var loggedInUser = Meteor.user()

      if (!loggedInUser || !Roles.userIsInRole(loggedInUser, ['admin'])) {
        throw new Meteor.Error(403, "Access denied")
      }

      var id = Accounts.createUser(user);
      Roles.addUsersToRoles(id, user.roles);
      return id;
    },
    updateUser: function(user){
        // console.log('updateUser',user);
        var fut = new future();
        var userEmail = user.email;

        // Email
        var userInfo = Meteor.users.findOne({_id : user._id});
        if(userInfo.emails && userInfo.emails[0].address != userEmail){
            user.emails = [];
            user.emails.push({'address':userEmail,'verified': false});
        }

        // Roles
        // Groups
        for(var group in user.roles){
            if(group != 'admin'){
                Roles.setUserRoles(user._id, [], group); // reset group
                user.roles[group].forEach(function(role){
                    Roles.addUsersToRoles(user._id, role, group);
                });
            }
        }
        // Global
        Roles.setUserRoles(user._id, [], Roles.GLOBAL_GROUP); // reset group
        Roles.addUsersToRoles(user._id, user.roles.admin, Roles.GLOBAL_GROUP);

        delete user.roles; // already set in DB above
        delete user.email; // already set in user obj above

        Meteor.users.update({'_id':user._id},{$set:user}, function (error) {
            if(error){
                fut.throw(error);
            }else{
                fut.return(true);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    getAllPossibleRoles: function(){
        // TODO: use roles collection for this. Looks like the collection does not retain group information though, which we need to determine different kinds of edit
        return {
            admin: ['admin','super-admin'],
            article: ['edit', 'data-submissions'],
            // user: ['edit'],
            // issue: ['edit'],
            // volume: ['edit'],
            // site: ['edit'],
            // institution: ['edit']
        };
    },
    readyUserFormData: function(userId){
        // for both adding and editing user. If adding user then userId will be null.

        var fut = new future();
        var userRoles;
        var userInfo = {};
        var userFound = Meteor.users.findOne({_id : userId});

        var all_roles = {};

        if(userFound){
            userInfo = userFound;
        }else if(userId !== null){
            fut.return(false);
        }
        // console.log('userInfo',userInfo);

        Meteor.call('getAllPossibleRoles',function(error,roles){
            if(error){
                console.error('getAllPossibleRoles',error);
            }else if(roles){
                for(var group in roles){
                    if(!all_roles[group]){
                        all_roles[group] = [];
                    }
                    roles[group].forEach(function(role){
                        var roleObj = {role: role};
                        if(Roles.userIsInRole(userInfo, role, group)){
                            roleObj.has_role = true;
                        }
                        all_roles[group].push(roleObj);
                    });

                }
                userInfo.all_roles = all_roles;
                fut.return(userInfo);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    validateUserData: function(user){
        var result = {};
        var invalid = [];
        var emailValid = false;
        var clear = '<div class="clearfix"></div>';

        // Email
        if(user.email === ''){
            invalid.push({
                'fieldset_id' : 'user-email',
                'message' : clear + 'User email is required'
            });
        }else if(!Meteor.validate.email(user.email)){
            invalid.push({
                'fieldset_id' : 'user-email',
                'message' : clear + 'Email is not valid'
            });
        }

        result.invalid = invalid;
        return result;
    }
});
