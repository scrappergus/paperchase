Meteor.methods({
        getContact: function(){
            return contact.findOne();
        }
    });
