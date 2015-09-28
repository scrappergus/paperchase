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
});
