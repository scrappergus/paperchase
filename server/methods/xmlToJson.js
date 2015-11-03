xpath = Meteor.npmRequire('xpath');
dom = Meteor.npmRequire('xmldom').DOMParser;
Meteor.methods({
	getXmlForFullText: function(mongoId){
		console.log('... mongo id = ' + mongoId);
		var fut = new future();
		var articleJson,
			articleFullTextLink,
				articleFullText = [],
				articleFullTextXml,
				pii,
				pmid,
				articleInfo,
				configSettings,
				assetsLink,
				resLinks,
				resXml,
				xml;
		articleInfo = articles.findOne({'_id' : mongoId});
		pmid = articleInfo.ids.pmid;
		pii = articleInfo.ids.pii;
		configSettings = journalConfig.findOne({});
		assetsLink = configSettings.api.assets;

		if(pii){
			// get asset links
			resLinks = Meteor.http.get(assetsLink + pii);
			if(resLinks){
				resLinks = resLinks.content;
				resLinks = JSON.parse(resLinks);
				resLinks = resLinks[0];
				// console.log('resLinks');console.log(resLinks);
				articleFullTextLink = resLinks.full_xml_url;
			}

			// get XML
			if(articleFullTextLink){
				resXml = Meteor.http.get(articleFullTextLink);
				if(resXml){
					// XML to JSON
					xml = resXml.content;
					// console.log(xml);
				}
			}

			if(xml){
				var articleJson = Meteor.call('fullTextToJson',xml);
			}
		}

		// articleFullText.push(articleJson);
		// console.log(articleJson['sections'].length);
		// return articleJson;
		if(articleJson){
			console.log('YES');
			fut['return'](articleJson);
		}
	},
	fullTextToJson: function(xml){
		// console.log('... fullTextToJson');
		var articleObject = {};
		var doc = new dom().parseFromString(xml);

		// check for <sec>. Possible that editorials are the only type without..

		var sections = xpath.select('//sec', doc);
		if(sections[0]){
			articleObject.sections = [];
			// Sections
			for(var section = 0 ; section < sections.length ; section++){
				// console.log('.. '+section);
				var sectionObject = {};
				for(var c = 0 ; c < sections[section].childNodes.length ; c++){
					// console.log('.... ' + c);
					var sec = sections[section].childNodes[c];
					// console.log(sec.localName);

					// Section title and content
					if(sec.localName === 'title'){
						// Section: Title
						sectionObject.title = '';
						// if length greater than 1, then there are styling tags in the title. for ex, <italic>
						if(sec.childNodes.length === 1){
							sectionObject.title = sec.childNodes[0].nodeValue;
						}else{
							// sectionObject.title = loopNodeWithStyle();
							for(var i = 0 ; i < sec.childNodes.length ; i++){
								if(sec.childNodes[i].nodeValue){
									sectionObject.title += sec.childNodes[i].nodeValue;
								}else{
									// Get the style tag
									sectionObject.title += '<' + sec.childNodes[i].localName + '>';
									// Get the node value of the style tag
									sectionObject.title += sec.childNodes[i].childNodes[0].nodeValue;
									// Close the style tag
									sectionObject.title += '</' + sec.childNodes[i].localName + '>';
								}
							}
						}
					}else if(sec.childNodes){
						// Section: Content
						sectionObject.content = '';
						for(var cc = 0 ; cc < sec.childNodes.length ; cc++){
							// console.log('..... ' + cc + ' = ' + sec.childNodes[cc].localName);
							if(sec.childNodes[cc].nodeValue){
								// plain text
								sectionObject.content += sec.childNodes[cc].nodeValue;
							}else{
								// there are style tags, or reference links
								var tagValue = sectionObject.content += sec.childNodes[cc].childNodes[0].nodeValue;
								if(sec.childNodes[cc].localName === 'xref'){
									// sectionObject.content += '<a href="#">';
									sectionObject.content += tagValue;
									// sectionObject.content += '</a>';
								}else{
									sectionObject.content += '<' + sec.childNodes[cc].localName + '>';
									sectionObject.content += tagValue;
									sectionObject.content += '</' + sec.childNodes[cc].localName + '>';
								}
							}
						}
					}

				}
				articleObject.sections.push(sectionObject);
				// console.log(sections[section]['textContent'])
			}
		}else{
			// just create 1 section
		}
		// console.log(articleObject);
		return articleObject;
	},
	// loopNodeWithStyle: function(node){
		// this throws an error: { stack: { stack: undefined, source: 'method' }, //perhaps a timing issue.. would be nice to have method because we use this multiple times
		// console.log('......loopNodeWithStyle');
		// var string = '';
		// for(var i = 0 ; i < node.childNodes.length ; i++){
		// 	if(node.childNodes[i].nodeValue){
		// 		string += sec.childNodes[i].nodeValue;
		// 	}else{
		// 		// Get the style tag
		// 		string += '<' + sec.childNodes[i].localName + '>';
		// 		// Get the node value of the style tag
		// 		string += sec.childNodes[i].childNodes[0].nodeValue;
		// 		// Close the style tag
		// 		string += '</' + sec.childNodes[i].localName + '>';
		// 	}
		// }
		// return string;
	// }
});