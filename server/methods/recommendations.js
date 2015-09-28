Meteor.methods({
	addReccomendation: function(doc){
		return recommendations.insert(doc);
	}
});