// All of these methods are for admin article
Meteor.methods({
	addArticle: function(articleData){
		// console.log('--addArticle | pmid = '+articleData['ids']['pmid']);

		if(articleData['authors']){
			var authorsList = articleData['authors'];
			for(var author = 0 ; author < authorsList.length; author++){
				//check if author doc exists in authors collection
				var authorDoc;
				authorsList[author]['ids'] = {};
				authorDoc = authors.findOne({'name_first' : authorsList[author]['name_first'],'name_last' : authorsList[author]['name_last']});
				if(!authorDoc){
					//INSERT into authors
					Meteor.call('addAuthor',authorsList[author],function(error, mongo_id){
						if(error){
							console.log('ERROR');
							console.log(error);
						}else{
							authorsList[author]['ids']['mongo_id'] = mongo_id;
						}
					});
				}else{
					//author doc already exists
					authorsList[author]['ids']['mongo_id'] = authorDoc['_id'];
				}
			}
		}

		//INSERT into articles colection
		return articles.insert(articleData);
	},
	updateArticle: function(mongoId, articleData, batch){
		// console.log('--updateArticle |  mongoId = ' + mongoId);
		var duplicateArticle;
		if(!mongoId){
			// New Article
			// make sure article does not already exist
			// TODO: loose title check
			duplicateArticle = articles.findOne({title : articleData.title});
		}
		if(!mongoId && !duplicateArticle){
			// Add new article
			return Meteor.call('addArticle', articleData);
		}else if(mongoId){
			// Update existing
			articleData.batch = batch;
			return articles.update({'_id' : mongoId}, {$set: articleData});
		}else{
			throw new Meteor.Error('ERROR: Duplicate Article - ' + duplicateArticle._id);
		}
	},
	pushArticle: function(mongoId, field, articleData){
		var updateObj = {};
		updateObj[field] = articleData;
		return articles.update({'_id' : mongoId}, {$push: updateObj});
	},
	updateArticleByPmid: function(pmid, articleData){
		// console.log('--updateArticleByPmid |  pmid = '+pmid);
		return articles.update({'ids.pmid' : pmid}, {$set: articleData});
	},
	addToArticleAffiliationsByPmid: function(pmid, affiliation){
		// console.log('--addToArticleAffiliationsByPmid | pmid = ' + pmid  + ' / affiliation = ' + affiliation);
		return  articles.update({'ids.pmid' : pmid}, {$addToSet: {'affiliations' : affiliation}});
	},
	pushPiiArticle: function(mongoId, ids){
		//used for batch processing of XML from PMC
		return articles.update({'_id' : mongoId}, {$set: {'ids' : ids}});
	},
	processXML: function(fileName,batch){
		// for importing XML to DB
		// TODO: verify this is still working after moving processing to new function, processXmlFile
		if(fileName)
		var xmlString;
		var fut = new future();

		var filePath = '/Users/jl/sites/paperchase/uploads/xml/';//TODO: add paths
		if(batch){
			filePath = '/Users/jl/sites/paperchase/uploads/xml/';
		}

		var file = filePath + fileName;
		fs.exists(file, function(fileok){
			if(fileok){
				fs.readFile(file, function(error, data) {
					if(data)
					xmlString = data.toString();
					if(error){
						throw new Meteor.Error(500, 'Cannot read XML' , error);
					}else{
						Meteor.call('processXmlString',xmlString,function(error,result){
							if(error){
								throw new Meteor.Error(500, 'Cannot process XML' , error);
							}
							if(result){
								fut['return'](result);
							}
						});
					}
				});
			}else{
				console.log('file not found');
			}
		});
		return fut.wait();
	},
	articleXmlToJson: function(xml,articleJson){
		// Process JSON for meteor templating and mongo db
		// xml - xml string
		// articleJson - parsed XML to JSON. but not in the schema we need.

		var article = articleJson[0]['front'][0]['article-meta'][0];
		var articleProcessed = {};
		// TITLE
		// -----------
		var titleGroup = xml.substring(xml.lastIndexOf('<title-group>')+1,xml.lastIndexOf('</title-group>'));
		var titleTitle = titleGroup.substring(titleGroup.lastIndexOf('<article-title>')+1,titleGroup.lastIndexOf('</article-title>'));
			titleTitle = titleTitle.replace('article-title>','');
			titleTitle = Meteor.adminBatch.cleanString(titleTitle);
		articleProcessed['title'] = titleTitle;


		articleProcessed['volume'] = parseInt(article['volume'][0]);
		articleProcessed['issue'] = parseInt(article['issue'][0]);
		articleProcessed['page_start'] = parseInt(article['fpage'][0]);
		articleProcessed['page_end'] = parseInt(article['lpage'][0]);

		// KEYWORDS
		// -----------
		if(article['kwd-group']){
			articleProcessed['keywords'] =  article['kwd-group'][0]['kwd'];
		}

		// ABSTRACT
		// -----------
		if(article['abstract']){
			var abstract = xml.substring(xml.lastIndexOf('<abstract>')+1,xml.lastIndexOf('</abstract>'));
				abstract = abstract.replace('abstract>\n ', '');
				// abstract = abstract.replace('</p>\n','</p>');
				abstract = abstract.replace(/<\/p>/g,'');
				abstract = abstract.replace(/<p>/g,'');
				abstract = abstract.replace(/^[ ]+|[ ]+$/g,'');
				abstract = Meteor.adminBatch.cleanString(abstract);
				articleProcessed['abstract'] = abstract;
		}

		// ARTICLE TYPE
		// -----------
		//TODO: These are nlm type, possible that publisher has its own type of articles
		//TODO: Update article type collection if this type not present
		if(article['article-categories']){
			articleProcessed['article_type'] = {};
			articleProcessed['article_type']['name'] = article['article-categories'][0]['subj-group'][0]['subject'][0];
			articleProcessed['article_type']['short_name'] =  articleJson[0]['$']['article-type'];
		}

		// IDS
		// -----------
		articleProcessed['ids'] = {};
		var idList = article['article-id'];
		var idListLength = idList.length;
		for(var i = 0 ; i < idListLength ; i++){
			var type = idList[i]['$']['pub-id-type'];
			var idCharacters = idList[i]['_'];
			articleProcessed['ids'][type] = idCharacters;
		}
		// PII required!
		// -----------
		if(!articleProcessed['ids']['pii']){
			throw new Meteor.Error('XML is missing PII.');
		}

		// AUTHORS
		// -----------
		if(article['contrib-group']){
			articleProcessed['authors'] = [];
			var authorsList = article['contrib-group'][0]['contrib'];
			var authorsListLength = authorsList.length;
			for(var i = 0 ; i < authorsListLength ; i++){
				var author = {};
				var name_first = authorsList[i]['name'][0]['given-names'][0];
				var name_last = authorsList[i]['name'][0]['surname'][0];
				author['name_first'] = name_first;
				author['name_last'] = name_last;
				articleProcessed['authors'].push(author);
			}
		}

		// PUB DATES
		// -----------
		articleProcessed['dates'] = {}
		var dates = article['pub-date'];
		var datesLength = dates.length;
		for(var i = 0 ; i < datesLength ; i++){
			var dateType =  dates[i]['$']['pub-type'];
			var d = '';
			var hadDay = false;
			if(dates[i]['month']){
				d += dates[i]['month'][0] + ' ';
			}
			if(dates[i]['day']){
				d += dates[i]['day'][0] + ', ';
				hadDay = true;
			}else{
				//usually for type collection
				d += 1 + ', ';
			}
			if(dates[i]['year']){
				d += dates[i]['year'][0];
			}
			if(hadDay){
				//gonna use time of the day to differentiate dates that had this and didn't
				d += ' 00:00:00 EST';
			}else{
				d += ' 12:00:00 EST';
			}
			var dd = new Date(d);
			// console.log(dateType + ' = ' + dd);
			articleProcessed['dates'][dateType] = dd;
		}

		// HISTORY DATES
		// -----------
		if(article['history']){
			articleProcessed['history'] = {};
			var history = article['history'][0]['date'];
			var historyLength = history.length;

			for(var i = 0 ; i < historyLength ; i++){
				var dateType = history[i]['$']['date-type'];
				var d = '';
				if(history[i]['month']){
					d += history[i]['month'][0] + ' ';
				}
				if(history[i]['day']){
					d += history[i]['day'][0] + ', ';
				}
				if(history[i]['year']){
					d += history[i]['year'][0] + ' ';
				}
				var dd = new Date(d);
				articleProcessed['history'][dateType] = dd;
			}
		}

		// console.log(articleProcessed);
		return articleProcessed;
	},
	processXmlString: function(xml){
		// console.log('..processXmlString');
		var articleProcessed;
		var articlePreProcess;
		var fut = new future();
		parseString(xml, function (error, result) {
			if(error){
				console.error('ERROR');
				console.error(error);
				return 'ERROR';
			}else{
				// IF XML parsed into string then get article info into JSON
				if(result['pmc-articleset']){
					// if getting XML via crawling PMC
					// Or if uploading PMC XML
					articlePreProcess = result['pmc-articleset']['article'];
					articleProcessed = Meteor.call('articleXmlToJson', xml, articlePreProcess,function(e,r){ // pass XML string (for title) AND JSON for meta
						if(e){
							console.error(e);
							fut['throw'](e);
						}
						if(r){
							fut['return'](r);
						}
					});
				}else{
					// could be PubMed XML
					// or another dtd
					fut['throw']('Could not process XML. XML must be PMC XML, not PubMed XML.');
				}
			}
		});
		return fut.wait();
	},
	articleIssueVolume: function(volume,issue){
		// console.log('....articleIssueVolume v = ' + volume + ', i = ' + issue );
		// if article in issue:
		// 1. check if issue exists in issues collection. If not add. If issue exists or added, issue Mongo ID returned
		// 2. include issue Mongo id in article doc
		var issueInfo,
			issueId;
		if(volume && issue){
			// Does issue exist?
			issueInfo = Meteor.call('findIssueByVolIssue', volume, issue);
			if(issueInfo){
				issueId = issueInfo['_id'];
			}else{
				// This also checks volume collection and inserts if needed.
				issueId = Meteor.call('addIssue',{
					'volume': volume,
					'issue': issue
				});
			}
		}
		// console.log(issueId);
		return issueId;
	},
	preProcessArticle: function(articleId,article){
		// Article Form: On - Article Form & Data Submissions
		// article = parsed XML from S3 after upload
		console.log('..preProcessArticle = ' + articleId);

		var articleByPii,
			articleFromDb;

		// For when editing an article,
		// else after uploading XML and parsed article is passed to this function
		if(!article){
			article = articles.findOne({'_id': articleId});
		}else{
			// Compare XML and Database
			// Article exists in the database and this string is from the parsed XML uploaded to S3
			articleFromDb = articles.findOne({'_id': articleId});
			article = Meteor.call('compareProcessedXmlWithDb',article,articleFromDb);
		}

		articleByPii = articles.findOne({'ids.pii':articleId});
		if(!article && !articleByPii){
			article = {}; // For a new article
		}
		if(!articleId){
			article = {}; // For a new article
		}

		if(article){
			// For editing an existing article
			// or after uploading XML and updating an existing article's DB info

			// Affiliations
			// ------------
			// add ALL affiliations for article to author object,
			// needed for author affiliation checkbox input
			var affs;
			affs = article.affiliations;
			if(article.authors){
				var authorsList = article.authors;
				for(var i=0 ; i < authorsList.length; i++){
					var current = authorsList[i]['affiliations_numbers'];
					var authorAffiliationsEditable = [];
					if(authorsList[i]['ids'] && authorsList[i]['ids']['mongo_id']){
						var mongo = authorsList[i]['ids']['mongo_id'];
					}else{
						//for authors not saved in the db
						var mongo = Math.random().toString(36).substring(7);
					}

					if(affs){
						for(var a = 0 ; a < affs.length ; a++){
							var authorAff = {
								author_mongo_id: mongo
							}
							if(current && current.indexOf(a) != -1){
								// author already has affiliation
								authorAff['checked'] = true;
							}else{
								authorAff['checked'] = false;
							}
							authorAffiliationsEditable.push(authorAff);
						}
						authorsList[i]['affiliations_list'] = authorAffiliationsEditable;
					}
				}
			}

			// Issues
			// ------
			// get ALL issues and volumes for list options and organize by volume
			var volumesList = Meteor.call('getAllVolumes');
			var issuesList = Meteor.call('getAllIssues');
			if(article.issue_id){
				// console.log('issue_id = ' + article.issue_id);
				for(var i=0 ; i<issuesList.length ; i++){
					if(issuesList[i]['_id'] === article.issue_id){
						issuesList[i]['selected'] = true;
					}
				}
			}
			article.volumes = Meteor.organize.issuesIntoVolumes(volumesList,issuesList);

			// Pub Status
			// ----------
			article['pub_status_list'] = pubStatusTranslate;
			// var statusFound = false;
			// if(article['pub_status']){
			// 	var pubStatusDisable = true;
			// }
			for(var p = 0; p < pubStatusTranslate.length; p++){
				if(article['pub_status_list'][p]['abbrev'] == article['pub_status']){
					article['pub_status_list'][p]['selected'] = true;
					// statusFound = true;
				}
				// if(!statusFound){
				// 	article['pub_status_list'][p]['disabled'] = true;
				// }
			}

			// Article Type
			// ------------
			// add ALL article types
			var articleType;
			if(article['article_type']){
				articleType = article['article_type']['name'];
			}
			article['article_type_list'] = [];
			var publisherArticleTypes = articleTypes.find().fetch();
			for(var k =0 ; k < publisherArticleTypes.length ; k++){
				var selectObj = {
					nlm_type: publisherArticleTypes[k]['nlm_type'],
					name: publisherArticleTypes[k]['name'],
					short_name: publisherArticleTypes[k]['short_name']
				}
				if(publisherArticleTypes[k]['name'] == articleType){
					selectObj['selected'] = true;
				}
				article['article_type_list'].push(selectObj);
			}

			// Article Section
			// ------------
			// add ALL article sections
			var selectedSectionId;
			if(article['section']){
				selectedSectionId = article['section'];
			}
			article['article_section_list'] = [];
			var publisherArticleSections = sections.find().fetch();
			for(var s =0 ; s < publisherArticleSections.length ; s++){
				var selectObj = {
					_id : publisherArticleSections[s]['_id'],
					name: publisherArticleSections[s]['name'],
					short_name: publisherArticleSections[s]['short_name']
				}
				if(publisherArticleSections[s]['_id'] == selectedSectionId){
					selectObj['selected'] = true;
				}
				article['article_section_list'].push(selectObj);
			}

			// console.log('--------------------article');
			// console.log(article);
			return article;
		}
	},
	batchUpdateAdvanceOrderByPii: function(){
		// console.log('..batchUpdateAdvanceOrderByPii');
		var advanceOrder = [];
		var piiList;
		var piiUrl = 'http://www.impactjournals.com/ojs-api/index.php?get_advance_piis=1';
		var res;
		res = Meteor.http.get(piiUrl);

		// Put Mongo ID in correct order
		if(res){
			piiList =  JSON.parse(res.content);
			for(var p=0 ; p<piiList.length ; p++){
				// console.log(piiList[p]);
				var article = articles.findOne({'ids.pii' : piiList[p]});
				if(article){
					advanceOrder.push(article._id);
					// console.log(article._id);
				}
			}
			if(advanceOrder.length != 0){
				// Update advance doc in sorters collection
				// console.log(advanceOrder);
				return sorters.update({'name' : 'advance'}, {$set: {'order' : advanceOrder}});
			}

		}

	},
	compareObjectsXmlWithDb: function(xmlValue, dbValue){
		// console.log('..compareObjectsXmlWithDb');
		var conflict = '';
		for(var valueKey in xmlValue){
			// make sure this value is a string

			// make sure DB has this key too
			if(dbValue[valueKey]){
				var c = Meteor.call('compareValuesXmlWithDb', valueKey, xmlValue[valueKey], dbValue[valueKey]);
				if(c){
					// append to other conflicts in this object
					conflict += ' ' + valueKey + ' : ' + c.conflict;
				}
			}
		}
		return conflict;
	},
	compareValuesXmlWithDb: function(key, xmlValue, dbValue){
		console.log('..compareValuesXmlWithDb: ' + key);
		var conflict = {};
			conflict.what = key;
		var arraysConflict = false;
		if(typeof xmlValue == 'string' || typeof xmlValue == 'boolean' || typeof xmlValue == 'number'){
			if(xmlValue != dbValue){
				conflict.conflict = '<b>XML != Database</b><br>' + xmlValue + '<br>!=<br>' + dbValue;
			}
		}else if(typeof xmlValue == 'object' && !Array.isArray(xmlValue)){
			conflict = Meteor.call('compareObjectsXmlWithDb', xmlValue, dbValue);
		}else if(typeof xmlValue == 'object' && Array.isArray(xmlValue)){
			// Make sure it is not an array of objects. arraysDiffer cannot handle objects.
			// if an array of objects (for ex, authors), then the order of objects in the array is important
			arraysConflict = Meteor.call('arraysDiffer', xmlValue, dbValue);
			if(arraysConflict){
				conflict.conflict = ' <b>XML != Database</b><br>' + xmlValue.toString() + '<br>!=<br>' + dbValue.toString();
			}
		}else if(typeof xmlValue == 'undefined'){
			conflict.conflict = 'XML Value is undefined';
		}else if(typeof dbValue == 'undefined'){
			conflict.conflict = 'Database Value is undefined';
		}

		if(conflict.conflict){
			return conflict;
		}else{
			return false; // they match, no conflicts.
		}
	},
	compareProcessedXmlWithDb: function(xmlArticle, dbArticle){
		// console.log('..compareProcessedXmlWithDb');
		// Take the XML data and compare with the data from the DB
		// this is for the article form and after XML is uploaded
		// Note: There are things in dbArticle that are not in the XML. For example, if an article is advance or feature
		// Note: Merged data will be from the XML if there is a conflict

		var ignoreConflicts = ['_id','doc_updates','issue_id'];

		var merged = {};
			merged['conflicts'] = [];


		// since DB has more info than XML loop through its data to compare. Later double check nothing missing from merge by looping through XML data
		for(var articleKey in dbArticle){
			console.log(articleKey);
			if(dbArticle[articleKey] != '' && xmlArticle[articleKey]){ //XML will not have empty value, but DB might because of removing an article from something (ie, removing from a section)
				merged[articleKey] = xmlArticle[articleKey]; // both versions have data for key. if there are conflicts, then form will default to XML version

				// now check if there are conflicts between versions
				var conflict = Meteor.call('compareValuesXmlWithDb', articleKey, xmlArticle[articleKey], dbArticle[articleKey]);
				if(conflict){
					merged['conflicts'].push(conflict);
				}
			}else if(!dbArticle[articleKey] && xmlArticle[articleKey]){
				merged['conflicts'].push({
					'what' : articleKey,
					'conflict' : 'In XML, NOT in database'
				});
			}else if(dbArticle[articleKey] == '' && xmlArticle[articleKey]){
				merged['conflicts'].push({
					'what' : articleKey,
					'conflict' : 'In XML, NOT in database'
				});
			}else if(dbArticle[articleKey] != '' && !xmlArticle[articleKey] && ignoreConflicts.indexOf(articleKey) == -1){
				// If in DB but not in XML
				// skip mongo ID, issue mongo ID, db doc_updates etc for comparing
				// stringify database info in case type is object
				merged[articleKeyXml] = xmlArticle[articleKeyXml];
				merged['conflicts'].push({
					'what' : articleKey,
					'conflict' : 'In database, NOT in XML<br>' + JSON.stringify(dbArticle[articleKey])
				});
			}else if(articleKey == '_id'){
				merged[articleKey] = dbArticle[articleKey];
			}else{
				console.log('..else');
				// the database value is empty and the XML does not have this
			}

		}

		// Now make sure there isn't anything missing from XML
		for(var articleKeyXml in xmlArticle){
			if(!merged[articleKeyXml]){
				merged[articleKeyXml] = xmlArticle[articleKeyXml];
			}
		}

		// // TITLE
		// // ----------
		// if(xmlArticle['title'] && dbArticle['title']){
		// 	if(xmlArticle['title'] != dbArticle['title']){
		// 		dbArticle['conflicts'].push({'what' : 'Title', 'conflict' : dbArticle['title']});
		// 		dbArticle['title'] = xmlArticle['title'];
		// 	}
		// }else if(dbArticle['title']){
		// 	// XML is missing title
		// 	dbArticle['conflicts'].push({'what' : 'Title', 'conflict' : dbArticle['title']});
		// 	dbArticle['title'] = xmlArticle['title'];
		// }

		// // KEYWORDS
		// // ----------
		// if(xmlArticle['keywords'] && dbArticle['keywords']){
		// 	Meteor.call('conflictProcessedXmlWithDbKw', xmlArticle['keywords'], dbArticle['keywords'],function(errorKw,resultKw){
		// 		if(errorKw){
		// 			console.error(errorKw);
		// 		}
		// 		if(resultKw){
		// 			// they DO NOT match
		// 			dbArticle['conflicts'].push({'what' : 'Keywords', 'conflict' : dbArticle['keywords'].toString()});
		// 			dbArticle['keywords'] = xmlArticle['keywords'];
		// 		}
		// 	});
		// }

		// // ABSTRACT
		// // ----------
		// if(xmlArticle['abstract'] && dbArticle['abstract']){
		// 	if(xmlArticle['abstract'] != dbArticle['abstract']){
		// 		dbArticle['conflicts'].push({'what' : 'Abstract', 'conflict' : 'Abstracts do not match' + dbArticle['abstract']});
		// 		dbArticle['abstract'] = xmlArticle['abstract'];
		// 	}
		// }else if(dbArticle['abstract']){
		// 	// XML is missing abstract
		// 	dbArticle['conflicts'].push({'what' : 'Abstract', 'conflict' : 'XML is missing abstract: ' + dbArticle['abstract']});
		// 	dbArticle['abstract'] = xmlArticle['abstract'];
		// }

		// // ARTICLE TYPE
		// // ----------
		// if(xmlArticle['article_type'] && dbArticle['article_type']){
		// 	// console.log('article type -');console.log(JSON.stringify(xmlArticle['article_type']));
		// 	if(xmlArticle['article_type']['short_name'] != dbArticle['article_type']['short_name']){
		// 		dbArticle['conflicts'].push({'what' : 'Article Type', 'conflict' : 'Article Types Do Not Match. Database = ' + dbArticle['article_type']['name'] + ', XML = ' + xmlArticle['article_type']['name']});
		// 	}
		// }else if(xmlArticle['article_type'] && !dbArticle['article_type']){
		// 	dbArticle['conflicts'].push({'what' : 'Article Type', 'conflict' : 'XML has article type, but database does not'});
		// }else if(!xmlArticle['article_type'] && dbArticle['article_type']){
		// 	dbArticle['conflicts'].push({'what' : 'Article Type ', 'conflict' : 'Database has article type, but XML does not'});
		// }

		// // IDS
		// // ----------
		// if(xmlArticle['ids'] && dbArticle['ids']){
		// 	if(xmlArticle['ids'].length > dbArticle['ids'].length){
		// 		dbArticle['conflicts'].push({'what' : 'IDs ', 'conflict' : 'Less IDs in DB: ' + JSON.stringify(dbArticle['ids'])});
		// 	}else if(xmlArticle['ids'].length < dbArticle['ids'].length){
		// 		dbArticle['conflicts'].push({'what' : 'IDs ', 'conflict' : 'More IDs in DB: ' + JSON.stringify(dbArticle['ids'])});
		// 	}else{
		// 		// check that all IDs are the same.
		// 		// Also checks for possibility that the lengths are the same, but the keys are different
		// 		for(var id in xmlArticle['ids']){
		// 			// console.log(id + ' = ' +xmlArticle['ids'][id]);
		// 			if(xmlArticle['ids'][id] != dbArticle['ids'][id]){
		// 				dbArticle['conflicts'].push({
		// 					'what' : 'IDs not equal ',
		// 					'conflict' : id + ' : ' + xmlArticle['ids'][id] + ' (XML) != (Database) ' + dbArticle['ids'][id]
		// 				});
		// 			}
		// 		}
		// 	}
		// }else if(xmlArticle['ids'] && !dbArticle['ids']){
		// 	dbArticle['conflicts'].push({'what' : 'IDs ', 'conflict' : 'XML has IDs, but database does not'});
		// }else if(!xmlArticle['ids'] && dbArticle['ids']){
		// 	dbArticle['conflicts'].push({'what' : 'IDs ', 'conflict' : 'Database has IDs, but XML does not'});
		// }

		// // AUTHORS
		// // ----------
		// // the order author objects are listed in the array is the order they are listed. No need to do any sorting
		// if(!xmlArticle['authors'] && dbArticle['authors']){
		// 	dbArticle['conflicts'].push({'what' : 'Authors ', 'conflict' : 'XML is missing Authors, but there are some saved in the database.'});
		// }else if(xmlArticle['authors'] && !dbArticle['authors']){
		// 	dbArticle['conflicts'].push({'what' : 'Authors ', 'conflict' : 'Database has no authors saved. XML has authors.'});
		// 	dbArticle['authors'] = xmlArticle['authors'];
		// }else if(xmlArticle['authors'].length > dbArticle['authors'].length){
		// 	dbArticle['conflicts'].push({'what' : 'Authors ', 'conflict' : 'XML has more authors than database'});
		// 	dbArticle['authors'] = xmlArticle['authors'];
		// }else if(xmlArticle['authors'].length < dbArticle['authors'].length){
		// 	dbArticle['conflicts'].push({'what' : 'Authors ', 'conflict' : 'Database has more authors than XML'});
		// 	dbArticle['authors'] = xmlArticle['authors'];
		// }else if(xmlArticle['authors'].length == dbArticle['authors'].length){
		// 	// Same number of authors
		// 	// check that authors match
		// 	for(var author=0 ; author < xmlArticle['authors'].length; author++){
		// 		// Author Name
		// 		// Parsing XML will return no key if node not present in XML. Database will return empty string.
		// 		if(xmlArticle['authors'][author]['name_last'] && dbArticle['authors'][author]['name_last'] != ''){
		// 			if(xmlArticle['authors'][author]['name_last'] != dbArticle['authors'][author]['name_last']){
		// 				dbArticle['conflicts'].push({
		// 					'what' : 'Author Last Name',
		// 					'conflict' : 'Author #' + parseInt(author + 1) + ': ' + xmlArticle['authors'][author]['name_last'] + ' (XML) !=  (Database) ' + dbArticle['authors'][author]['name_last']
		// 				});
		// 			}
		// 		}
		// 		if(xmlArticle['authors'][author]['name_middle'] && dbArticle['authors'][author]['name_middle'] != ''){
		// 			if(xmlArticle['authors'][author]['name_middle'] != dbArticle['authors'][author]['name_middle']){
		// 				dbArticle['conflicts'].push({
		// 					'what' : 'Author Middle Name',
		// 					'conflict' : 'Author #' + parseInt(author + 1) + ': ' + xmlArticle['authors'][author]['name_middle'] + ' (XML) !=  (Database) ' + dbArticle['authors'][author]['name_middle']
		// 				});
		// 			}
		// 		}
		// 		if(xmlArticle['authors'][author]['name_first'] && dbArticle['authors'][author]['name_first'] != ''){
		// 			if(xmlArticle['authors'][author]['name_first'] != dbArticle['authors'][author]['name_first']){
		// 				dbArticle['conflicts'].push({
		// 					'what' : 'Author First Name',
		// 					'conflict' : 'Author #' + parseInt(author + 1) + ': ' + xmlArticle['authors'][author]['name_first'] + ' (XML) !=  (Database) ' + dbArticle['authors'][author]['name_first']
		// 				});
		// 			}
		// 		}

		// 		// Author Affiliations
		// 		if(xmlArticle['authors'][author]['affiliations'] && dbArticle['authors'][author]['affiliations']){
		// 			if(xmlArticle['authors'][author]['affiliations'].toString() != dbArticle['authors'][author]['affiliations'].toString()){
		// 				dbArticle['conflicts'].push({
		// 					'what' : 'Author Affiliations',
		// 					'conflict' : 'Author #' + parseInt(author + 1) + ': (+1 to each affiliation, this is done in processing) ' + xmlArticle['authors'][author]['affiliations'].toString() + ' (XML) !=  (Database) ' + dbArticle['authors'][author]['affiliations'].toString()
		// 				});
		// 			}
		// 		}else if(xmlArticle['authors'][author]['affiliations']){
		// 			dbArticle['conflicts'].push({
		// 				'what' : 'Author Affiliations',
		// 				'conflict' : 'Author #' + parseInt(author + 1) + ': Database does not have affiliations'
		// 			});
		// 		}else if(dbArticle['authors'][author]['affiliations']){
		// 			dbArticle['conflicts'].push({
		// 				'what' : 'Author Affiliations',
		// 				'conflict' : 'Author #' + parseInt(author + 1) + ': XML does not have affiliations'
		// 			});
		// 		}

		// 		// TODO: Author IDs
		// 	}
		// 	dbArticle['authors'] = xmlArticle['authors'];
		// }

		// PUB DATES
		// ----------

		// HISTORY DATES
		// ----------

		return merged;
	},
	arraysDiffer: function(xmlKw, dbKw){
		// console.log('..arraysDiffer');
		// returns true if they DO NOT match
		// for just comparing KW between upoaded XML and DB info
		// create temporary for comparing, because we want the admins to be able to control order of kw
		var tempXmlKw,
			tempDbKw;
		tempXmlKw = xmlKw.sort();
		tempDbKw = dbKw.sort();
		// not same number of keywords
		if(tempXmlKw.length != tempDbKw.length){
			return true;
		}else{
			// same number of kw, but check if not matching
			for (var kw = 0; kw < tempXmlKw.length; kw++) {
				if (tempXmlKw[kw] !== tempDbKw[kw]){
					return true;
				}
			}
		}
	}
});