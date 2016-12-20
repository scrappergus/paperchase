Meteor.methods({
        getEIC: function(){
            return edboard.find({role:"Editor-in-Chief"},{sort : {name_last:-1}}).fetch();
        },
        getFullBoard: function() {
            return edboard.find({$or: [{role:"Founding Editorial Board"}, {role:"Editorial Board"}]},{sort : {name_last:1}}).fetch();
        }
    });

