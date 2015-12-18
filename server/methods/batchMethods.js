Meteor.methods({
	batchUpdateXml: function(journal,cb){
		var fut = new future();
		console.log('..batchUpdateXml : ' + journal);
		var xmlCrawlUrl = journalConfig.findOne().api.crawler_xml; // LIVE
		// console.log('xmlCrawlUrl = ' + xmlCrawlUrl);
		// var xmlCrawlUrl = 'http://localhost:4932/crawl_xml'; // LOCAL
		var res,
			articlesList;
		Meteor.http.get(xmlCrawlUrl + '/' + journal,function(err, res) {
			if(err){
				// console.error('ERROR');
				// console.error(err);
				fut['throw'](err);
				throw new Meteor.Error(503, 'ERROR: Crawl XML' , err);
			}
			if(res && res.data){
				// Loop through all articles in response and update the xml collection in the DB
				articlesList = res.data;
				var updatedCount = 0;
				if(articlesList.length > 1){
					for(var i=0 ; i<articlesList.length ; i++){

						var updated;
						if(articlesList[i]){
							console.log(JSON.stringify(articlesList[i]));
							// console.log()
							var articleIds = articlesList[i]['ids'];
							updated = xmlCollection.update({ids: {'$in': articleIds}},{$set:articlesList[i]},{upsert: true});
						}
						// keep track of successful updates
						if(updated){
							updatedCount++;
						}
						if (i == parseInt(articlesList.length-1) && updatedCount == articlesList.length){
							// if last article and all succesfully updated
							fut['return'](true);
						}else if(i == parseInt(articlesList.length-1)){
							// if last article and not all succesfully updated
							var errorMessage = 'total = ' + articlesList.length + ', updated = ' + updated;
							console.error('ERROR : ' + errorMessage);
							fut['throw'](errorMessage);
							throw new Meteor.Error(500, 'Error 500: Not all articles updated in database', errorMessage);
						}
					}
				}else{
					// No articles were updated
					console.error('No article XML was updated in crawl');
					fut['return'](true);
				}

			}
		});
		return fut.wait();
	}
});