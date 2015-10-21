Meteor.organize = {
	issuesIntoVolumes: function(vol,iss){
		// console.log('-issuesIntoVolumes');
		//group issues by volume
		var issues = Meteor.organize.groupIssuesByVol(iss);

		//loop through volumes to add issues. this will keep the order descending so that the most recent vol is at the top
		var volL = vol.length;
		for(var idx = 0; idx < volL ; idx++){
			vol[idx]['issues'] = issues[vol[idx]['volume']];
		}
		return vol;
	},
	groupIssuesByVol: function(issues){
		// console.log('...groupIssuesByVol');
		var issL = issues.length;
		var res = []
		for(var i = 0; i < issL ; i++){
			var issue = issues[i];
			if(!res[issue['volume']]){
				res[issue['volume']] = [];
			}
			res[issue['volume']].push(issue);
		}
		return res;
	},
	getIssueArticlesByID: function(id){
		var issueArticles = articles.find({'issue_id' : id},{sort : {page_start:1}}).fetch();
		issueArticles = Meteor.organize.groupArticles(issueArticles);
		return issueArticles;
	},
	groupArticles: function(articles) {
		var articlesL = articles.length;
		var grouped = [];
		for(var i = 0 ; i < articlesL ; i++){
			var type = articles[i]['article_type']['short_name'];
			if(!grouped[type]){
				grouped[type] = [];
				 articles[i]['start_group'] = true;
			}
			//grouped[type].push(articles[i]);
		}
		return articles;
	}
}

Meteor.admin = {
	titleInTable: function(title){
		var txt = document.createElement('textarea');
		txt.innerHTML = title.substring(0,40);
		if(title.length > 40){
			txt.innerHTML += '...';
		}
		return txt.value;
	}
}

Meteor.adminArticle = {
	getAffiliations: function(){
		var affiliations = [];
		$('.article-affiliation').each(function(idx,obj){
			affiliations.push($(this).val());
		});
		return affiliations;
	},
	updateAffiliationsOrder: function(newIndex){
		var originalIndex = Session.get('affIndex');
		var article = Session.get('article');

		// update the order of affiliations in the author objects
		for(var a = 0; a < article.authors.length ; a++){
			var affs = article['authors'][a]['affiliations_list'];
			var movedAff = affs[originalIndex];
			affs.splice(originalIndex,1);
			affs.splice(newIndex, 0, movedAff);
			article['authors'][a]['affiliations_list'] = affs;
		}

		Session.set('article',article);
	},
	preProcessArticle: function(){
		// console.log('..preProcessArticle');
		var article = Session.get('article');
		var articleId = Session.get('article-id');
		var preprocess = Session.get('preprocess-article');
		if(!article){
			article = articles.findOne({'_id': articleId});
			// for /admin/article. We haven't set the session variable yet.
			// This gets triggered in the template helper,
			// and that template & helper are shared on 2 different pages (article and submissions)
		}
		if(preprocess && articleId){
			if(article){
				// add ALL affiliations for article to author object, for checkbox input
				var affs = article.affiliations;
				var authorsList = article.authors;
				for(var i=0 ; i < authorsList.length; i++){
					var current = authorsList[i]['affiliations_numbers'];
					var authorAffiliationsEditable = [];
					if(authorsList[i]['ids']['mongo_id']){
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

				// add ALL issues
				var volumesList = volumes.find().fetch();
				var issuesList = issues.find().fetch();
				if(article.issue_id){
					for(var i=0 ; i<issuesList.length ; i++){
						if(issuesList[i]['_id'] === article.issue_id){
							issuesList[i]['selected'] = true;
						}
					}
				}
				article.volumes = Meteor.organize.issuesIntoVolumes(volumesList,issuesList);

				// pubstatus
				article['pub_status_list'] = pubStatusTranslate;
				var statusFound = false;
				if(article['pub_status']){
					var pubStatusDisable = true;
				}
				for(var p = 0; p < pubStatusTranslate.length; p++){
					if(article['pub_status_list'][p]['abbrev'] == article['pub_status']){
						article['pub_status_list'][p]['selected'] = true;
						statusFound = true;
					}
					if(!statusFound){
						article['pub_status_list'][p]['disabled'] = true;
					}
				}

				// add ALL article types
				var articleType = article['article_type']['name'];
				article['article_type_list'] = [];
				var publisherArticleTypes = articleTypes.find().fetch();
				for(var k =0 ; k < publisherArticleTypes.length ; k++){
					var selectObj = {
						nlm_type: publisherArticleTypes[k]['nlm_type'],
						name: publisherArticleTypes[k]['name'],
						short_name: publisherArticleTypes[k]['short_name']
					}
					if(publisherArticleTypes[k]['name'] === articleType){
						selectObj['selected'] = true;
					}
					article['article_type_list'].push(selectObj);
				}
				Session.set('article',article);
			}
		}
		return article;
	},
	initiateDates: function(){
		// console.log('-- initiateDates');
		// Collection dates don't usually have dd. So using time of day to differentiate date objects that have days and those that don't
		// TIME OF DAY 00:00:00, had a day in the XML. Otherwise did NOT have a day. Just month and year.
		$('.datepicker').each(function(i){
			var datePlaceholderFormat = 'mmmm d, yyyy';
			var placeholder = $(this).attr('placeholder');
			//if placeholder has 3 pieces, then the date should be shown in the placeholder
			var placeholderPieces = placeholder.split(' ');
			if(placeholderPieces.length != 3){
				var datePlaceholderFormat = 'mmmm yyyy';
			}
			var pick = $(this).pickadate({
				format: datePlaceholderFormat
			});
			var picker = pick.pickadate('picker');
			picker.set('select', $(this).data('value'), { format: 'yyyy/mm/dd' });
		});
	},
	addDateOrHistory: function(dateType,e){
		e.preventDefault();
		var article = Session.get('article');
		var type = $(e.target).attr('id').replace('add-','');
		article[dateType][type] = new Date();
		article[dateType][type].setHours(0,0,0,0);
		Session.set('article',article);

		$('#add-article-' + dateType).closeModal();
		$('.lean-overlay').remove();
	},
	removeKeyFromArticleObject: function(articleKey,e){
		e.preventDefault();
		var article = Session.get('article');
		var objectKey = $(e.target).attr('id').replace('remove-',''); //the key of the object in the article doc
		delete article[articleKey][objectKey]; //the key in the object of the article doc
		Session.set('article',article);
	},
	modalListOptions: function(articleKey){
		var allListOptions;
		var addListOptions = {};
		if(articleKey === 'history'){
			allListOptions = dateTypeDateList
		}else if(articleKey === 'dates'){
			allListOptions = pubTypeDateList;
		}else if(articleKey === 'ids'){
			allListOptions = pubIdTypeList;
		}

		if(Session.get('article') && articleKey){
			var article = Session.get('article');
			var current = article[articleKey];
			for(var d in allListOptions){
				if(current[d] === undefined){
					addListOptions[d] = allListOptions[d];
				}
			}
			return addListOptions;
		}
	}
}

Meteor.dataSubmissions = {
	getPiiList: function(){
		var piiList = [];
		$('.data-submission-pii').each(function(){
			var pii = $(this).attr('data-pii');
			piiList.push(pii);
		});
		return piiList;
	},
	getArticles: function(queryType,queryParams){
		// console.log('... getArticles = ' + queryType + ' / ' + queryParams);
		Meteor.dataSubmissions.processing();
		var articleSub = Meteor.subscribe('submission-set',queryType,queryParams);
	},
	processing: function(){
		$('.saving').removeClass('hide');
	},
	doneProcessing: function(){
		$('.saving').addClass('hide');
	},
	errorProcessing: function(){
		Session.set('error',true);
		$('.saving').addClass('hide');
	},
	validateXmlSet: function(){
		$('.saving').removeClass('hide');
		var submissionList = articles.find().fetch();
		// console.log(submissionList);
		Meteor.call('articleSetCiteXmlValidation', submissionList, Meteor.userId(), function(error,result){
			$('.saving').addClass('hide');
			if(error){
				console.log('ERROR - articleSetXmlValidation');
				console.log(error)
			}else if(result === 'invalid'){
				alert('XML set invalid');
			}else{
				//all the articles are valid, now do the download
				window.open('/xml-cite-set/' + result);
			}
		});
	}
}

Meteor.article = {
	affiliationsNumbers: function(article){
		if(article['authors']){
			var authorsList = article['authors'];
			var affiliationsList = article['affiliations'];
			for(var i = 0 ; i < authorsList.length ; i++){
				if(article['authors'][i]['affiliations_numbers']){
					article['authors'][i]['affiliations_numbers'] = [];
					var authorAffiliations = article['authors'][i]['affiliations'];
					for(var a = 0 ; a < authorAffiliations.length ; a++){
						article['authors'][i]['affiliations_numbers'].push(parseInt(affiliationsList.indexOf(authorAffiliations[a]) + 1));
					}
				}
			}
		}
		console.log(article);
		return article;
	},
	subscribeModal: function(e){
		e.preventDefault();
		$("#subscribe-modal").openModal();
		var mongoId = $(e.target).data('id');
		var articleData = articles.findOne({'_id':mongoId});
		Session.set('articleData',articleData);
	},
	downloadPdf: function(e){
		e.preventDefault();
		var mongoId = $(e.target).data('id');
		var articleData = articles.findOne({'_id':mongoId});
		var pmc = articleData.ids.pmc;
		window.open('/pdf/' + pmc + '.pdf');
	}
}

Meteor.adminUser = {
	getFormCheckBoxes: function(){
		var roles = [];
		$('.role-cb').each(function(){
			if($(this).is(':checked')){
				roles.push($(this).val());
			}
		});
		return roles;
	},
	clickedRole: function(e){
		var role = $(e.target).attr('id');
		if($(e.target).is(':checked') && role === 'super-role'){
			$('#admin-role').prop('checked',true);
			$('#articles-role').prop('checked',true);
		}else if($(e.target).is(':checked') && role === 'admin-role'){
			$('#articles-role').prop('checked',true);
		}
	},
	getFormUpdate: function(){
		var user = {};
		user.emails = [];
		user.emails[0] = {};
		user.emails[0].address = $('#email').val();
		user.roles =  Meteor.adminUser.getFormCheckBoxes();
		user.subscribed = $('.sub-cb').is(':checked');

		return user;
	},
	getFormAdd: function(){
		var user = {};
		user.email = $('#email').val();
		user.roles =  Meteor.adminUser.getFormCheckBoxes();
		return user;
	}
}

Meteor.formActions = {
	saving: function(){
		// inline messages
		$('.save-btn').addClass('hide');
		$('.saving').removeClass('hide');
		$('.success').addClass('hide');
		$('.error').addClass('hide');
		//sending and saving forms have shared class names

		//fixed saved button
		if($('#fixed-save-btn').length){
			$('#fixed-save-btn').find('.show-save').addClass('hide');
			$('#fixed-save-btn').find('.show-wait').removeClass('hide');
		}
		// saved button
		if($('#save-btn').length){
			$('#save-btn').find('.show-save').addClass('hide');
			$('#save-btn').find('.show-wait').removeClass('hide');
		}

		//reset
		Session.set('errorMessages',null);
		$('input').removeClass('invalid');
		$('textarea').removeClass('invalid');
		$('input').removeClass('valid');
		$('textarea').removeClass('valid');
	},
	error: function(){
		$('.save-btn').removeClass('hide');
		$('.saving').addClass('hide');
		$('.success').addClass('hide');
		$('.error').removeClass('hide');

		// fixed saved button
		if($('#fixed-save-btn').length){
			$('#fixed-save-btn').find('.show-save').removeClass('hide');
			$('#fixed-save-btn').find('.show-wait').addClass('hide');
		}
		// saved button
		if($('#save-btn').length){
			$('#save-btn').find('.show-save').removeClass('hide');
			$('#save-btn').find('.show-wait').addClass('hide');
		}
	},
	success: function(){
		// inline messages
		$('.save-btn').removeClass('hide');
		$('.saving').addClass('hide');
		$('.success').removeClass('hide');
		$('.error').addClass('hide');


		// fixed saved button
		if($('#fixed-save-btn').length){
			$('#fixed-save-btn').find('.show-save').removeClass('hide');
			$('#fixed-save-btn').find('.show-wait').addClass('hide');
		}
		// saved button
		if($('#save-btn').length){
			$('#save-btn').find('.show-save').removeClass('hide');
			$('#save-btn').find('.show-wait').addClass('hide');
		}

		// success modals
		if($('#success-modal').length){
			$('#success-modal').openModal();
		}
	},
	cleanWysiwyg: function(input){
		return input.replace('<br>','').replace('<p>','').replace('</p>','');
	}
}

Meteor.adminBatch = {
	cleanString: function(string){
		string = string.replace('<italic>','<i>').replace('</italic>','</i>');
		string = string.replace(/(\r\n|\n|\r)/gm,''); // line breaks
		string = string.replace(/\s+/g,' '); // remove extra spaces
		return string;
	}
}

Meteor.ip = {
	dot2num: function(dot){
		var d = dot.split('.');
		return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
	},
	num2dot: function(num) {
		var d = num%256;
		for (var i = 3; i > 0; i--) {
			num = Math.floor(num/256);
			d = num%256 + '.' + d;
		}
		return d;
	}
}