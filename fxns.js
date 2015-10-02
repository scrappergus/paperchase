Meteor.organize = {
	issuesIntoVolumes: function(vol,iss){
		// console.log('-issuesIntoVolumes');
		// console.log('vol');console.log(vol);console.log('iss');console.log(iss);

		var issL = iss.length;

		//group issues by volume
		var issues = []
		for(var i = 0; i < issL ; i++){
			var issue = iss[i];
			if(!issues[issue['volume']]){
				issues[issue['volume']] = [];
			}
			issues[issue['volume']].push(issue);
		}

		//loop through volumes to add issues. this will keep the order descending so that the most recent vol is at the top
		var volL = vol.length;
		for(var idx = 0; idx < volL ; idx++){
			vol[idx]['issues'] = issues[vol[idx]['volume']];
		}
		return vol;
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
		$('.article-affiliations').each(function(idx,obj){
			affiliations.push($(this).val());
		});
		return affiliations;
	},
	updateAffiliationsOrder: function(){
		var article = Session.get('article');
		article.affiliations = Meteor.adminArticle.getAffiliations();
		// console.log('article');console.log(article);
		//the affiliation number is based on index in array. updating the order will update the affiliations number
		Session.set('article',article);
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
	getArticles:function(queryType,queryParams){
		Meteor.dataSubmissions.processing();
		Session.set('submission_list',null);
		Session.set('error',false);
		Meteor.call('getArticlesForDataSubmission', queryType, queryParams, function(error,result){
			if(error){
				console.log('ERROR - getArticlesForDataSubmission');
				console.log(error);
				Meteor.dataSubmissions.errorProcessing();
			}else{
				Meteor.dataSubmissions.doneProcessing();
				Session.set('submission_list',result);
			}
		});
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
		var submissionList = Session.get('submission_list');
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
				if(article['authors'][i]['affiliations']){
					article['authors'][i]['affiliation_numbers'] = [];
					var authorAffiliations = article['authors'][i]['affiliations'];
					for(var a = 0 ; a < authorAffiliations.length ; a++){
						article['authors'][i]['affiliation_numbers'].push(parseInt(affiliationsList.indexOf(authorAffiliations[a]) + 1));
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
		$('.save-btn').addClass('hide');
		$('.saving').removeClass('hide');
		$('.success').addClass('hide');
		$('.error').addClass('hide');
		//sending and saving forms have shared class names

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
	},
	success: function(){
		$('.save-btn').removeClass('hide');
		$('.saving').addClass('hide');
		$('.success').removeClass('hide');
		$('.error').addClass('hide');
	}
}
