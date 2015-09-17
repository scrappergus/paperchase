Meteor.methods({
	addIssue: function(issueData){
		//check if volume exists, if not add
		var vol;
		vol = volumes.findOne({'volume':issueData['volume']});
		if(!vol){
			Meteor.call('addVolume',issueData['volume'], function(error,_id){
				if(error){
					console.log('ERROR: ' + error.message);
				}
			});
		}
		return issues.insert(issueData);
	},
	addVolume: function( vol){
		return volumes.insert({'volume':vol});
	}
});