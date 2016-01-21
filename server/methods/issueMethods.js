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
	},
	findIssueByVolIssue: function(vol, iss){
		return issues.findOne({'volume' : vol, 'issue': iss});
	},
	getIssueAndAssets: function(volume, issue){
		// console.log('...getIssueAndAssets v = ' + volume + ', i = ' + issue);
		var fut = new future();
		var issueData = issues.findOne({'issue': issue, 'volume': volume});
		// console.log(issueData);
		var issueArticles = Meteor.organize.getIssueArticlesByID(issueData['_id']);
		// console.log(issueArticles);
		// get assets
		for(var i=0 ; i< issueArticles.length ; i++){
			// console.log(issueArticles[i]['_id']);
			issueArticles[i]['assets'] = Meteor.call('articleAssests', issueArticles[i]['_id']);
			if(i == parseInt(issueArticles.length - 1)){
				issueData['articles']
				// console.log(issueData);
				fut['return'](issueData);
			}
		}

		issueData['articles'] = issueArticles;
		return fut.wait();
	},
	getAllIssues: function(){
		return issues.find().fetch();
	},
	getAllVolumes: function(){
		return volumes.find().fetch();
	}
});