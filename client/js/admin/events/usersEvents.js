// Users
// ----------------
Template.AdminUserForm.events({
    'submit form': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        $('input').removeClass('invalid');
        //gather info
        var user = Meteor.adminUser.getFormData();
        // console.log('user',user);
        Meteor.call('validateUserData',user,function(error,result){
            if(error){
                Meteor.formActions.errorMessage('Could not update the database');
            }else if(result && result.invalid.length > 0){
                Meteor.formActions.invalid(result.invalid);
            }else if(result && user._id){
                Meteor.call('updateUser',user,function(error,result){
                    if(error){
                        console.error(error);
                        Meteor.formActions.errorMessage('Could not update user.<br>' + error.reason);
                    }else if(result){
                        Meteor.formActions.successMessage('User updated');
                    }
                });
            }else if(result){
                Meteor.call('addUser',user,function(error,result){
                    if(error){
                        console.error(error);
                        Meteor.formActions.errorMessage('Could not add user.<br>' + error.reason);
                    }else if(result){
                        Meteor.formActions.closeModal();
                        Router.go('AdminUser',{_id: result});
                        // Meteor.formActions.successMessage('User added');
                    }
                });
            }
        });
    }
});
Template.AdminUserSubs.events({
        'submit form' : function(e,t) {
            e.preventDefault();
            Meteor.formActions.saving();

            var subs = [];
            $('.sub-cb').each(function() {
                    if($(this).prop('checked')) {
                        var v = $(this).attr('data-volume');
                        var i = $(this).attr('data-issue');

                        subs.push(obj = {
                            type: 'issue'
                            ,volume: v
                            ,issue: i
                        });



                    }
                });

            Meteor.call('updateSubs', t.data.u._id,  subs, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });

        }
});