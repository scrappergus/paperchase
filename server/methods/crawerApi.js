Meteor.methods({
	getAllArticlesDoiStatus: function(){
		console.log('..getAllArticlesDoiStatus');
		var fut = new future();
		var requestURL =  journalConfig.findOne().api.crawler + '/doi_status/' + journalConfig.findOne().journal.short_name;
		Meteor.http.get(requestURL, function(error,result){
			if(error){
				console.error(error);
				fut['throw'](err);
				throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , err);
			}else if(result){
				console.log(result.content);
				fut['return'](JSON.parse(result.content));
			}
		});

		return fut.wait();
	}
});