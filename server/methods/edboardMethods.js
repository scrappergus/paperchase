Meteor.methods({
    addEdboardMember: function(member){
        return edboard.insert(member);
    },
    updateEdboardMember: function(mongoId, member){
        console.log('updateEdboardMember',mongoId, member)
        var fut = new future();

        edboard.schema.validate(member);

        if(!mongoId){
            // Add new article
            Meteor.call('addEdboardMember', member, function(error,result){
                if(error){
                    console.error('addEdboardMember',error);
                    fut.throw(error);
                }else if(result){
                    fut.return(result);
                }
            });
        }else if(mongoId){
            // Update existing
            edboard.update({'_id' : mongoId}, {$set: member}, function(error,result){
                if(result){
                    fut.return(true);
                }
            });
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    }
});