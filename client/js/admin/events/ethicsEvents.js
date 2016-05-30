// Ethics
// ----------------
Template.AdminEthics.events({
    'click #add-section': function(e){
        Session.set('showForm',true);
        Session.set('sectionId', null);

        $('html, body').animate({
            scrollTop: $('#add-section-container').position().top
        }, 500);
    },
    'click .edit-section': function(e){
        e.preventDefault();
        var sectionId = $(e.target).attr('id');
        Session.set('sectionId',sectionId);
    },
    'click #save-section-order': function(e){
        e.preventDefault();
        var order = [];
        $('.sections-list li').each(function(){
            var sectionMongoId = $(this).attr('id').replace('section-title-','');
            order.push(sectionMongoId);
        });
        Meteor.call('updateList', 'ethics', order, function(error,result){
            if(error){
                console.log('error - updateList ethics');
                console.log(error);
            }
            if(result){
                Meteor.formActions.success();
            }
        });
    }
});
Template.AdminEthicsForm.events({
    'submit form': function(e){
        Meteor.formActions.saving();
        Meteor.adminEthics.formGetData(e);
    }
});

