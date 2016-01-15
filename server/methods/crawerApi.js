Meteor.methods({
	getAllArticlesDoiStatus: function(){
		// console.log('..getAllArticlesDoiStatus');
		var fut = new future();
		var requestURL =  journalConfig.findOne().api.crawler + '/doi_status/' + journalConfig.findOne().journal.short_name;
		Meteor.http.get(requestURL, function(error,result){
			if(error){
				console.error(error);
				fut['throw'](error);
				throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , error);
			}else if(result){
				// combine with articles DB
				var articlesDoiList = JSON.parse(result.content);
				for(var a=0 ; a<articlesDoiList.length ; a++){
					var pii = articlesDoiList[a]['pii'];
					var articleInfo = articles.findOne({'ids.pii': pii},{'dates.epub' : 1, 'ids' : 1});
					if(articleInfo){
						if(articleInfo.dates && articleInfo.dates.epub){
							articlesDoiList[a]['epub'] = articleInfo.dates.epub;
						}
						if(articleInfo['ids']['pmc']){
							articlesDoiList[a]['pmc'] = articleInfo['ids']['pmc'];
						}
						if(articleInfo['ids']['pmid']){
							articlesDoiList[a]['pmid'] = articleInfo['ids']['pmid'];
						}
					}else{
						console.log('DB Missing PII ' + pii);
					}
				}

				fut['return'](articlesDoiList);
			}
		});

		return fut.wait();
	}
});