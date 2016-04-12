// Institutions
// ----------------
Template.AdminInstitution.events({
        'click .del-btn': function(e,t){
            Meteor.call('removeInstitution', this['_id'], function(error, result){
                });
        }
});
Template.AdminInstitutionAdd.events({
        'submit form': function(e,t){
            var formType = Session.get('formType');

            e.preventDefault();
            //        Meteor.formActions.saving();

            //commont to insert and update
            obj = {
                institution: $('[name=institution]').val()
                ,address: $('[name=address]').val()
            };

            Meteor.call('addInstitution', obj, function(error, result){
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
Template.AdminInstitutionForm.onCreated(function() {
    this.showIPFields = new ReactiveVar( false );
});

Template.AdminInstitutionForm.events({
        'click .edit-btn': function(e){
            $(".institution-form").show();
        }
        ,'click .del-btn': function(e,t){
            var mongoId = t.data.institution._id;
            Meteor.call('removeInstitution', mongoId, function(error, result){
                });
        }
        ,'click .add-ip-btn': function(e,t){
            t.showIPFields.set(true);
        }
        ,'click .cancel-new-ip-btn': function(e,t) {
            t.showIPFields.set(false);
        }
        ,'click .save-new-ip-btn': function(e,t) {
            var mongoId = t.data.institution._id;

            var obj = {
                'IPRanges': {startIP: $('.add-startIP').val(), endIP: $('.add-endIP').val()}
            };

            Meteor.call('addIPRangeToInstitution', mongoId, obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                        t.showIPFields.set(false);
                    }
                });

        }
        ,'click .del-ip-btn': function(e,t) {
            var mongoId = t.data.institution._id;
            console.log(this);
            console.log(mongoId);

            obj = {
                'IPRanges': this
            };

            Meteor.call('removeInstitutionIPRange', mongoId, obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });

        }
        ,'submit form': function(e,t){
            var formType = Session.get('formType');

            e.preventDefault();
            //        Meteor.formActions.saving();

            //commont to insert and update
            obj = {
                institution: $('[name=institution]').val()
                ,address: $('[name=address]').val()
            };

            var mongoId = t.data.institution._id;

            obj.IPRanges = [];

            $('.iprange-start').each(function(a,b,c) {
                    obj.IPRanges[a] = {startIP: $(this).val()};
                });

            $('.iprange-end').each(function(a,b,c) {
                    obj.IPRanges[a]['endIP'] = $(this).val();
                });


            Meteor.call('updateInstitution', mongoId, obj, function(error, result){
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
