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
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=' + pmid;
		var res;
		res = Meteor.http.get(requestURL);
		if(res){
			var xml = res.content;
			var articlePubStatus = xml.substring(xml.lastIndexOf('<PublicationStatus>')+19,xml.lastIndexOf('</PublicationStatus>'));
			// console.log(articlePubStatus);
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
	},
	getPubMedId: function(article){
		// console.log('...getPubMedId ');
		var fut = new future();
		var pubMedUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/';
		var pmidVerified,
			query = [],
			pmid = '',
			resultHtml,
			doc,
			pmidElement;
		// console.log(article.title);
		// using title, authors, etc query PubMed to get article PMID, which will then be the URL for the article
		if(article.title){
			// title = for double check
			// require title because this is what we will use to verify that the PMID retrieved is correct.

			for(var key in article){
				var v = article[key];
				// console.log(v);
				if(typeof v == Array){
					v = v.join('+');
				}

				query.push(v);
			}
			query = query.join('+').replace(/\s+/g, '+');;
			// console.log('query');console.log(query);
			Meteor.http.get(pubMedUrl + '?term=' + query, function(error,result){
				if(error){
					console.log('error');
					console.log(error);
				}
				if(result){
					resultHtml = result.content;
					doc = new dom().parseFromString(resultHtml);
					pmidElement = doc.getElementById('absid');
					if(pmidElement){
						for(var attr=0 ; attr < pmidElement.attributes.length ; attr++){
							// if()
							// console.log(pmid.attributes[attr].localName);
							if(pmidElement.attributes[attr].localName == 'value' && pmidElement.attributes[attr].nodeValue){
								pmid = pmidElement.attributes[attr].nodeValue;
							}
						}

						// Verify that PMID is correct
						if(pmid){
							pmidVerified = Meteor.call('verifyPmid',pmid,article.title);
							if(pmidVerified){
								fut['return'](pmid);
							}else{
								fut['return'](false);
							}
						}else{
							fut['return'](false);
						}

					}
				}else{
					// return false;
					// initial query using article data did not return a pmid
					fut['return'](false);
				}
			});
		}
		return fut.wait();
	},
	verifyPmid: function(pmid,title){
		// console.log('..verifyPmid = ' + pmid);
		var fut = new future();
		var pubMedUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/';
		var resultTitle = '',
			resultHtml,
			doc,
			resultTitleElement,
			resultTitle;
		// after querying PubMed for ID, verify that titles match
		Meteor.http.get(pubMedUrl + pmid, function(error,result){
			if(error){
				console.log('error');
				console.log(error);
			}
			if(result){
				// title match check
				resultHtml = result.content;
				doc = new dom().parseFromString(resultHtml);
				resultTitleElement = doc.getElementsByTagName('title');
				resultTitle = resultTitleElement[0].firstChild.nodeValue.replace('.  - PubMed - NCBI\n','');
				if(title == resultTitle){
					// console.log('MATCH! = ' + pmid);console.log(resultTitle);
					fut['return'](true);
				}else{
					fut['return'](false);
				}

			}
		});
		return fut.wait();
	}
});