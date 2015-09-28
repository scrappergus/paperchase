Meteor.methods({
	addReccomendation: function(doc){
		return recommendations.insert(doc);
	},
	updateRecommendation: function(doc,mongoId){
		if(doc.contacted){
			doc.contact_date = new Date();
		}
		return recommendations.update({'_id' : mongoId}, {$set:doc});
	}
});