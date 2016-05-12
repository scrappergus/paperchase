Meteor.methods({
    updateAbout: function(aboutId, aboutData){

        var fut = new future();

        about.schema.validate(aboutData);

        if(aboutId){
            about.update({_id : aboutId} , {$set : aboutData}, function(error,result){
                if(error){
                    fut.throw(error);
                }else if(result){
                    fut.return(true);
                }
            });
        }else{
            about.insert(aboutData, function(error,result){
                if(error){
                    fut.throw(error);
                }else if(result){
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
})