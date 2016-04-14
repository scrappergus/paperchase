Meteor.methods({
    addInstitution: function(data){
        return institutions.insert(data);
    }
    ,updateInstitution: function(mongoId, data){
        return institutions.update({'_id' : mongoId}, {$set: data});
    }
    ,removeInstitution: function(id){
        return institutions.remove({'_id': id});
    }
    ,addIPRangeToInstitution: function(id, data){
        return institutions.update({'_id': id}, {$push: data});
    }
    ,removeInstitutionIPRange: function(id, data){
        return institutions.update({'_id': id}, {$pull: data}, {multi:true});
    }
});
