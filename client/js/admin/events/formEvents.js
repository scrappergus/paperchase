// Forms - General
// ----------------
Template.successMessage.events({
    'click #close-success-msg': function(e){
        e.preventDefault();
        $('.success').addClass('hide');
    }
});
Template.Success.events({
    'click #close-success-msg': function(e){
        e.preventDefault();
        $('.success').addClass('hide');
    }
});
Template.SendingSuccessMessage.events({
    'click #close-success-msg': function(e){
        e.preventDefault();
        $('.success').addClass('hide');
    }
});