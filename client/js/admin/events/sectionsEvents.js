// Sections
// ----------------
// Template.AdminSections.events({
//     'click .edit-section': function(e){
//         e.preventDefault();
//         var paperSectionId = $(e.target).closest('button').attr('id');
//         Session.set('paperSectionId',paperSectionId);
//     },
//     'click .btn-cancel': function(e){
//         e.preventDefault();
//         Session.set('paperSectionId',null);
//     }
// }); //moved to separate route
Template.AdminSectionsForm.events({
    'submit form': function(e){
        Meteor.formActions.saving();
        Meteor.adminSections.formGetData(e);
    }
});
