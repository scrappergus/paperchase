// About
// ----------------
Template.AdminAbout.events({
    'click #add-about-section': function(e){
        Session.set('showAboutForm',true);
        Session.set('aboutSectionId', null);

        $('html, body').animate({
            scrollTop: $('#add-about-section-container').position().top
        }, 500);
    },
    'click .edit-section': function(e){
        e.preventDefault();
        var sectionId = $(e.target).attr('id');
        // console.log(sectionId);
        Session.set('aboutSectionId',sectionId);
    },
    'click #save-about-section-order': function(e){
        e.preventDefault();
        var order = [];
        $('.sections-list li').each(function(){
            var sectionMongoId = $(this).attr('id').replace('section-title-','');
            order.push(sectionMongoId);
        });
        // console.log(order);
        Meteor.call('updateList', 'about', order, function(error,result){
            if(error){
                console.log('error - updateList about');
                console.log(error);
            }
            if(result){
                Meteor.formActions.success();
            }
        });
    }
});
Template.AdminAboutForm.events({
    'submit form': function(e){
        Meteor.formActions.saving();
        Meteor.adminAbout.formGetData(e);
    }
});