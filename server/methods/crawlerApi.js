Meteor.methods({
	intiateArticleCollection: function(){
		console.log('..intiateArticleCollection');
		//for initiating articles collection. PII/PMID/Title sent from crawler
		// first make sure there are 0 docs
		if(articles.find().fetch().length == 0){
			var requestURL =  journalConfig.findOne().api.crawler + '/initiate_articles_collection/' + journalConfig.findOne().journal.short_name;
			Meteor.http.get(requestURL, function(error,result){
				if(error){
					console.error(error);
					throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , error);
				}else if(result){
					// combine with articles DB
					var articlesList = JSON.parse(result.content);
					for(var a=0 ; a<articlesList.length ; a++){
						if(articlesList[a]['ids']['pii']){
							articlesList[a]['ids']['paperchase_id'] = articlesList[a]['ids']['pii'];
						}else if(articlesList[a]['ids']['doi']){
							articlesList[a]['ids']['paperchase_id'] = articlesList[a]['ids']['doi'];
						}else{
							console.log('..missing IDS');
							console.log(articlesList[a]);
						}
						// console.log(articlesList[a]['ids']);
						Meteor.call('addArticle',articlesList[a],function(addError,articleAdded){
							if(addError){
								console.error('addError: ' + articlesList[a]['pii'], addError);
							}else if(articleAdded){
								console.log('added: '+ articleAdded);
							}
						});
					}
				}else{
					console.error('Could Not Initiate Articles Collection');
				}
			});
		}
	},
	getAllArticlesDoiStatus: function(){
		// console.log('..getAllArticlesDoiStatus');
		var fut = new future();
		var requestURL =  journalConfig.findOne().api.crawler + '/doi_status/' + journalConfig.findOne().journal.short_name;
		// console.log('requestURL = ' + requestURL);
		var registerURL =  journalConfig.findOne().api.doi + journalConfig.findOne().journal.short_name;
		Meteor.http.get(requestURL, function(error,result){
			if(error){
				console.error(error);
				fut['throw'](error);
				throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , error);
			}else if(result){
				// combine with articles DB
				var articlesDoiList = JSON.parse(result.content);
				fut['return'](articlesDoiList);
			}
		});

		return fut.wait();
	},
	getAllArticlesPmcXml: function(){
		console.log('..getAllArticlesPmcXml');
		var requestURL =  journalConfig.findOne().api.crawler + '/crawl_xml/' + journalConfig.findOne().journal.short_name;
		Meteor.http.get(requestURL, function(error,result){
			if(error){
				console.error(error);
				throw new Meteor.Error(503, 'ERROR: XML to S3' , error);
			}else if(result){
				console.log('All XML Saved',result);
			}
		});
	}
});