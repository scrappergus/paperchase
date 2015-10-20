Meteor.methods({
	registerDoiSet: function(piiList){
		piiList = piiList.substring(0, piiList.length - 1); //remove trailing comma
		var requestURL = doiConfig['api'] + journalConfig['short_name'] +'/' + piiList;
		var res;
		res = Meteor.http.get(requestURL + '?test=true');
		if(res && res.statusCode === 200){
			return true;
		}else{
			console.log(res);
			throw new Meteor.Error('Cannot register set');
		}
	},
	preprocessSubmission: function(articlesList){
		console.log('--preprocessSubmission');
		console.log(articlesList.length);
		if(articlesList){
			var fut = new future();
			var articlesList;
			var processed;
			for(var i = 0 ; i < articlesList.length ; i++){
				console.log('... '+i);
				var pmid = articlesList[i]['ids']['pmid'];
				console.log('     '+pmid);

				//check saved pub status against pubmed
				Meteor.call('getPubStatusFromPmid',pmid, function(error,result){
					if(error){
						console.log('ERROR - getPubStatusFromPmid');
						console.log(error);
						throw new Meteor.Error('ERROR - getPubStatusFromPmid', error);
					}
					if(result){
						articlesList[i]['pubmed_pub_status'] = result;
						if(i == parseInt(articlesList.length -1)){
							// if this is the last article we are checking, return
							processed = articlesList;
						}
					}else{
						throw new Meteor.Error('ERROR - getPubStatusFromPmid', 'No Result');
					}
				});
			}
			if(processed){
				console.log('processed');
				console.log(processed);
				fut['return'](processed);
			}
			return fut.wait();
		}
	},
	generateDateXml: function(date){
		var date = new Date(date);
		var xmlString = '';
		xmlString += '<Year>';
		xmlString +=  date.getFullYear();
		xmlString += '</Year>';
		xmlString += '<Month>';
		xmlString +=  parseInt(date.getMonth() + 1);
		xmlString += '</Month>';
		xmlString += '<Day>';
		xmlString +=  date.getDate();
		xmlString += '</Day>';
		return xmlString;
	},
	generateArticleCiteXml: function(articlePii){
		// console.log('..generateArticleXml ');
		var article = articles.findOne({'ids.pii':articlePii});
		var journalSettings = Meteor.call('getConfigJournal');
		if(article.length === 0){
			throw new Meteor.Error('xml-generation failed', 'Could not create article XML');
		}else{
			// console.log(article);
			var xmlString = '<Article><Journal><PublisherName>' + journalSettings['publisher']['name'] + '</PublisherName><JournalTitle>' + journalSettings['name'] + '</JournalTitle><Issn>' + journalSettings['issn'] + '</Issn>';
			xmlString += '<Volume>' + article.volume + '</Volume>';
			xmlString += '<Issue>' + article.issue + '</Issue>';

			//status and date
			if(article.pub_status === 4){
				xmlString += '<PubDate PubStatus="ppublish">';
			}else{
				xmlString += '<PubDate PubStatus="aheadofprint">';
			}
			xmlString += Meteor.call('generateDateXml',article.dates.epub);
			xmlString += '</PubDate>';


			xmlString += '</Journal>';

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
						xmlString += article.authors[a]['name_first'];
						xmlString += '</FirstName>';
					}
					if(article.authors[a]['name_middle']){
						xmlString += '<MiddleName>';
						xmlString += article.authors[a]['name_middle'];
						xmlString += '</MiddleName>';
					}
					if(article.authors[a]['name_last']){
						xmlString += '<LastName>';
						xmlString += article.authors[a]['name_last'];
						xmlString += '</LastName>';
					}
					if(article.authors[a]['affiliations_numbers']){
						xmlString += '<Affiliation>';
						for(var aff = 0 ; aff < article.authors[a]['affiliations_numbers'].length ; aff++){
							var authorAffNumber = article.authors[a]['affiliations_numbers'][aff];
							var authorAff = article.affiliations[authorAffNumber];
							authorAff = Meteor.call('xmlStringFix',authorAff);
							xmlString += authorAff;
						}
						xmlString += '</Affiliation>';
					}

					xmlString += '</Author>';
				}
				xmlString += '</AuthorList>';

				xmlString += '<PublicationType>' + article.article_type.type + '</PublicationType>'; //TODO: change to nlm type
			}

			//article ids
			xmlString += '<ArticleIdList>';
			var articleIds = article['ids'];
			for(var articleId in articleIds){
				//reset attribute value
				var articleIdType = articleId;
				if(articleIdType === 'pmid'){
					articleIdType = 'pubmed';
				}else if(articleIdType === 'pmc'){
					articleIdType = 'pmcid';
				}

				xmlString += '<ArticleId IdType="' + articleIdType + '">' + articleIds[articleId] + '</ArticleId>';

			}
			xmlString += '</ArticleIdList>';

			//article history
			xmlString += '<History>';
			var articleHistory = article['history'];
			for(var history in articleHistory){
				xmlString += '<PubDate PubStatus="' + history + '">';
				xmlString += Meteor.call('generateDateXml',articleHistory[history]);
				xmlString += '</PubDate>';
			}
			xmlString += '</History>';

			xmlString += '</Article>';
			// console.log(xmlString);

			return xmlString;
		}
	},
	articleSetCiteXmlValidation: function(submissionList, userId){
		//create a string of article xml, validate at pubmed, return any articles that failed
		console.log('--articleSetXmlValidation ');
		var fut = new future();
		var articleSetXmlString = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ArticleSet PUBLIC "-//NLM//DTD PubMed 2.0//EN" "http://www.ncbi.nlm.nih.gov:80/entrez/query/static/PubMed.dtd">';
		articleSetXmlString += '<ArticleSet>';
		for(var i = 0 ; i < submissionList.length; i++){
			var pii = submissionList[i]['ids']['pii'];
			// console.log('... '+i);
			Meteor.call('generateArticleCiteXml',pii,function(error,xmlString){
				if(error){
					console.log('ERROR - generateArticleCiteXml');
					console.log(error);
				}else{
					articleSetXmlString += xmlString;
					if(i === parseInt(submissionList.length -1)){
						//last article in set, validate at pubmed
						articleSetXmlString += '</ArticleSet>';
						Meteor.call('pubMedCiteCheck', articleSetXmlString, function(e, r){
							if(e){
								console.log('ERROR - pubMedCiteCheck');
								console.log(e);
								throw new Meteor.Error('pubMedCiteCheck: ERROR - Article Set Failed Validation', result.headers.location);
							}

							if(r){
								//all valid. save the xml set
								var today = new Date();
								var dd = today.getDay();
								var mm = today.getMonth()+1;
								var yyyy = today.getFullYear();
								var time = today.getTime();
								var fileName = mm + '_' + dd + '_' + yyyy + '_' + time + '.xml';
								Meteor.call('saveXmlCiteSet',articleSetXmlString,fileName);

								//update the submissions collection
								var created = new Date();
								var submissions_id = submissions.insert({'file_name' : fileName, 'created_by' : userId, 'created_date' : created});

								//update article docs
								Meteor.call('articlesStatusUpdate',submissionList, submissions_id, created);

								//return file name to redirect for download route
								fut['return'](fileName);
							}else{
								console.log('ERROR: XML Set NOT valid.');
								fut['return']('invalid');
							}
						});
					}
				}
			});
		}
		return fut.wait();
	},
	saveXmlCiteSet: function(xml,fileName){
		console.log('... saveXmlCiteSet');
		var fs = Meteor.npmRequire('fs');
		var filePath = process.env.PWD + '/xml-sets/' + fileName;
		fs.writeFile(filePath, xml, function (err) {
			if (err){
				return console.log(err);
			}else{
				// console.log('--saved ' + filePath);
			}
		});
	},
	articlesStatusUpdate: function(submissionList, submissions_id, created){
		for(var i=0 ; i< submissionList.length ; i++){
			var update = {
				'submission_id' : submissions_id,
				'created_date' : created,
				'pub_status' : parseInt(submissionList[i]['pub_status'])
			};
			Meteor.call('pushArticle', submissionList[i]['_id'], 'submissions', update);
		}
	},
	xmlStringFix: function(string){
		//&
		if(string.indexOf('&')!= -1){
			//make sure that it is not already fixed
			var check = string.substring(string.indexOf('&'), parseInt(string.indexOf('&')+2));
			if(check != '&a'){
				string = string.replace('&','&amp;');
			}
		}
		return string;
	}
});