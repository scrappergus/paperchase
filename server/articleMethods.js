fs = Meteor.npmRequire('fs');
parseString = Meteor.npmRequire('xml2js').parseString;
future = Npm.require('fibers/future');

Meteor.methods({
	processXML: function(fileName){
		var j = {}, 
			xml;
		var fut = new future();

		var filePath = '/Users/jl/sites/paperchase/uploads/xml/';//TODO: add paths
		var file = filePath + fileName;
		fs.exists(file, function(fileok){
			if(fileok){
				fs.readFile(file, function(error, data) {
					xml = data.toString();
					if(error){
						return 'ERROR';
					}else{
						parseString(xml, function (err, result) {
							if(err){
								return 'ERROR';
							}else{
								var articleJSON = result['pmc-articleset']['article'][0]['front'][0]['article-meta'][0];

								//Process JSON for meteor templating and mongo db
								j['title'] = articleJSON['title-group'][0]['article-title'][0];
								j['articleType'] = articleJSON['article-categories'][0]['subj-group'][0]['subject'];
								j['volume'] = parseInt(articleJSON['volume'][0]);
								j['issue'] = articleJSON['issue'][0];
								j['page_start'] = articleJSON['fpage'][0];
								j['page_end'] = articleJSON['lpage'][0];
								j['keywords'] =  articleJSON['kwd-group'][0]['kwd'];

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

