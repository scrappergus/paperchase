Meteor.methods({
	addRecommendation: function(doc){
		var res = recommendations.insert(doc);
		if(res){
			doc.mongo_id = res;
			Meteor.call('notifyByEmail',doc);
		}
		return res;
	},
	updateRecommendation: function(doc,mongoId){
		if(doc.contacted){
			doc.contact_date = new Date();
		}
		return recommendations.update({'_id' : mongoId}, {$set:doc});
	},
	notifyByEmail: function(doc){
		this.unblock();
		var message = 'Institution: ' + doc.institution + '\r\n\r\n';
		message += 'Recommended By: ' + doc.name_first + ' ' + doc.name_last + '\r\n\r\n';

		if(doc.message){
			message += 'Message: ' + doc.message + '\r\n';
		}

		var address = Meteor.call('getConfigRecomendationEmailAddress');
		var siteUrl = Meteor.call('getConfigSiteUrl');

		message += 'View at: ' + siteUrl + '/admin/recommendation/'+doc.mongo_id;

		Email.send({
			to: address,
			from: address,
			subject: 'Subscription Recommendation',
			text: message
		});
	}
});