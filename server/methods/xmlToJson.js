xpath = Meteor.npmRequire('xpath');
dom = Meteor.npmRequire('xmldom').DOMParser;
Meteor.methods({
	availableAssests: function(mongoId){
		console.log('... availableAssests ' + mongoId);
		var fut = new future();
		var pii,
			articleInfo,
			configSettings,
			assetsLink,
			resLinks;
		articleInfo = articles.findOne({'_id' : mongoId});
		if(articleInfo){
			pii = articleInfo.ids.pii;
			configSettings = journalConfig.findOne({});
			assetsLink = configSettings.api.assets;

			if(pii){
				console.log('pii');
				console.log(pii);
				// get asset links
				resLinks = Meteor.http.get(assetsLink + pii);
				console.log('resLinks');
				console.log(resLinks);
				if(resLinks){
					resLinks = resLinks.content;
					resLinks = JSON.parse(resLinks);
					resLinks = resLinks[0];
					if(resLinks.figures.length === 0){
						delete resLinks.figures;
					}
					fut['return'](resLinks);
				}else{
					console.log("fail");
					fut['return']({});
				}
			}
			return fut.wait();
		}else{
			return;
		}
	},
	getAssetsForFullText: function(mongoId){
		// console.log('... mongo id = ' + mongoId);
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

			// get Figures


			if(xml){
				var articleJson = Meteor.call('fullTextToJson',xml, resLinks.figures);
			}
		}
		if(articleJson){
			articleJson.figures = resLinks.figures;
			fut['return'](articleJson);
		}
		return fut.wait();
	},
	fullTextToJson: function(xml, figures){
		// Full XML processing. Content, and References
		// console.log(figures);
		// console.log('... fullTextToJson');
		var fut = new future();
		var articleObject = {};
		var doc = new dom().parseFromString(xml);

		// Article Content
		// ---------------
		articleObject.sections = [];
		var sections = xpath.select('//sec', doc);
		if(sections[0]){
			// Sections
			for(var section = 0 ; section < sections.length ; section++){
				var sectionObject = fullTextSectionToJson(sections[section],figures);
				articleObject.sections.push(sectionObject);
			}
		}else{
			var body =  xpath.select('//body', doc);
			// there will only be 1 body node, so use body[0]
			var sectionObject = fullTextSectionToJson(body[0],figures);
			articleObject.sections.push(sectionObject);
			// no <sec>
			// just create 1 section
		}

		// References
		// ----------
		// TODO: editorials have a different reference style
		var references = xpath.select('//ref', doc);
		if(references[0]){
			articleObject.references = [];
			for(var reference = 0 ; reference < references.length ; reference++){
				// console.log('... ref ' + reference);
				var refAttributes = references[reference].attributes;
				var referenceObj = {};
				// Reference number
				for(var refAttr = 0 ; refAttr < refAttributes.length ; refAttr++){
					if(refAttributes[refAttr].localName === 'id'){
						referenceObj.number = refAttributes[refAttr].nodeValue.replace('R','');
					}
				}
				var referencePieces = references[reference].childNodes;
				for(var refPiece =0 ; refPiece < referencePieces.length ; refPiece++){
					// console.log('.... ' + refPiece);
					var referenceInfo;
					if(referencePieces[refPiece].localName === 'element-citation'){
						referenceInfo = referencePieces[refPiece];
						for(var r = 0 ; r < referenceInfo.childNodes.length ; r++){
							if(referenceInfo.childNodes[r].childNodes){
								// console.log(referenceInfo.childNodes[r].localName);
								var referencePart = '';
								if(referenceInfo.childNodes[r].localName){
									referencePart = referenceInfo.childNodes[r].localName.replace('-','_');
								}

								// Reference Title, Source, Pages, Year
								// ---------------
								// TODO: nodes with style tags, just title really
								if(referencePart != ''){
									for(var refP = 0 ; refP < referenceInfo.childNodes[r].childNodes.length ; refP++){
										if(referenceInfo.childNodes[r].childNodes[refP].nodeValue){
											referenceObj[referencePart] = referenceInfo.childNodes[r].childNodes[refP].nodeValue;
										}else{
											// there are style tags
											// console.log(referenceInfo.childNodes[r].childNodes[refP]);
											// for(var refTT = 0 ; refTT < referenceInfo.childNodes[r].childNodes[refP].childNodes.length ; refTT++){
											// 	console.log(referenceInfo.childNodes[r].childNodes[refP].childNodes[refTT].localName);
											// 	console.log(referenceInfo.childNodes[r].childNodes[refP].childNodes[refTT].nodeValue);
											// }
										}
									}
								}
							}
						}
					}
				}
				articleObject.references.push(referenceObj);
			}
		}

		if(articleObject){
			// console.log(articleObject);
			fut['return'](articleObject);
		}
		return fut.wait();
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

// this function, fullTextSectionToJson, as a method throws error: { stack: { stack: undefined, source: 'method' }
var fullTextSectionToJson =  function(section,figures){
	// XML processing of part of the content
	console.log('...fullTextSectionToJson');
	// console.log('section');
	// console.log(section);
	// console.log('section.childNodes');
	// console.log(section.childNodes);
	var sectionObject = {};
	sectionObject.content = [];
	for(var sectionChild = 0 ; sectionChild < section.childNodes.length ; sectionChild++){
		var sec = section.childNodes[sectionChild];
		var content = '';

		// Section: Title and Content
		if(sec.localName === 'title'){
			// Section: Title
			sectionObject.title = '';
			// if length greater than 1, then there are styling tags in the title. for ex, <italic>
			if(sec.childNodes.length === 1){
				sectionObject.title = sec.childNodes[0].nodeValue;
			}else{
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
			// console.log('localName ' + sec.localName);
			// TODO: if figure, don't add label. we will use title and caption from api.
			var figureFound = false,
				figureId = '',
				figureUrl = '',
				figureTitle = '',
				figureCaption = '';
			if(sec.localName === 'fig'){
				figureFound  = true;
				// get the figure ID
				for(var figAttr = 0 ; figAttr < sec.attributes.length ; figAttr++){
					if(sec.attributes[figAttr].localName === 'id'){
						figureId = sec.attributes[figAttr].nodeValue;
						for(var f = 0 ; f < figures.length ; f++){
							if(figures[f]['figureID'] === figureId){
								// console.log(figures[f]['imgURLs']);
								// TODO : are there ever more than 1 image in this array?
								figureUrl = figures[f]['imgURLs'][0];
								figureTitle = figures[f]['figureTitle'];
								figureCaption = figures[f]['figureText'];
							}
						}
					}
				}
			}
			for(var cc = 0 ; cc < sec.childNodes.length ; cc++){
				// console.log('..... ' + cc + ' = ' + sec.childNodes[cc].localName);
				if(sec.childNodes[cc].nodeValue){
					// plain text
					content += sec.childNodes[cc].nodeValue;
				}else{
					var tagValue;
					// there are style tags, or reference links
					if(sec.childNodes[cc].childNodes.length > 0){
						tagValue = sec.childNodes[cc].childNodes[0].nodeValue;
					}
					if(sec.childNodes[cc].localName === 'xref'){

						// Determine - Reference or Figure?
						var attributes = sec.childNodes[cc].attributes;
						// tagName should be replace with figure or reference id. nodeValue would return F1C, but rid will return F1.
						for(var attr = 0 ; attr < attributes.length ; attr++){
							if(attributes[attr].nodeName === 'rid'){
								tagValue = attributes[attr].nodeValue;
							}
						}
						content += '<a href="#' + tagValue + '">';
						content += tagValue;
						content += '</a>';
					}else if(sec.childNodes[cc].localName === 'graphic'){
						// console.log(sec.childNodes[cc]);
						content += '<div class="full-text-image-container box border-gray center-align" id="' + figureId + '">';
						if(figureTitle != ''){
							content += '<h4>' + figureTitle + '</h4>';
						}
						content += '<img class="materialboxed full-text-image" src="' + figureUrl +'"/>';
						if(figureCaption != ''){
							content += '<p>' + figureCaption + '</p>';
						}
						content += '</div>';
					}else{
						content += '<' + sec.childNodes[cc].localName + '>';
						content += tagValue;
						content += '</' + sec.childNodes[cc].localName + '>';
					}
				}
				// console.log(content);
			}
		}
		// console.log(content);
		sectionObject.content.push(content);
	}
	return sectionObject;
}