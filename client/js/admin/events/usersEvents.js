
// Users
// ----------------
Template.AdminUser.events({
    'click .edit-user': function(e){
        e.preventDefault();
        $('.user-overview').addClass('hide');
        $('.user-edit').removeClass('hide');
    },
    'click .role-cb': function(e){
        Meteor.adminUser.clickedRole(e);
    },
    'click .cancel-user-edit': function(e){
        $('.overview').removeClass('hide');
        $('.edit').addClass('hide');
    },
    'submit form': function(e){
        e.preventDefault();
        $('input').removeClass('invalid');
        //gather info
        var userId = $('#user-id').val();
        var user = Meteor.adminUser.getFormUpdate();

        //TODO: additional validate email
        // var emailValid = Meteor.validate.email(user.emails[0]);
        // if(!emailValid){
        //  $('#email').addClass('invalid');
        // }else{
            Meteor.users.update({'_id':userId},{$set:user}, function (error) {
                if(error){
                    alert('Error '+error);
                }else{
                    alert('Saved');
                }
            });
        // }
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
Template.AdminAddUser.events({
    'click .role-cb': function(e){
        Meteor.adminUser.clickedRole(e);
    },
    'submit form': function(e){
        e.preventDefault();
        $('input').removeClass('invalid');
        //gather info
        var user = Meteor.adminUser.getFormAdd();
        user.password = 'AgingPassword';

        //TODO: additional validate email
        Meteor.call('addUser', user, function( error, result ){
            if( error ){
                alert('ERROR! ' + error );
            }else{
                alert('User was created!');
            }
        })
    }
});