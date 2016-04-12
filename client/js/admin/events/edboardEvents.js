// Editorial Board
// ----------------
Template.AdminEditorialBoardForm.events({
    'submit form': function(e){
        Meteor.adminEdBoard.formGetData(e);
    }
});