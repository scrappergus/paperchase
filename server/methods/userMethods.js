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
        var fut = new future();
        var userEmail = user.email;
        delete user.email;


        var userInfo = Meteor.users.findOne({_id : user._id});
        if(userInfo.emails && userInfo.emails[0].address != userEmail){
            user.emails = [];
            user.emails.push({'address':userEmail,'verified': false});
        }
        console.log(user);
        Meteor.users.update({'_id':user._id},{$set:user}, function (error) {
            if(error){
                fut.throw(error);
            }else{
                fut.return(true)
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
        // TODO: use roles collection for this. The roles package should create this, but it might be out of date
        return [
            'admin',
            'super',
            'articles'
        ]
    },
    readyUserFormData: function(userId){
        // console.log('readyUserFormData',userId);
        var fut = new future();
        var userRoles;
        var userInfo = {};
        var userFound = Meteor.users.findOne({_id : userId});

        var all_roles = [];

        if(userFound){
            userInfo = userFound;
        }
        // console.log('userInfo',userInfo);

        Meteor.call('getAllPossibleRoles',function(error,roles){
            if(error){
                console.error('getAllPossibleRoles',error);
            }else if(roles){
                roles.forEach(function(role){
                    var roleObj = {role: role}

                    if(userInfo.roles && userInfo.roles.indexOf(role) != -1){
                        roleObj.has_role = true;
                    }
                    all_roles.push(roleObj);
                });
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
