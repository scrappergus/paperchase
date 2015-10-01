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
	getPiiFromPmid: function(articlePMID){
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
		var res;
		res = Meteor.http.get(requestURL);

		if(res){
			var articleIdList = res.data.result[articlePMID]['articleids'];
			var articleIdListL = articleIdList.length;
			for(var i = 0 ; i < articleIdListL ; i ++){
				if(articleIdList[i]['idtype'] === 'pii'){
					//fix for articles misindexed at pubmed
					var val = articleIdList[i]['value'];
					if(val.indexOf('html') != -1){
						var valPieces = val.split('/');
						val = valPieces[valPieces.length -1].replace('.html','');
					}
					return val;
				}
			}
		}
	},
	getPubStatusFromPmid: function(pmid){
		// console.log('--getPubStatusFromPmid');
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + pmid;
		var res;
		res = Meteor.http.get(requestURL);

		if(res){
			var articlePubStatus = res.data.result[pmid]['pubstatus'];
			return articlePubStatus;
		}
	},
	pubMedCiteCheck: function(xml){
		// console.log('--pubMedCiteCheck');
		var fut = new future();
		var url = 'http://www.ncbi.nlm.nih.gov';

		//post xml string to pubmed, response will provide redirect url. In the redirect, we check the content for valid message
		Meteor.http.post(url + '/pubmed/citcheck/',{
			params: {
				hfiletext: xml
			}
		}, function(error,result){
			if(error){
				console.log('ERROR - pubMedCiteCheck');
				console.log(error);
			}else{
				var goToUrl = url + result.headers.location;
				Meteor.http.get(goToUrl, function(e,r){
					if(e){
						console.log('pubMedCiteCheck get: ERROR - pubMedCiteCheck follow location');
						console.log(e);
						throw new Meteor.Error('pubMedCiteCheck get: COULD NOT follow location', result.headers.location);
					}else{
						var validXml = r.content.indexOf('Your document is valid');
						if(validXml != -1){
							console.log('valid');
							fut['return'](true);
						}else{
							console.log('NOT valid');
							fut['return'](false);
							throw new Meteor.Error('pubMedCiteCheck get: ERROR - Article Set Failed Validation', result.headers.location);
						}
					}
				})
			}
		});
		return fut.wait();
	}
})