// Advance
// ----------------
Template.AdminAop.events({
    'click .submit': function(e){
        Meteor.adminAdvance.formGetData(e);
    }
});
