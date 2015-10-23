// Article vs Articles will tell whether the function is for multiple or 1 article
Meteor.methods({
	legacyArticleIntake: function(articleParams){
		var idType = articleParams.id_type,
			idValue = articleParams.id,
			journal = articleParams.journal,
			advance = articleParams.advance;
		var article,
			articleMongoId,
			paperchaseQueryParams,
			legacyPlatform,
			legacyPlatformApi,
			articleJson,
			processedArticleJson;
		console.log('...legacyIntake: ' + idType + ' = ' + idValue);

		legacyPlatform = journalConfig.findOne()['legacy_platform'],
		legacyPlatformApi = legacyPlatform['mini_api'];

		// Check if aritcle exists by query for ID. Allow multiple types of ID (PMID, PII, etc)
		paperchaseQueryParams = '{"' + 'ids.' + idType + '" : "' + idValue + '"}';
		paperchaseQueryParams = JSON.parse(paperchaseQueryParams);
		article = articles.findOne(paperchaseQueryParams);

		// Get the article JSON from the legacy platform
		if(legacyPlatform['short_name'] === 'ojs'){
			articleJson = Meteor.call('ojsGetArticlesJson', idType, idValue, journal, legacyPlatformApi);
			articleJson = JSON.parse(articleJson);
		}

		// Process article info for Paperchase DB
		if(articleJson){
			articleJson = articleJson['articles'][0];
			processedArticleJson = Meteor.call('ojsProcessArticleJson', articleJson);
			if(advance){
				processedArticleJson.advance = true;
			}
			// console.log('    '+processedArticleJson['title']);
			if(article){
				articleMongoId =  article['_id'];
				// console.log('    Update = ' + processedArticleJson['title']);
				Meteor.call('updateArticle', articleMongoId, processedArticleJson);
			}else{
				// console.log('    Add = ' + processedArticleJson['title']);
				processedArticleJson['doc_updates'] = {} ;
				processedArticleJson['doc_updates']['created_by'] = 'OJS Intake';
				articleMongoId = Meteor.call('addArticle',processedArticleJson);
			}
		}

		if(articleMongoId){
			return true; // DO we need a response to Legacy platform?
		}
	},
});


// OJS
Meteor.methods({
	ojsGetArticlesJson: function(idType, idValue, journal, requestUrl){
		// JSON response can contain multiple articles
		if(requestUrl){
			console.log('...ojsGetJson');
			// TODO: Add journal param?
			// requestUrl += '?type=' + idType + '&id=' + idValue + '&journal=' + journal;
			requestUrl += '?' + idType + '=' + idValue;
			var res;
			res = Meteor.http.get(requestUrl);
			if(res){
				return res.content;
			}
		}
	},
	ojsProcessArticleJson: function(article){
		console.log('...ojsProcessArticleJson');
		var articleUpdate = {},
			pagePieces,
			authors,
			issueId;

		if(article.title){
			articleUpdate.title = article.title;
		}

		if(article.volume){
			articleUpdate.volume = parseInt(article.volume);
		}

		if(article.issue){
			articleUpdate.issue = parseInt(article.issue);
		}

		if(article.pages){
			pagePieces = article.pages.split('-');
			articleUpdate.page_start = pagePieces[0];
			if(pagesPieces.length > 1){
				articleUpdate.page_end = pagePieces[1];
			}
		}

		// TODO: Add Keywords to mini API response.
		// if(article.keywords){}

		if(article.abstract){
			articleUpdate.abstract = article.abstract;
		}

		// TODO: Add NLM type. Query article types collection.
		if(article.article_type){
			articleUpdate.article_type = {};
			articleUpdate.article_type.type  = article.article_type;
			articleUpdate.article_type.short_name = article.short_name;
		}

		// TODO: Add other ID types. (PMC, PMID, etc)
		if(article.pii){
			articleUpdate.ids = {};
			articleUpdate.ids.pii = article.pii;
		}

		if(article.authors){
			articleUpdate.authors = [];
			authors = article.authors;
			for(var a = 0 ; a < authors.length ; a++){
				var authorObj = authors[a];
				authorObj.ids = {}; // this will also get added if we are inserting a new author to the authors collection. that is good though. we will add Orcid etc in the future to the author doc.

				// TODO: Add in author affiliation number
				// authorObj.affiliations_numbers = [];

				var authorMongo;
				var authorDoc = Meteor.call('findAuthorByName',authors[a].name_first, authors[a].name_last);
				if(!authorDoc){
					// Add author to authors collection
					authorMongo = Meteor.call('addAuthor',authorObj);
				}else{
					authorMongo = authorDoc._id;
				}
				authorObj.ids.mongo_id = authorMongo;

				// Add the author with Mongo ID to the article update object
				articleUpdate.authors.push(authors[a]);
			}
		}

		// TODO: Add dates
		// if(article.dates){}

		// TODO: Add history
		// if(article.history){}

		if(article.volume && article.issue){
			// Does issue exist?
			issueInfo = Meteor.call('findIssueByVolIssue', article.volume, article.issue);
			if(issueId){
				issueId = issueInfo['_id'];
			}else{
				// This also checks volume collection and inserts if needed.
				issueId = Meteor.call('addIssue',{
					'volume': article.volume,
					'issue': article.issue
				});
			}
			articleUpdate.issue_id = issueId;
		}

		// TODO: Affiliations
		// articleUpdate.affiliations = [];

		// TODO: Pub Status. Query PubMed.

		return articleUpdate;
	}
});
