//these were used to batch process and save XML from pmc
var piiFail = [];
Meteor.methods({
	getPmcIdFromPmid: function(articlePMID){
		var pmcId;
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
		var res;
		res = Meteor.http.get(requestURL);
		
		if(res){
			var articleIdList = res.data.result[articlePMID]['articleids'];
			var articleIdListL = articleIdList.length;
			for(var i = 0 ; i < articleIdListL ; i ++){
				if(articleIdList[i]['idtype'] === 'pmc'){
					// console.log(articleIdList[i]['value']);
					pmcId = articleIdList[i]['value'];
				}
			}	
		}
		return pmcId;
	},
	getPIIFromPmid: function(articlePMID){
		console.log('--getPIIFromPmid '+articlePMID);
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
		var res;
		res = Meteor.http.get(requestURL);
		
		if(res){
			var articleIdList = res.data.result[articlePMID]['articleids'];
			var articleIdListL = articleIdList.length;
			for(var i = 0 ; i < articleIdListL ; i ++){
				if(articleIdList[i]['idtype'] === 'pii'){
					return articleIdList[i]['value'];
				}
			}	
		}
	},
	getAllPii: function(){
		console.log('--getAllPii');
		var allArticles = articles.find().fetch();
		var articlesLength = allArticles.length;
		for(var i = 0 ; i < articlesLength ; i++){
			var articleIds = allArticles[i]['ids'];
			idsLength = articleIds.length;
			var pmid;
			for(var id = 0 ; id < idsLength ; id++){
				if(articleIds[id]['type'] === 'pmid'){
					pmid = articleIds[id]['id'];
				}
			}
			Meteor.call('getPIIFromPmid',pmid,function(error,pii){
				if(error){
					console.log('ERROR: Could not get PII');
					console.log(error);
				}else{
					Meteor.call('pushPiiArticle',allArticles[i]['_id'],pii,function(err,res){
						if(err){
							console.log('ERROR: Could not save PII '+allArticles[i]['_id']);
							piiFail.push(allArticles[i]['_id']);
							console.log(err);
						}
					});
				}
			});
		}
	}
})