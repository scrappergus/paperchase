fs = Meteor.npmRequire('fs');
parseString = Meteor.npmRequire('xml2js').parseString;
future = Npm.require('fibers/future');

Meteor.methods({
	addArticle: function(articleData){
		if(!articleData['issue_id']){
			var issueData = {
				'volume' : parseInt(articleData['volume']),
				'issue' : articleData['issue']
			}
			issueData['doc_updates'] = {};
			issueData['doc_updates']['created_date'] = new Date(); 
			issueData['doc_updates']['created_by'] = articleData['doc_updates']['created_by'];
			Meteor.call('addIssue',issueData, function(error,_id){
				if(error){
					console.log('ERROR: ' + error.message);
				}else{
					articleData['issue_id'] = _id;
				}
			});
		}
		return articles.insert(articleData);		
	},
	updateArticle: function(mongoId, articleData){
		return articles.update({'_id' : mongoId}, {$set: articleData});		
	},
	pushPiiArticle: function(mongoId, pii){
		//used for batch processing of XML from PMC
		return articles.update({'_id' : mongoId}, {$push: {'ids':{'type' : 'pii', 'id':pii}}});		
	},
	processXML: function(fileName){
		if(fileName)
		var j = {}, 
			xml;
		var fut = new future();

		var filePath = '/Users/jl/sites/paperchase/uploads/pmc_xml/';//TODO: add paths
		var file = filePath + fileName;
		fs.exists(file, function(fileok){
			if(fileok){
				fs.readFile(file, function(error, data) {
					if(data)
					xml = data.toString();
					if(error){
						return 'ERROR';
					}else{
						parseString(xml, function (err, result) {
							if(err){
								return 'ERROR';
							}else{

								//Process JSON for meteor templating and mongo db
								//TITLE
								var titleGroup = xml.substring(xml.lastIndexOf('<title-group>')+1,xml.lastIndexOf('</title-group>'));
								var titleTitle = titleGroup.substring(titleGroup.lastIndexOf('<article-title>')+1,titleGroup.lastIndexOf('</article-title>'));
								titleTitle = titleTitle.replace('article-title>','').replace('<italic>','<i>').replace('</italic>','</i>');
								var articleJSON = result['pmc-articleset']['article'][0]['front'][0]['article-meta'][0];
								j['title'] = titleTitle; 

								j['volume'] = parseInt(articleJSON['volume'][0]);
								j['issue'] = parseInt(articleJSON['issue'][0]);
								j['page_start'] = articleJSON['fpage'][0];
								j['page_end'] = articleJSON['lpage'][0];

								//KEYWORDS
								if(articleJSON['kwd-group']){
									j['keywords'] =  articleJSON['kwd-group'][0]['kwd'];	
								}
								

								//ARTICLE TYPE
								//TODO: These are nlm type, possible that publisher has its own type of articles
								//TODO: Update article type collection if this type not present
								j['article_type'] = {};
								j['article_type']['type'] = articleJSON['article-categories'][0]['subj-group'][0]['subject'];
								j['article_type']['short_name'] = result['pmc-articleset']['article'][0]['$']['article-type'];


								//IDS
								j['ids'] = [];
								var idList = articleJSON['article-id'];
								var idListLength = idList.length;
								for(var i = 0 ; i < idListLength ; i++){
									var articleId = {};
									var type = idList[i]['$']['pub-id-type'];
									var idCharacters = idList[i]['_'];
									articleId['type'] = type;
									articleId['id'] = idCharacters;
									j['ids'].push(articleId);
								}
								//AUTHORS
								if(articleJSON['contrib-group']){
									j['authors'] = [];
									var authorsList = articleJSON['contrib-group'][0]['contrib'];
									var authorsListLength = authorsList.length;
									for(var i = 0 ; i < authorsListLength ; i++){
										var author = {};
										var name_first = authorsList[i]['name'][0]['given-names'];
										var name_last = authorsList[i]['name'][0]['surname'];
										author['name_first'] = name_first;
										author['name_last'] = name_last;
										j['authors'].push(author);
									}									
								}


								//PUB DATES
								j['dates'] = []
								var dates = articleJSON['pub-date'];
								var datesLength = dates.length;
								for(var i = 0 ; i < datesLength ; i++){
									var date = {};
									date['type'] = dates[i]['$']['pub-type'];
									if(dates[i]['day']){
										date['day'] = dates[i]['day'][0];
									}
									if(dates[i]['month']){
										date['month'] = dates[i]['month'][0];
									}
									if(dates[i]['year']){
										date['year'] = dates[i]['year'][0];
									}
									j['dates'].push(date);
								}

								//HISOTRY DATES
								if(articleJSON['history']){
									j['history'] = []
									var history = articleJSON['history'][0]['date'];
									var historyLength = history.length;
									for(var i = 0 ; i < historyLength ; i++){
										var dateH = {};
										dateH['type'] = history[i]['$']['date-type'];
										if(history[i]['day']){
											dateH['day'] = history[i]['day'][0];
										}
										if(history[i]['month']){
											dateH['month'] = history[i]['month'][0];
										}
										if(history[i]['year']){
											dateH['year'] = history[i]['year'][0];
										}
										j['history'].push(dateH);
									}									
								}

								// console.log(j);

								fut['return'](j);	//this what is returned. j = is the fixed json.
							}
						});
						
					}

				});
			}else{
				console.log('file not found');
			}
		});
		return fut.wait();
	}
})

