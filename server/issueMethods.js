Meteor.methods({
	addIssue: function(issueData){
		//check if volume exists, if not add
		var vol, 
			iss, 
			issueId;
		issueData['issue'] = parseInt(issueData['issue']);
		issueData['volume'] = parseInt(issueData['volume']);
		vol = volumes.findOne({'volume':issueData['volume']});
		//double check that issue does not exit 
		iss = issues.findOne({'volume':issueData['volume'],'issue':issueData['issue']});

		if(!iss){
			issueId = issues.insert(issueData);
		}else{
			issueId = iss['_id'];
		}
		if(!vol){
			Meteor.call('addVolume',issueData['volume'], function(error,_id){
				if(error){
					console.log('ERROR: ' + error.message);
				}
			});
		}
		return issueId;
	},
	updateIssue: function(mongoId, update){
		return issues.update({'_id':mongoId},{$set:update})
	},
	addVolume: function( vol){
		return volumes.insert({'volume':vol});
	}
});