Meteor.methods({
	addReccomendation: function(doc){
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
		console.log('..notifyByEmail');
		console.log(doc);
		this.unblock();
		var message = 'Recommended By: ' + doc.name_first + ' ' + doc.name_last + '\r\n';
		message += '\r\n';
		message += doc.recommendation + '\r\n';
		message += '\r\n';
		message += 'View at: paperchase.oncotarget.com/admin/recommendation/'+doc.mongo_id;
		Email.send({
			to: 'agingnotifications@gmail.com',
			from: 'agingnotifications@gmail.com',
			subject: 'Subscription Recommendation',
			text: message
		});
	}
});