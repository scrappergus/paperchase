
Meteor.methods({
	getArticlesForDataSubmission: function(type, parameters){
		console.log('--getArticlesForDataSubmission');
		console.log(parameters);
		var fut = new future();
		var articlesList;
		var processed;
		if(type === 'issue'){
			articlesList = articles.find({'issue_id':parameters}).fetch();
		}else{
			articlesList = articles.find({'ids.pii':{'$in':parameters}}).fetch();
		}
		//get pubstatus
		if(articlesList.length != 0){
			for(var i = 0 ; i < articlesList.length ; i++){
				var pmid = articlesList[i]['ids']['pmid'];
				Meteor.call('getPubStatusFromPmid',pmid, function(error,result){
					if(error){
						console.log('ERROR - getPubStatusFromPmid');
						console.log(error);
					}else{
						articlesList[i]['pubmed_pub_status'] = result;
						articlesList[i]['pub_status_message'] = pubStatusTranslate[parseInt(result-1)]['message'];
						if(i == parseInt(articlesList.length -1)){
							processed = articlesList;
						}
					}
				});
			}
			if(processed){
				console.log(processed);
				fut['return'](processed);
			}			
		}else{
			throw new Meteor.Error('get-list-failed', 'No Articles Found');
		}
		
		//works but problem with the template updating the data
		return fut.wait();	
	}
});