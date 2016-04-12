// Volume
// ----------------
Template.AdminVolume.events({
    'submit form': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        var issueOrder = [];
        var volumeId = Session.get('volume')._id;
        $('#volume-issues-list li').each(function(){
            issueOrder.push($(this).attr('id'));
        });
        Meteor.call('updateVolume',volumeId,{$set:{'issues':issueOrder}},function(updateError,updateRes){
            if(updateError){
                console.error('updateVolume ERROR', updateError);
                Meteor.formActions.error();
            }else if(updateRes){
                Meteor.formActions.success();
            }
        });
    }
});