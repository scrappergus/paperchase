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
		$('#processing-response').removeClass('hide');
	},
	doneProcessing: function(){
		$('#processing-response').addClass('hide');
	},
	errorProcessing: function(){
		Session.set('error',true);
		$('#processing-response').addClass('hide');
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
	},
	error: function(){
		$('.save-btn').removeClass('hide');
		$('.saving').addClass('hide');
		$('.success').addClass('hide');
	},
	success: function(){
		$('.save-btn').removeClass('hide');
		$('.saving').addClass('hide');
		$('.success').removeClass('hide');
	}
}
