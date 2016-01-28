Meteor.methods({
	articleToSchema: function(xml,articleJson){
		// console.log('..articleToSchema');
		// Process JSON for meteor templating and mongo db
		// xml - xml string
		// articleJson - parsed XML to JSON. but not in the schema we need.
		var journalMeta = articleJson[0]['front'][0]['journal-meta'][0];
		var article = articleJson[0]['front'][0]['article-meta'][0];

		var articleProcessed = {};

		// PUBLISHER
		// -----------
		if(journalMeta['publisher']){
			for(var i = 0 ; i < journalMeta['publisher'].length ; i++){
				if( journalMeta['publisher'][i]['publisher-name']){
					articleProcessed.publisher = journalMeta['publisher'][i]['publisher-name'][0];
				}
			}
		}


		// TITLE
		// -----------
		var titleGroup = xml.substring(xml.lastIndexOf('<title-group>')+1,xml.lastIndexOf('</title-group>'));
		var titleTitle = titleGroup.substring(titleGroup.lastIndexOf('<article-title>')+1,titleGroup.lastIndexOf('</article-title>'));
			titleTitle = titleTitle.replace('article-title>','');
			titleTitle = Meteor.adminBatch.cleanString(titleTitle);
		articleProcessed['title'] = titleTitle;


		if(article['volume']){
			articleProcessed['volume'] = parseInt(article['volume'][0]);
		}
		if(article['issue']){
			articleProcessed['issue'] = article['issue'][0];
		}
		if(article['fpage']){
			articleProcessed['page_start'] = parseInt(article['fpage'][0]);
		}
		if(article['lpage']){
			articleProcessed['page_end'] = parseInt(article['lpage'][0]);
		}
		// KEYWORDS
		// -----------
		if(article['kwd-group']){
			articleProcessed['keywords'] = [];
			var keywords = article['kwd-group'][0]['kwd'];
			for(var kw=0 ; kw<keywords.length ; kw++){
				if(typeof  keywords[kw] == 'object'){
					var kwStyled = '',
						kwStyeType = '';
					for(var kwKey in  keywords[kw]){
						kwStyeType += kwKey;
					}
					kwStyled = '<' + kwStyeType + '>' + keywords[kw][kwStyeType] + '<' + kwStyeType + '/>';
					articleProcessed['keywords'].push(kwStyled);

				}else{
					articleProcessed['keywords'].push(keywords[kw]);
				}
			}
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
		// console.log(articleProcessed['ids']);
		// PII required!
		// -----------
		// if(!articleProcessed['ids']['pii']){
		// 	throw new Meteor.Error('XML is missing PII.');
		// }

		// AUTHORS
		// -----------
		if(article['contrib-group']){
			articleProcessed['authors'] = [];
			var authorsList = article['contrib-group'][0]['contrib'];
			var authorsListLength = authorsList.length;
			for(var i = 0 ; i < authorsListLength ; i++){
				var author = {};
				if(authorsList[i]['name']){
					if(authorsList[i]['name'][0]['given-names']){
						author['name_first'] = authorsList[i]['name'][0]['given-names'][0];
					}
					if(authorsList[i]['name'][0]['surname'][0]){
						author['name_last'] = authorsList[i]['name'][0]['surname'][0];
					}
				}

				// Author affiliations
				if(authorsList[i]['xref']){
					author['affiliations_numbers'] = [];
					for(var authorAff=0 ; authorAff<authorsList[i]['xref'].length ; authorAff++){
						if(authorsList[i]['xref'][authorAff]['sup']){
							var affNumber = parseInt(authorsList[i]['xref'][authorAff]['sup'][0]-1);
							author['affiliations_numbers'].push(affNumber); // This is 0 based in the DB //TODO: look into possible attribute options for <xref> within <contrib>
						}
					}
				}
				articleProcessed['authors'].push(author);
			}
		}

		// ALL AFFILIATIONS
		// -----------
		articleProcessed['affiliations'] = [];
		if(article['aff']){
			// console.log('------affiliations=');
			// console.log(JSON.stringify(article['aff']));
			for(var aff=0 ; aff < article['aff'].length ; aff++){
				articleProcessed['affiliations'].push(article['aff'][aff]['_'])
			}
		}

		// PUB DATES
		// -----------
		articleProcessed['dates'] = {};
		var dates = article['pub-date'];
		var datesLength = dates.length;
		for(var i = 0 ; i < datesLength ; i++){
			var dateType =  dates[i]['$']['pub-type'];
			if(dateType != 'collection'){
				var d = '';
				if(dates[i]['month'] && dates[i]['day'] && dates[i]['year']){
					d += dates[i]['month'][0] + ' ';
					d += dates[i]['day'][0] + ' ';
					d += dates[i]['year'][0] + ' ';
					d += ' 00:00:00.0000';
					var dd = new Date(d);
					// console.log(dateType + ' = ' + dd);
					articleProcessed['dates'][dateType] = dd;
				}
			}
		}
		// console.log(articleProcessed['dates']);

		// HISTORY DATES
		// -----------
		if(article['history']){
			articleProcessed['history'] = {};
			var history = article['history'][0]['date'];
			var historyLength = history.length;

			for(var i = 0 ; i < historyLength ; i++){
				var dateType = history[i]['$']['date-type'];
				var d = '';
				if(history[i]['month'] && history[i]['day'] && history[i]['year']){
					d += history[i]['month'][0] + ' ';
					d += history[i]['day'][0] + ' ';
					d += history[i]['year'][0] + ' ';
					d += ' 00:00:00.0000';
					var dd = new Date(d);
					articleProcessed['history'][dateType] = dd;
				}
			}
		}

		// console.log('articleProcessed',articleProcessed);
		return articleProcessed;
	},
	processXmlString: function(xml){
		// console.log('..processXmlString');
		var articleJson;
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
					articleJson = result['pmc-articleset']['article'];
					// console.log('articleJson ',articleJson);
					Meteor.call('articleToSchema', xml, articleJson,function(e,r){ // pass XML string (for title) AND JSON
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
	compareObjectsXmlWithDb: function(xmlValue, dbValue){
		// console.log('..compareObjectsXmlWithDb');
		// console.log(JSON.stringify(xmlValue));console.log(JSON.stringify(dbValue));
		var fut = new future();
		var conflict = '';
		var keyCount = 0;
		//TODO: add check for matching object lengths
		if(Object.keys(dbValue).length != 0){
			for(var valueKey in dbValue){
				// console.log('  ' + valueKey);
				// DB will have more keys because middle name, affiliations, etc all will be empty if they do not exist. whereas from the XML, the key will not exist
				// make sure XML has this key too
				if(xmlValue[valueKey]){
					var c = Meteor.call('compareValuesXmlWithDb', valueKey, xmlValue[valueKey], dbValue[valueKey]);
					if(c){
						// append to other conflicts in this object
						conflict += '<br/>' + valueKey + ': ' + c.conflict + ' ';
					}
				}else if(dbValue[valueKey] != '' && Object.keys(dbValue[valueKey]).length != 0){
					conflict += '<br/>' + valueKey + ': Missing in XML. In database.';
					if(valueKey == 'affiliations_numbers'){
						for(var aff in dbValue[valueKey]){
							conflict += parseInt(dbValue[valueKey][aff] + 1) + ' ';// in database, the affiliation numbers are 0 based. Make this easier for the user to get
						}
					}else{
						conflict += JSON.stringify(dbValue[valueKey]) + ' ';
					}

				}
				keyCount++;
				// console.log(keyCount);
				if(keyCount == Object.keys(dbValue).length){
					// console.log('CONFLICT = ');console.log(conflict);
					fut['return'](conflict);
				}
			}
		}else{
			// Object is empty in DB.
			for(var valueKey in xmlValue){
				conflict += '<br/>' + valueKey + ': Missing in database. In XML.';
				keyCount++;
				// console.log(keyCount);
				if(keyCount == Object.keys(xmlValue).length){
					// console.log('CONFLICT = ');console.log(conflict);
					fut['return'](conflict);
				}
			}
		}

		return fut.wait();
	},
	compareValuesXmlWithDb: function(key, xmlValue, dbValue){
		// console.log('..compareValuesXmlWithDb');
		// console.log('  ' + key + ' : ' + xmlValue + ' =? ' + dbValue);
		var conflict = {};
			conflict.what = key,
			conflict.conflict = ''; //make empty so that later when looping through object the first iteration is not undefined.
		var arraysConflict = false;
		if(typeof xmlValue == 'string' || typeof xmlValue == 'boolean' || typeof xmlValue == 'number' || typeof xmlValue.getMonth === 'function'){ //treat dates as strings for comparisson
			if(xmlValue === dbValue){
			}else{
				// keep type comparisson. affiliation numbers are checked here and are 0 based, which would be false when checking.
				conflict.conflict = '<br><b>XML != Database</b><br>' + xmlValue + '<br>!=<br>' + dbValue;
			}
		}else if(typeof xmlValue == 'object' && !Array.isArray(xmlValue)){
			Meteor.call('compareObjectsXmlWithDb', xmlValue, dbValue, function(error,result){
				if(result){
					conflict.conflict = result;
				}
			});
		}else if(typeof xmlValue == 'object' && Array.isArray(xmlValue)){
			// Make sure it is not an array of objects. arraysDiffer cannot handle objects.
			// if an array of objects (for ex, authors), then the order of objects in the array is important
			for(var arrIdx=0 ; arrIdx<xmlValue.length ; arrIdx++){
				if(typeof xmlValue[arrIdx] == 'object'){
					Meteor.call('compareObjectsXmlWithDb', xmlValue[arrIdx], dbValue[arrIdx],function(err,res){
						if(err){
							console.error(err);
						}
						if(res){
							conflict.conflict += '<div class="clearfix"></div>#' + parseInt(arrIdx+1) + '- ' + res;
						}
					});
				}else{
					Meteor.call('compareValuesXmlWithDb', '', xmlValue[arrIdx], dbValue[arrIdx],function(e,r){
						if(r){
							conflict.conflict += r.conflict;
						}
					});
				}
			}
		}else{
			//TODO add checks for missing
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

		var ignoreConflicts = ['_id','doc_updates','issue_id','batch'];

		var merged = {};
			merged['conflicts'] = [];


		// since DB has more info than XML loop through its data to compare. Later double check nothing missing from merge by looping through XML data
		for(var articleKey in dbArticle){
			if(dbArticle[articleKey] != '' && xmlArticle[articleKey]){
				//XML will not have empty value, but DB might because of removing an article from something (ie, removing from a section)
				merged[articleKey] = xmlArticle[articleKey]; // both versions have data for key. if there are conflicts, then form will default to XML version
				// now check if there are conflicts between versions
				Meteor.call('compareValuesXmlWithDb', articleKey, xmlArticle[articleKey], dbArticle[articleKey], function(error,conflict){
					if(conflict){
						merged['conflicts'].push(conflict);
					}
				});

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
				// console.log('..else');
				// the database value is empty and the XML does not have this
			}
		}
		// console.log('merged',merged);
		// Now make sure there isn't anything missing from XML
		for(var articleKeyXml in xmlArticle){
			if(!merged[articleKeyXml]){
				merged[articleKeyXml] = xmlArticle[articleKeyXml];
			}
		}

		return merged;
	},
	arraysDiffer: function(xmlKw, dbKw){
		// console.log('..arraysDiffer');
		// console.log(xmlKw);conflict.log(dbKw);
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