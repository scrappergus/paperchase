Meteor.organize = {
	arrDiff: function(a1,a2){
		// Find anything different b/w arrays
		var a=[], diff=[];
		for(var i=0 ; i < a1.length ; i++){
			a[a1[i]]=true;
		}
		for(var i=0 ; i<a2.length ; i++){
			if(a[a2[i]]) delete a[a2[i]];
			else a[a2[i]]=true;
		}
		for(var k in a){
			diff.push(k);

		}
		return diff;
	},
	issuesIntoVolumes: function(volList,issList){
		// console.log('-issuesIntoVolumes');
		// console.log(volList);
		// console.log(issList);
		//group issues by volume
		var issues = Meteor.organize.groupIssuesByVol(issList);

		//loop through volumes to add issues. this will keep the order descending so that the most recent vol is at the top
		var volListLength = volList.length;
		for(var idx = 0; idx < volListLength ; idx++){
			volList[idx]['issues'] = issues[volList[idx]['volume']];
		}
		// console.log(volList);
		return volList;
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
	},
}

Meteor.adminEdBoard = {
	formPrepareData: function(mongoId){
		var member = {};
		if(mongoId){
			member = edboard.findOne({_id : mongoId});
		}
		var edboardRoles = journalConfig.findOne().edboard_roles;
		var edboardRolesTemp = [];
		for(var r=0 ; r<edboardRoles.length ; r++){
			var roleObj = {
				name: edboardRoles[r]
			}
			if(member.role && $.inArray(roleObj.name, member.role) > -1){
				roleObj['selected'] = true;
			}
			edboardRolesTemp.push(roleObj);
		}
		member.roles = edboardRolesTemp.reverse(); // Reversed so that lowest ranked role is listed first in the select option in template
		// console.log(member);
		return member;
	},
	formGetData: function(e){
		// console.log('..edboard formGetData');
		e.preventDefault();
		var memberMongoId,
			success;
		Meteor.formActions.saving();
		$('input').removeClass('invalid');
		// Name
		// ------
		var member = {};
		member.name_first = $('#member-name-first').val();
		member.name_middle = $('#member-name-middle').val();
		member.name_last = $('#member-name-last').val();

		// Address
		// ------
		var memberAddress = $('.member-address').code();
		memberAddress = Meteor.formActions.cleanWysiwyg(memberAddress);
		if(memberAddress != ''){
			member.address = memberAddress;
		}

		// Bio
		// ------
		var memberBio = $('.member-bio').code();
		memberBio = Meteor.formActions.cleanWysiwyg(memberBio);
		if(memberBio != ''){
			member.bio = memberBio;
		}

		// Role
		// ------
		member.role = [];
		$('.roles').each(function(){
			if($(this).is(':checked')){
				member.role.push($(this).val());
			}
		});

		// TODO: add check for if name exists?
		// TODO: validation
		// console.log(member);
		memberMongoId = $('#member-mongo-id').val();
		if(!memberMongoId){
			// Insert
			success = edboard.insert(member);
		}else{
			// Update
			success = edboard.update({_id : memberMongoId} , {$set: member});
		}
		if(success){
			Meteor.formActions.success();
		}
	},
	readyForm: function(){
		// Address
		// ------
		$('.member-address').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview']]
			]
		});

		// Bio
		// ------
		$('.member-bio').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview']]
			]
		});
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
		if(!article[dateType]){
			article[dateType] = {};
		}
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
	articleListOptions: function(articleKey){
		// console.log('..articleListOptions');
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
			var current = article[articleKey]; // what the article has saved
			for(var d in allListOptions){
				if(!current || current[d] === undefined){ // do not test for empty string, adding a new ID type will add empty string to articles session variable
					addListOptions[d] = allListOptions[d]; // add the other available options
				}
			}
			return addListOptions;
		}
	},
	articleListButton: function(type){
		// console.log('..articleListButton = ' + type);
		if($('.add-article-' + type).hasClass('hide')){
			// console.log('SHOW');
			$('.add-article-' + type).removeClass('hide');
			$('#add-' + type).html('<i class="zmdi zmdi-caret-up-circle"></i>');
		}else{
			// console.log('HIDE');
			$('.add-article-' + type).addClass('hide');
			$('#add-' + type).html('<i class="zmdi zmdi-plus-circle"></i>');
			$('#add-' + type).removeClass('expanded');
		}
	},
	readyArticleForm: function(){
		// console.log('..readyArticleForm');
		// console.log(Session.get('article'));

		// title
		// ------
		$('.article-title').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview']]
			]
		});

		// abstract
		// ------
		$('.article-abstract').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview']]
			]
		});

		// dates - handled in template helper, article. uses function to loop through dates and initiate
		// ------
		Meteor.adminArticle.initiateDates();

		// issue, article type
		// ------
		// selects
		$('#article-issue').material_select();
		$('#article-type').material_select();;
		$('#article-pub-status').material_select();

		// modals
		// ------
		$('#success-modal').leanModal();
	},
	initiateAuthorsSortable: function(){
		$('.authors-list').sortable();
	},
	initiateAffiliationsSortable: function(){
		$('.affiliations-list').sortable({
			start: function( event, ui ) {
				Session.set('affIndex',ui.item.index());
			},
			update: function( event, ui ) {
				var newIndex = ui.item.index();
				Meteor.adminArticle.updateAffiliationsOrder(newIndex);
			},
		});
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
	// articleExists: function(id,fullText){
	// 	console.log('..articleExists = ' + id);
	// 	var articleExists = articles.findOne({'_id': id});
	// 	// console.log('articleExists = ');
	// 	// console.log(articleExists);
	// 	if(!articleExists){
	// 		var articlePii = String(id);
	// 		var articleByPii = articles.findOne({'ids.pii': articlePii});
	// 		// console.log('articleByPii = ');
	// 		// console.log(articleByPii);
	// 		// check if :_id is a pii and not Mongo ID
	// 		if(articleByPii && fullText){
	// 			// console.log('redirect');
	// 			Router.go('ArticleText', {_id: articleByPii._id});
	// 		}else if(articleByPii && !fullText){
	// 			Router.go('Article', {_id: articleByPii._id});
	// 		}else{
	// 			Router.go('ArticleNotFound');
	// 		}
	// 	}else{
	// 		return true;
	// 	}
	// },
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
	invalid: function(invalidData){
		var invalidString = '';
		for(var i=0 ; i < invalidData.length ; i++){
			$('.' + invalidData[i]['input_class']).addClass('invalid');
			// TODO: adding invalid class does not work for WYSIWYG
			invalidString += invalidData[i]['message'] + '    ';
			if(i === 0){
				$('html, body').animate({
					scrollTop: $('.' + invalidData[i]['input_class']).position().top
				}, 500);
			}
		}

		alert(invalidString);

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
	removePastedStyle: function(e){
		e.preventDefault();
		// console.log('..removePastedStyle');
		// for Wysiwyg
		//remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
		var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
		document.execCommand('insertText', false, bufferText);
	},
	cleanWysiwyg: function(input){
		return input.replace(/<br>/g,'').replace(/<p[^>]*>/g,'').replace(/<\/p[^>]*>/g,'');
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

Meteor.adminForAuthors = {
	readyForm: function(){
		// Section title
		// ---------------
		$('.section-title').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview']]
			]
		});
		// Section content
		// ---------------
		$('.section-content').materialnote({
			onPaste: function(e){
				Meteor.formActions.removePastedStyle(e);
			},
			toolbar: [
				['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['undo', ['undo', 'redo', 'help']],
				['misc', ['codeview','link']],
				['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
			]
		});
	},
	formGetData: function(e){
		// console.log('..formGetData forAuthors');
		e.preventDefault();
		var forDb = {}

		// Section title
		// ---------------
		var title = $('.section-title').code();
		// console.log(title);
		title = Meteor.formActions.cleanWysiwyg(title);
		if(title != ''){
			forDb.title = title;
		}

		// Section content
		// ---------------
		var section = $('.section-content').code();
		// section = Meteor.formActions.cleanWysiwyg(section);
		if(section != ''){
			forDb.content = section;
		}

		// Check if section exists via Mongo ID hidden input
		mongoId = $('#section-mongo-id').val();
		if(!mongoId){
			// Insert
			success = forAuthors.insert(forDb);
			// Update sorters collection
			Meteor.call('sorterAddArticle','forAuthors',success);
		}else{
			// Update
			success = forAuthors.update({_id : mongoId} , {$set: forDb});
		}
		if(success){
			// Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
			Session.set('showForm',false);
			Session.set('sectionId',null);
		}
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

Meteor.general = {
	navHeight: function(){
		return $('nav').height();
	},
	footerHeight: function(){
		return $('footer').height();
	},
	scrollAnchor: function(e){
		e.preventDefault();
		var anchor = $(e.target).attr('href');
		var navTop = Meteor.general.navHeight();
		if(anchor){
			anchor = anchor.replace('#','');
			$('html, body').animate({
				scrollTop: $('#' + anchor).position().top - navTop
			}, 500);
		}
	}
}