Meteor.methods({
	addIssue: function(issueData){
		return issues.insert(issueData);
	}
});