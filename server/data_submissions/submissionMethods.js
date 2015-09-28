
Meteor.methods({
	getArticlesForDataSubmission: function(type, parameters){
		console.log('--getArticlesForDataSubmission');
		// console.log(parameters);
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
						articlesList[i]['pubmed_pub_status'] = parseInt(result);
						articlesList[i]['pub_status_message'] = pubStatusTranslate[parseInt(result-1)]['message'];
						if(i == parseInt(articlesList.length -1)){
							processed = articlesList;
						}
					}
				});
			}
			if(processed){
				// console.log(processed);
				fut['return'](processed);
			}
		}else{
			throw new Meteor.Error('get-list-failed', 'No Articles Found');
		}

		//works but problem with the template updating the data
		return fut.wait();
	},
	generateArticleXml: function(articlePii){
		console.log('..generateArticleXml ');
		console.log(articlePii);
		var articleRes = articles.find({'ids.pii':articlePii});
		// console.log(article);
		var article = articleRes[0];
		if(articleRes.length === 0){
			throw new Meteor.Error('xml-generation failed', 'Could not create article XML');
		}else{
			console.log(article);
			var xmlString = '<Article><Journal><PublisherName>Impact Journals, LLC</PublisherName><JournalTitle>Aging</JournalTitle><Issn>1945-4589</Issn>';
			xmlString += '<Volume>' + article.volume + '</Volume>';
			xmlString += '<Issue>' + article.issue + '</Issue>';
			//status
			if(article.pub_statis === 4){
				xmlString += '<PubDate PubStatus="ppublish">';
			}else{
				xmlString += '<PubDate PubStatus="aheadofprint">';
			}
			// xmlString += '<Year>';
			// xmlString +=  moment(article.dates.epub, 'YYYY');
			// xmlString += '</Year>';
			// xmlString += '<Month>';
			// xmlString +=  moment(article.dates.epub, 'MM');
			// xmlString += '</Month>';
			// xmlString += '<Day>';
			// xmlString +=  moment(article.dates.epub, 'D');
			// xmlString += '</Day>';
			// xmlString += '</PubDate>';

			//PMID
			if(article.ids.pmid){
				xmlString += '<Replaces IdType="pubmed">' + article.ids.pmid + '</Replaces>';
			}

			//title
			xmlString += '<ArticleTitle>';
			xmlString += article.title;
			xmlString += '</ArticleTitle>';

			//pages
			xmlString += '<FirstPage>';
			xmlString += article.page_start;
			xmlString += '</FirstPage>';
			xmlString += '<LastPage>';
			xmlString += article.page_end;
			xmlString += '</LastPage>';

			xmlString += '<Language>EN</Language>';

			if(article.authors){
				xmlString += '<AuthorList>';
				for(var a = 0; a < article.authors.length ; a++){
					xmlString += '<Author>';
					if(article.authors[a]['name_first']){
						xmlString += '<FirstName>';
						xmlString += article.authors['name_first'];
						xmlString += '</FirstName>';
					}
					if(article.authors[a]['name_middle']){
						xmlString += '<MiddleName>';
						xmlString += article.authors['name_middle'];
						xmlString += '</MiddleName>';
					}
					if(article.authors[a]['name_last']){
						xmlString += '<LastName>';
						xmlString += article.authors['name_last'];
						xmlString += '</LastName>';
					}
					if(article.authors[a]['affiliations']){
						xmlString += '<Affiliation>';
						for(var aff = 0 ; aff < article.authors[a]['affiliations'].length ; aff++){
							xmlString += article.authors[a]['affiliations'][aff];
						}
						xmlString += '</Affiliation>';
					}

					xmlString += '</Author>';
				}
				xmlString += '</AuthorList>';

				xmlString += '<PublicationType>Journal Article</PublicationType>'; //TODO: change to nlm type
			}
			xmlString += '</Article>';
			Meteor.call('pubMedCiteCheck', xmlString, function(error, result){
				if(error){
					console.log('ERROR - pubMedCiteCheck');
					console.log(error);
				}else{
					console.log(result);
				}
			});

			return xmlString;
		}
	}
});