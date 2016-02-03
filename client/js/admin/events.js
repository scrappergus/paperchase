Template.Admin.events({
	'click .edit-btn': function(e){
		e.preventDefault();
		$('.overview').addClass('hide');
		$('.edit').removeClass('hide');
	}
});


// Site Control
// ----------------
Template.AdminSiteControl.events({
	'submit form': function(e){
		Meteor.adminSite.formGetData(e);
	}
});

// DOI Status
// --------------------
Template.piiFilter.events({
   'keyup .pii-filter-input, input .pii-filter-input': function (e, template) {
		var input = $(e.target).val();
		// console.log('input',input);
		template.filter.set(input);
	}
});

// Editorial Board
// ----------------
Template.AdminEditorialBoardForm.events({
	'submit form': function(e){
		Meteor.adminEdBoard.formGetData(e);
	}
});

// For Authors
// ----------------
Template.AdminForAuthors.events({
	'click #add-section': function(e){
		Session.set('showForm',true);
		Session.set('sectionId', null);

		$('html, body').animate({
			scrollTop: $('#add-section-container').position().top
		}, 500);
	},
	'click .edit-section': function(e){
		e.preventDefault();
		var sectionId = $(e.target).attr('id');
		Session.set('sectionId',sectionId);
	},
	'click #save-section-order': function(e){
		e.preventDefault();
		var order = [];
		$('.sections-list li').each(function(){
			var sectionMongoId = $(this).attr('id').replace('section-title-','');
			order.push(sectionMongoId);
		});
		Meteor.call('updateList', 'forAuthors', order, function(error,result){
			if(error){
				console.log('error - updateList forAuthors');
				console.log(error);
			}
			if(result){
				Meteor.formActions.success();
			}
		});
	}
});
Template.AdminForAuthorsForm.events({
	'submit form': function(e){
		Meteor.formActions.saving();
		Meteor.adminForAuthors.formGetData(e);
	}
});

// About
// ----------------
Template.AdminAbout.events({
	'click #add-about-section': function(e){
		Session.set('showAboutForm',true);
		Session.set('aboutSectionId', null);

		$('html, body').animate({
			scrollTop: $('#add-about-section-container').position().top
		}, 500);
	},
	'click .edit-section': function(e){
		e.preventDefault();
		var sectionId = $(e.target).attr('id');
		// console.log(sectionId);
		Session.set('aboutSectionId',sectionId);
	},
	'click #save-about-section-order': function(e){
		e.preventDefault();
		var order = [];
		$('.sections-list li').each(function(){
			var sectionMongoId = $(this).attr('id').replace('section-title-','');
			order.push(sectionMongoId);
		});
		// console.log(order);
		Meteor.call('updateList', 'about', order, function(error,result){
			if(error){
				console.log('error - updateList about');
				console.log(error);
			}
			if(result){
				Meteor.formActions.success();
			}
		});
	}
});
Template.AdminAboutForm.events({
	'submit form': function(e){
		Meteor.formActions.saving();
		Meteor.adminAbout.formGetData(e);
	}
});

// News
// --------------------
Template.AdminNewsForm.events({
	'submit form': function(e){
		Meteor.formActions.saving();
		Meteor.adminNews.formGetData(e);
	}
});

// Sections
// ----------------
Template.AdminSections.events({
	'click .edit-section': function(e){
		e.preventDefault();
		var paperSectionId = $(e.target).closest('button').attr('id');
		Session.set('paperSectionId',paperSectionId);
	},
	'click .btn-cancel': function(e){
		e.preventDefault();
		Session.set('paperSectionId',null);
	}
});
Template.AdminSectionsForm.events({
	'submit form': function(e){
		Meteor.formActions.saving();
		Meteor.adminSections.formGetData(e);
		// for when editing a section name on the sections list admin page
		Session.set('paperSectionId',null); // hides form
	}
});

// Users
// ----------------
Template.AdminUser.events({
	'click .edit-user': function(e){
		e.preventDefault();
		$('.user-overview').addClass('hide');
		$('.user-edit').removeClass('hide');
	},
	'click .role-cb': function(e){
		Meteor.adminUser.clickedRole(e);
	},
	'click .cancel-user-edit': function(e){
		$('.overview').removeClass('hide');
		$('.edit').addClass('hide');
	},
	'submit form': function(e){
		e.preventDefault();
		$('input').removeClass('invalid');
		//gather info
		var userId = $('#user-id').val();
		var user = Meteor.adminUser.getFormUpdate();

		//TODO: additional validate email
		// var emailValid = Meteor.validate.email(user.emails[0]);
		// if(!emailValid){
		// 	$('#email').addClass('invalid');
		// }else{
			Meteor.users.update({'_id':userId},{$set:user}, function (error) {
				if(error){
					alert('Error '+error);
				}else{
					alert('Saved');
				}
			});
		// }
	}
});
Template.AdminUserSubs.events({
        'submit form' : function(e,t) {
            e.preventDefault();
            Meteor.formActions.saving();

            var subs = [];
            $('.sub-cb').each(function() {
                    if($(this).prop('checked')) {
                        var v = $(this).attr('data-volume');
                        var i = $(this).attr('data-issue');

                        subs.push(obj = {
                            type: 'issue'
                            ,volume: v
                            ,issue: i
                        });



                    }
                });

            Meteor.call('updateSubs', t.data.u._id,  subs, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });

        }
});
Template.AdminAddUser.events({
	'click .role-cb': function(e){
		Meteor.adminUser.clickedRole(e);
	},
	'submit form': function(e){
		e.preventDefault();
		$('input').removeClass('invalid');
		//gather info
		var user = Meteor.adminUser.getFormAdd();
		user.password = 'AgingPassword';

		//TODO: additional validate email
		Meteor.call('addUser', user, function( error, result ){
			if( error ){
				alert('ERROR! ' + error );
			}else{
				alert('User was created!');
			}
		})
	}
});

// Forms - General
// ----------------
Template.successMessage.events({
	'click #close-success-msg': function(e){
		e.preventDefault();
		$('.success').addClass('hide');
	}
});
Template.Success.events({
	'click #close-success-msg': function(e){
		e.preventDefault();
		$('.success').addClass('hide');
	}
});
Template.SendingSuccessMessage.events({
	'click #close-success-msg': function(e){
		e.preventDefault();
		$('.success').addClass('hide');
	}
});

// Volume
// ----------------
Template.AdminVolume.events({
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var issueOrder = [];
		var volumeId = Session.get('volume')._id;
		$('#volume-issues-list li').each(function(){
			issueOrder.push($(this).attr('id'));
		});
		Meteor.call('updateVolume',volumeId,{$set:{'issues':issueOrder}},function(updateError,updateRes){
			if(updateError){
				console.error('updateVolume ERROR', updateError);
				Meteor.formActions.error();
			}else if(updateRes){
				Meteor.formActions.success();
			}
		});
	}
});


// Issue
// ----------------
Template.AdminIssue.events({
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var mongoId = t.data.issue._id;
		var date = $('#issue-date').val();
		date = new Date(date);
		var updateObj = {
			'pub_date' : date
		}
		Meteor.call('updateIssue', mongoId, updateObj, function(error, result){
			if(error){
				console.log('ERROR');
				console.log(error);
				Meteor.formActions.error();
			}else{
				Meteor.formActions.success();
			}
		});
	}
});

// Article
// ----------------
Template.adminArticlesDashboard.events({
	'click #ojs-batch-update': function(e){
		e.preventDefault();
		// just for Oncotarget
		// TODO: move to server. problem with method within a method. if this click was to call a method that then uses the update method.
		// TODO: include a paperchase owns flag, and skip that article in the batch update. for when an article was edited via paperchase.
		Meteor.call('batchUpdate');
	}
});
Template.AdminArticleForm.events({
	'click .anchor': function(e){
		Meteor.general.scrollAnchor(e);
	},
	// Authors
	// -------
	'change .author-affiliation':function(e,t){
		var checked = false;
			authorIndex = $(e.target).closest('li').index(),
			checkboxSettings = $(e.target).attr('id').split('-'),
			affIndex = checkboxSettings[1],
			article = Session.get('article');
		if($(e.target).prop('checked')){
			checked = true;
		}
		article.authors[authorIndex]['affiliations_list'][affIndex]['checked'] = checked;

		Session.set('article',article);
	},
	'click #add-author' : function(e,t){
		e.preventDefault();
		var article = Session.get('article');
		var newAuthor = {
			name_first: '',
			name_middle: '',
			name_last: '',
			ids: {},
			affiliations_list: []
		}
		// need this random number for uniqueness of checkboxes. for authors in the db, it is the mongo id
		var temp_id = Math.random().toString(36).substring(7);
		newAuthor['ids']['mongo_id'] = temp_id;
		if(article.affiliations){
			for(var i = 0; i < article.affiliations.length ; i++){
				newAuthor.affiliations_list.push({
					author_mongo_id : temp_id,
					checked: false,
				})
			}
		}
		if(!article.authors){
			article.authors = [];
		}
		article.authors.push(newAuthor);

		// scroll to new affiliation <li>
		// if no .author-li:last-child, just added first author. The dom isn't updated yet, so technically last-child is not the one just added
		if($('.author-li:last-child').length != 0){
			$('html, body').animate({
				scrollTop: $('.author-li:last-child').find('input').position().top
			}, 500);
		}

		if($('.author-li').length > 0){
			Meteor.adminArticle.initiateAuthorsSortable();
		}

		Session.set('article',article);
	},
	'click .remove-author': function(e,t){
		e.preventDefault();
		var article = Session.get('article');
		var authorIndex = $(e.target).closest('li').index();
		article.authors.splice(authorIndex,1);
		Session.set('article',article);
	},
	// Affiliations
	// -------
	'click #add-affiliation': function(e,t){
		e.preventDefault();
		var article = Session.get('article');
		// first update the data (in case user edited input), then add empty string as placeholder for all article affiliations
		article['affiliations'] = Meteor.adminArticle.getAffiliations();
		if(!article['affiliations']){
			article['affiliations'] = [];
		}
		article['affiliations'].push('NEW AFFILIATION');

		// add new affiliation object to all author affiliations list array
		if(article['authors']){
			for(var i = 0 ; i < article['authors'].length ; i++){
				var author_mongo_id = article['authors'][i]['ids']['mongo_id'];
				if(!article['authors'][i]['affiliations_list']){
					article['authors'][i]['affiliations_list'] = [];
				}
				article['authors'][i]['affiliations_list'].push({'checked':false,'author_mongo_id':author_mongo_id});
			}
		}

		Session.set('article',article);

		// scroll to new affiliation <li>
		// if no .affiliation-li:last-child, just added first affiliation. The dom isn't updated yet, so technically last-child is not the one just added
		if($('.affiliation-li:last-child').length != 0){
			$('html, body').animate({
				scrollTop: $('.affiliation-li:last-child').find('input').position().top
			}, 500);
		}
	},
	'click .remove-affiliation': function(e,t){
		// console.log('------------------------- remove-affiliation');
		e.preventDefault();
		var article = Session.get('article');
		var affiliationIndex = $(e.target).closest('li').index();

		// first keep a record of names before index change, authorAffiliationsString
		// next remove the affiliation from each author,
		// then remove from affiliation list of article

		// console.log('remove = '+affiliationIndex);
		for(var i = 0 ; i < article.authors.length ; i++){
			var authorAffiliationsStrings = [];
			var authorAffList = article['authors'][i]['affiliations_list'];

			for(var a = 0 ; a < authorAffList.length ; a++){
				var newAuthAffiliations = article['affiliations'].splice(affiliationIndex, 1);
				//save checked
				if(authorAffList[a]['checked']){
					authorAffiliationsStrings.push(article['affiliations'][a]);
				}

				//resets
				authorAffList[a]['index'] = a;
				authorAffList[a]['checked'] = false;

				//remove if this is the one we are looking for
				if(a === parseInt(affiliationIndex)){
					authorAffList.splice(a,1);
				}

				//update data object
				article.authors[i]['affiliations_list'] = authorAffList;
			}

			// add checked back in
			for(var s = 0 ; s < authorAffiliationsStrings.length ; s++){
				var affString = authorAffiliationsStrings[s];
				var affIndex = article['affiliations'].indexOf(affString);
				if(affIndex != affiliationIndex && article['authors'][i]['affiliations_list'][affIndex]){
					article['authors'][i]['affiliations_list'][affIndex]['checked'] = true;
					//else, this was the affiliation that was removed
				}
			}
		}
		article['affiliations'].splice(affiliationIndex, 1);
		Session.set('article',article);
	},
	// Keywords
	// -------
	'click #add-kw': function(e,t){
		e.preventDefault();
		var article = Session.get('article');
		if(!article.keywords){
			article.keywords = [];
		}
		article.keywords.push('');
		Session.set('article',article);
		if($('.kw-li:last-child').length != 0){
			$('html, body').animate({
				scrollTop: $('.kw-li:last-child').find('input').position().top
			}, 500);
		}
	},
	'click .remove-kw': function(e,t){
		e.preventDefault();
		var article = Session.get('article');
		var kwIndex = $(e.target).closest('li').index();
		article.keywords.splice(kwIndex,1);
		Session.set('article',article);
	},
	// Dates
	// -------
	'click #add-dates': function(e,t){
		e.preventDefault();
		Meteor.adminArticle.articleListButton('dates');
	},
	'click .add-date-type': function(e){
		Meteor.adminArticle.addDateOrHistory('dates',e);
		Meteor.adminArticle.articleListButton('dates');
	},
	'click .remove-dates': function(e){
		Meteor.adminArticle.removeKeyFromArticleObject('dates',e);
	},
	// History
	// -------
	'click #add-history': function(e,t){
		e.preventDefault();
		Meteor.adminArticle.articleListButton('history');
	},
	'click .add-history-type': function(e){
		Meteor.adminArticle.addDateOrHistory('history',e);
		Meteor.adminArticle.articleListButton('history');
	},
	'click .remove-history': function(e){
		Meteor.adminArticle.removeKeyFromArticleObject('history',e);
	},
	// IDs
	// -------
	'click #add-ids': function(e,t){
		e.preventDefault();
		Meteor.adminArticle.articleListButton('ids');
	},
	'click .add-id-type': function(e){
		e.preventDefault();
		var article = Session.get('article');
		var type = $(e.target).attr('id').replace('add-','');
		if(!article['ids']){
			article['ids'] = {};
		}
		// Special handling for PII. This is required to add/update article. Need to auto increment this ID
		if(type == 'pii'){
			// first make sure that the PII was not removed and then added in same form session.
			// If so, then the PII could already be assigned to the article
			if(!article['_id']){
				Meteor.call('getNewPii',function(error,newPii){
					if(error){
						console.error(error);
					}else if(newPii){
						article['ids']['pii'] = newPii;
						Session.set('article',article); // need to set session also here because of timinig problem with methods on server
					}
				});
			}else{
				Meteor.call('getSavedPii',article['_id'],function(error,savedPii){
					if(error){
						console.error('Get PII', error);
					}else if(savedPii){
						// console.log(savedPii);
						article['ids'][type] = savedPii;
						Session.set('article',article);// need to set session also here because of timinig problem with methods on server
					}else{
						article['ids'][type] = ''; // TODO: if not found, then article doc exists but no pii.. add new pii via getNewPii method
					}
				});
			}
		}else{
			article['ids'][type] = '';
		}

		Session.set('article',article);
		Meteor.adminArticle.articleListButton('ids');
	},
	'click .remove-id': function(e){
		if($(e.target).attr('id').replace('remove-','') != 'pii'){
			Meteor.adminArticle.removeKeyFromArticleObject('ids',e);
		}
	},
	// Submit
	// -------
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var mongoId,
			article,
			articleUpdateObj = {};

		var articleTitle,
			articleAbstract,
			affiliations,
			dates = {},
			history = {},
			authors = [],
			keywords = [],
			ids = {};

		var invalid = [];

		article = Session.get('article');
		mongoId = article['_id'];

		articleUpdateObj.page_start; // integer
		articleUpdateObj.page_end; // integer
		articleUpdateObj.article_type = {}; // Object of name, short name, nlm type
		articleUpdateObj.section = ''; // Mongo ID
		articleUpdateObj.pub_status = ''; // NLM status

		// title
		// -------
		articleTitle = $('.article-title').code();
		articleTitle = Meteor.formActions.cleanWysiwyg(articleTitle);
		articleUpdateObj['title'] = articleTitle;

		// feature
		// -------
		if($('#feature-checkbox').prop('checked')){
			articleUpdateObj['feature'] = true;
		}else{
			articleUpdateObj['feature'] = false;
		}

		// advance
		// -------
		if($('#advance-checkbox').prop('checked')){
			articleUpdateObj['advance'] = true;
		}else{
			articleUpdateObj['advance'] = false;
		}

		// abstract
		// -------
		articleAbstract = $('.article-abstract').code();
		articleAbstract = Meteor.formActions.cleanWysiwyg(articleAbstract);
		articleUpdateObj['abstract'] = articleAbstract;


		// meta
		// -------
		// pages
		if($('#page_start').val()){
			articleUpdateObj['page_start'] = parseInt($('#page_start').val());
		}
		if($('#page_end').val()){
			articleUpdateObj['page_end'] = parseInt($('#page_end').val());
		}
		// select options
		// Issue
		if($('#article-issue').val() != ''){
			articleUpdateObj['issue_id'] = $('#article-issue').val();
		}
		// Article type
		if($('#article-type').val() != ''){
			articleUpdateObj['article_type']['short_name'] = $('#article-type').val();
			articleUpdateObj['article_type']['nlm_type'] = $('#article-type').attr('data-nlm');
			articleUpdateObj['article_type']['name'] = $('#article-type option:selected').text();
		}
		// Article section
		if($('#article-section').val() != ''){
			articleUpdateObj['section'] = $('#article-section').val();
		}
		// Article status
		if($('#article-pub-status').val() != ''){
			articleUpdateObj['pub_status'] = $('#article-pub-status').val();
		}

		// ids
		// -------
		$('.article-id').each(function(i) {
			var k = $(this).attr('id'); //of the form, article-id-key
			k = k.split('-');
			k = k[2];
			ids[k] = $(this).val();
		});

		articleUpdateObj.ids = ids;

		// All affiliations
		// -------
		affiliations = Meteor.adminArticle.getAffiliations();

		// authors
		// -------
		$('.author-row').each(function(idx,obj){
			var author = {
				'name_first' : $(this).find('input[name="name_first"]').val(),
				'name_middle' : $(this).find('input[name="name_middle"]').val(),
				'name_last' : $(this).find('input[name="name_last"]').val(),
				'ids' : {},
				'affiliations_numbers' : []
			};
			var authorIds = $(this).find('.author-id').each(function(i,o){
				author['ids'][$(o).attr('name')] = $(o).val();
			});
			$(this).find('.author-affiliation').each(function(i,o){
				if($(o).prop('checked')){
					author['affiliations_numbers'].push(parseInt(i));
				}
			});
			authors.push(author);
		});
		articleUpdateObj['authors'] = authors;
		articleUpdateObj['affiliations'] = affiliations;


		// dates and history
		// -------
		$('.datepicker').each(function(i){
			var key = $(this).attr('id');
			if($(this).hasClass('date')){
				dates[key] = new Date($(this).val());
			}else if($(this).hasClass('history')){
				history[key] = new Date($(this).val());
			}
		});
		articleUpdateObj['dates'] = dates;
		articleUpdateObj['history'] = history;

		// keywords
		// -------
		$('.kw').each(function(i){
			keywords.push($(this).val());
		});
		articleUpdateObj['keywords'] = keywords;

		// VALIDATION
		// -------
		// title
		if(articleUpdateObj.title === ''){
			invalid.push({
				'fieldset_id' : 'article-title',
				'message' : 'Article title is required'
			});
		}

		// Submit to DB or show invalid errors
		if(invalid.length > 0){
			Meteor.formActions.invalid(invalid);
		}else{
			// save to db
			// -------
			// console.log(articleUpdateObj);
			Meteor.call('updateArticle', mongoId, articleUpdateObj, function(error,result){
				if(error){
					alert(error.message);
					Meteor.formActions.error();
				}else if(result){
					if(!mongoId){
						mongoId = result;
					}
					Router.go('AdminArticleOverview',{_id : mongoId});
				}
			});
		}
	}
});
Template.AdminArticleXmlUpload.events({
	'click .update-article': function(e,t){
		e.preventDefault();
		var articleData = t.data['article'];

		//add who UPDATED this article doc
		articleData['doc_updates'] = {};
		articleData['doc_updates']['last_update_date'] = new Date();
		articleData['doc_updates']['last_update_by'] = Meteor.userId();

		var mongoId = $(e.target).attr('data-mongoid');
		Meteor.call('updateArticle',mongoId,articleData, function(error,res){
			if(error){
				alert('ERROR: '+error.message);
			}else{
				Router.go('adminArticle', {_id:mongoId});
			}
		});
	},
	'click .add-article': function(e,t){
		e.preventDefault();

		var articleData = t.data['article'];

		//add who CREATED this article doc
		articleData['doc_updates'] = {};
		articleData['doc_updates']['created_date'] = new Date();
		articleData['doc_updates']['created_by'] = Meteor.userId();

		Meteor.call('addArticle', articleData, function(error,_id){
			if(error){
				alert('ERROR: ' + error.message);
			}else{
				Router.go('adminArticle', {_id:_id});
			}
		});
	}
});

// Indexers
// ----------------
Template.AdminDataSubmissions.events({
	'keydown input': function(e,t){
		var tag = '<div class="chip">Tag<i class="material-icons">close</i></div>'
		if(e.which == 13) {
			e.preventDefault();
			var pii = $(e.target).val();

			//first check if already present
			var piiList = Meteor.dataSubmissions.getPiiList();

			if(piiList.indexOf(pii) === -1){
				$('#search_pii_list').append('<span class="data-submission-pii chip grey lighten-2 left" id="chip-' + pii + '" data-pii="' + pii + '">' + pii + ' <i class="material-icons" data-pii="' + pii + '">&#xE5CD;</i></span>');
			}else{
				alert('PII already in list');
			}
		}
	},
	'click .zmdi-close-circle-o': function(e,t){
		e.preventDefault();
		var pii = $(e.target).attr('data-pii');
		pii = pii.trim();
		$('#chip-'+pii).remove();
	},
	'submit .form-pii': function(e,t){
		e.preventDefault();

		var piiList = Meteor.dataSubmissions.getPiiList();

		//check if there's anything to add to the array of pii
		if($('#submissions_search_pii').val()){
			var addPii = $('#submissions_search_pii').val();
			//do not add if already present
			if(piiList.indexOf(addPii) === -1){
				piiList.push(addPii);
			}
		}
		if(piiList.length === 0){
			alert('no PII to search');
		}

		//get articles
		var queryType = 'pii',
			queryParams = piiList;

		Meteor.dataSubmissions.getArticles(queryType,queryParams);
	},
	'submit .form-issue': function(e,t){
		e.preventDefault();
		var issueId = $('#submissions_search_issue').val();

		//get articles
		var queryType = 'issue',
			queryParams = issueId;
		Meteor.dataSubmissions.getArticles(queryType,queryParams);
	},
	'click .clear': function(e){
		e.preventDefault();
		// Session.set('submission_list',null);
		Meteor.subscribe('articles-submission',null,null); //just subscribe to nothin to clear the list

		Session.set('error',false);
		$('.data-submission-pii').remove();
		$('.saving').addClass('hide');
	},
	'click #download-set-xml': function(e){
		e.preventDefault();
		Meteor.dataSubmissions.validateXmlSet();
	},
	'click #register-doi-set': function(e){
		e.preventDefault();
		// var submissionList = Session.get('submission_list');
		var submissionList = articles.find().fetch();
		var piiList = '';
		var missingPiiList = [];

		for(var i = 0 ; i < submissionList.length ; i++){
			if(submissionList[i]['ids']['pii']){
				piiList += submissionList[i]['ids']['pii'] + ',';
			}else{
				missingPiiList.push(submissionList[i]['title']);
			}
		}

		if(missingPiiList.length > 0){
			Session.set('missingPii',missingPiiList);
		}
		if(piiList.length > 0){
			Meteor.call('registerDoiSet', piiList, function(error,result){
				if(error){
					console.log('ERROR - registerDoiSet');
					console.log(error);
					alert('Could not register DOIs');
				}
				if(result){
					Meteor.formActions.success();
				}
			});
		}
	},
	'click .edit-article': function(e){
		e.preventDefault();
		// disable other edit buttons
		$('.edit-article').addClass('hide');
		$(e.target).closest('button').removeClass('hide');
		var articleId = $(e.target).closest('button').attr('id').replace('edit-','');
		Meteor.call('preProcessArticle',articleId,function(error,result){
			if(error){
				console.log('ERROR - preProcessArticle');
				console.log(error);
			}
			if(result){
				Session.set('article',result);
			}
		});
		// var articleIndex = $(e.target).closest('.collection-item').index();
		// var article = Session.get('submission_list')[articleIndex];
		// var article =  articles.findOne({'_id' : articleId});

		Session.set('article-id',articleId);
		// Session.set('preprocess-article',true);
		// Session.set('article',article);

		$('#edit-' + articleId).removeClass('hide');
		$('#overview-' + articleId).addClass('hide');
	},
	'click .cancel-article':function(e){
		var articleId = $(e.target).closest('button').attr('id').replace('cancel-','');
		Session.set('article-id',null);
		$('#edit-' + articleId).addClass('hide');
		$('#overview-' + articleId).removeClass('hide');
		$('.edit-article').removeClass('hide');
	}
})

// Advance Articles
// ----------------
Template.AdminAdvanceArticles.events({
	'submit form': function(e){
		e.preventDefault();
		var advance = [],
			remove = [];
		$('.advanced-article').each(function(){
			var mongoId = $(this).attr('id');
			if($(this).prop('checked')){
				advance.push(mongoId);
			}else{
				remove.push(mongoId);
			}
		});
		Meteor.call('updateList', 'advance', advance, remove, function(error,result){
			if(error){
				console.log('ERROR - updateList');
				console.log(error);
			}
			if(result){
				Meteor.formActions.success();
			}
		});
		// just update articles collection, there is a hook to updaate sorters
	}
})

// Batch
// ----------------
Template.AdminBatch.events({
	'click #fill-in-pmcid' : function(e){
		e.preventDefault();
		Meteor.call('getMissingPmids', function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
			}
		});
	},
	'click #get-missing-assets' : function(e){
		e.preventDefault();
		Meteor.call('getMissingAssets', function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
			}
		});
	},
	'click #fill-in-via-pubmed': function(e){
		e.preventDefault();
		Meteor.call('fillInViaPubMed', 'xml', function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
			}
		});
	},
	'click #check-all-xml': function(e){
		e.preventDefault();
		Meteor.call('checkAllArticlesAssets', 'xml', function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
			}
		});
	},
	'click #check-all-pdf': function(e){
		e.preventDefault();
		Meteor.call('checkAllArticlesAssets', 'pdf', function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
			}
		});
	},
	'click #process-all-pdf': function(e){
		e.preventDefault();
		// response takes too long. Do not wait for crawler
		// window.scrollTo(0, 0);

		// Meteor.formActions.saving();
		// console.log('..clicked');
		Meteor.call('getAllPmcPdf',function(e,r){
			if(e){
				console.error(e);
				// Meteor.formActions.error();
			}else if(r){
				console.log(r);
				// Meteor.formActions.successMessage(r + ' PDFs downloaded');
			}
		});
	},
	'click #process-all-pdf': function(e){
		e.preventDefault();
		// response takes too long. Do not wait for crawler
		// window.scrollTo(0, 0);

		// Meteor.formActions.saving();
		// console.log('..clicked');
		Meteor.call('getAllPmcPdf',function(e,r){
			if(e){
				console.error(e);
				// Meteor.formActions.error();
			}else if(r){
				console.log(r);
				// Meteor.formActions.successMessage(r + ' PDFs downloaded');
			}
		});
	},
	'click #get-articles-crossref-dates' : function(e){
		e.preventDefault();
		window.scrollTo(0, 0);
		// console.log('..clicked');
		Meteor.call('getCrossRefEpub',function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
				Meteor.formActions.successMessage(r + ' CrossRef Dates added');
			}
		});
	},
	'click #get-articles-legacy-dates' : function(e){
		e.preventDefault();
		window.scrollTo(0, 0);
		// console.log('..clicked');
		Meteor.call('getLegacyEpub',function(e,r){
			if(e){
				console.error(e);
				Meteor.formActions.error();
			}else if(r){
				console.log(r);
				Meteor.formActions.successMessage(r + ' Legacy Dates added');
			}
		});
	},
	'click #add-paperchase-id' : function(e){
		e.preventDefault();
		window.scrollTo(0, 0);
		Meteor.call('allArticlesAddPaperchaseId',function(e,r){
			if(e){
				console.error(e);
				Meteor.formActions.error();
			}else if(r){
				console.log(r);
				Meteor.formActions.successMessage(r + ' Paperchase ID added');
			}
		})
	},
	'click #initiate-articles' : function(e){
		e.preventDefault();
		window.scrollTo(0, 0);
		Meteor.call('intiateArticleCollection',function(e,r){
			if(e){
				console.error(e);
				Meteor.formActions.error();
			}else if(r){
				console.log(r);
				Meteor.formActions.successMessage(r + ' Articles Collection Created');
			}
		})
	},
	'click #get-articles-pmc-xml' : function(e){
		e.preventDefault();
		window.scrollTo(0, 0);
		Meteor.formActions.saving();
		Meteor.call('getAllArticlesPmcXml',function(e,r){
			if(e){
				console.error(e);
				Meteor.formActions.error();
			}else if(r){
				// console.log('r',r);
				Meteor.formActions.successMessage(r + ' XML Saved');
			}
		});
	},
	'click #process-all-xml' : function(e){
		e.preventDefault();
		Meteor.call('batchProcessXml',function(e,r){
			if(e){
				console.error(e);
			}else if(r){
				console.log(r);
				Meteor.formActions.successMessage(r + ' XML Processed');
			}
		})
	},
	// 'click #get-all-pmid': function(e){
	// 	// match PMID by title
	// 	e.preventDefault();
	// 	Meteor.call('findDuplicatesAtPubMed',function(error,result){
	// 	// Meteor.call('getDateForAopArticles',function(error,result){
	// 		if(error){
	// 			console.error(error);
	// 		}
	// 		if(result){
	// 			console.log('result');
	// 			console.log(result);
	// 		}
	// 	});
	// },
	'click #find-duplicate-pubmed': function(e){
		// For DOI project. well kinda. spin off of project.
		e.preventDefault();
		Meteor.call('findDuplicatesAtPubMed',function(error,result){
		// Meteor.call('getDateForAopArticles',function(error,result){
			if(error){
				console.error(error);
			}
			if(result){
				console.log('result');
				console.log(result);
			}
		});
	},
	// 'click #aop-articles-date' : function(e){
	//	//For DOI project
	// 	console.log('clicked');
	// 	e.preventDefault();
	// 	Meteor.call('getDoiForAopArticles',function(error,result){
	// 	// Meteor.call('getDateForAopArticles',function(error,result){
	// 		if(error){
	// 			console.error(error);
	// 		}
	// 		if(result){
	// 			console.log('result');
	// 			console.log(result);
	// 		}
	// 	});
	// },
	// 'click #all-articles-status' : function(e){
	//	//For DOI project
	// 	console.log('clicked');
	// 	e.preventDefault();
	// 	Meteor.call('getPubStatusForAllArticles',function(error,result){
	// 		if(error){
	// 			console.error(error);
	// 		}
	// 		if(result){
	// 			console.log('result');
	// 			console.log(result);
	// 		}
	// 	});
	// },
	'click #doi-update': function(e){
		e.preventDefault();
		// query for all PMID in journal. then check if DOI already at PubMed, if not then add to output.
		Meteor.call('batchDoiList',function(error,result){
			if(result){
				console.log(result);
			}
		})
	},
	'click #advance-order-update' : function(e){
		e.preventDefault();
		console.log('clicked');
		Meteor.call('batchUpdateAdvanceOrderByPii',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
		});
	},
	'click #get-issue': function(e){
		e.preventDefault();
		// console.log('clicked');
		Meteor.call('fixIssueId',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
			Meteor.call('legacyArticleIntake', obj);
		});

		// Meteor.call('updateAllArticlesAuthorsAffiliations',function(e,r){
		// 	if(e){
		// 		console.log('ERROR');
		// 		console.log(e);
		// 	}else{
		// 		console.log('DONE');
		// 		console.log(r);
		// 	}
		// });
	},
	'click #update-authors-affs': function(e){
		e.preventDefault();
		console.log('clicked');
		Meteor.call('updateAllArticlesAuthorsAffiliations',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
		});
	},
	'click #download-pmc-xml': function(e){
		e.preventDefault();
		Meteor.call('getXMLFromPMC',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
		});
	},
	'click #save-pmc-xml': function(e){
		e.preventDefault();
		Meteor.call('saveXMLFromPMC',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
		});
	},
	'click #get-all-pii': function(e){
		e.preventDefault();
		Meteor.call('getAllArticlesPii',function(e,r){
			if(e){
				console.log('ERROR');
				console.log(e);
			}else{
				console.log('DONE');
				console.log(r);
			}
		});
	},
	'click #get-all-authors-affiliations': function(e,t){
		e.preventDefault();
		Meteor.call('getAllAuthorsAffiliationsPubMed', function(error,result){
			if(error){
				console.log('ERROR');
				console.log(error);
			}
		});
	},
	'click #get-all-pub-status': function(e){
		e.preventDefault();
		Meteor.call('updateAllArticlesPubStatus', function(error,result){
			if(error){
				console.log('ERROR - updateAllArticlesPubStatus');
				console.log(error);
			}
		});
	},
	'click #get-manuscripts': function(e){
		e.preventDefault();
		Meteor.call('getEjpAccepted', function(error,result){
			if(error){
				console.log('ERROR - getEjpAccepted');
				console.log(error);
			}else{
				console.log(result);
			}
		});
	},
	'click #type-fix': function(e){
		Meteor.call('updateAllArticlesTypes');
	}
});
Template.AdminCrawl.events({
	'click #xml-batch-update': function(e){
		e.preventDefault();
		Meteor.formActions.saving();
		var journal = Session.get('journal').journal.short_name;
		Meteor.call('batchUpdateXml',journal,function(error,result){
			// TODO: show error message.
			// TODO: be more specific. because no PMC ID exists for any articles, result is true, but no XML updated
			if(error){
				Meteor.formActions.error();
			}
			if(result){
				Meteor.formActions.success();
			}
		});
	}
});

// S3
// -------------
Template.s3Upload.events({
	'click button.upload': function(){
		Meteor.formActions.saving();
		var xmlUrl;
		var files = $('input.file_bag')[0].files;
		var file = files[0];
		var journalShortName = journalConfig.findOne().journal.short_name;
		// Uploader only allows 1 file at a time.
		// TODO: versioning is based on file name, which is based on PII. Make sure filename is PII.xml
		if(file && file['type'] == 'text/xml'){
			Meteor.call('paperchaseIdFromXmlFileNameCheck',file['name'],function(error, mongoId){
				if(error){
					console.error(error);
					// Paperchase ID not in DB
					// TODO: add control for adding article to DB
					Meteor.formActions.errorMessage(error.details);
				}
				if(mongoId){
					// Paperchase ID exists in DB. Upload XML to S3.
					S3.upload({
						Bucket: 'paperchase-' + journalShortName,
						files: files,
						path: 'xml',
						unique_name: false
					},function(err,res){
						if(err){
							console.error(err);
							Meteor.formActions.errorMessage('XML not uploaded');
						}
						if(res){
							Meteor.formActions.successMessage('XML Uploaded');
							xmlUrl = res.secure_url;
							Session.set('xml-uploaded',true);

							// Post uploading. Parse XML from S3 then preprocess for form
							// Now making user verify information before updating DB
							Meteor.call('parseXmlAfterUpload',xmlUrl, function(e,parsedArticle){
								if(e){
									console.error('XML not parsed from server = ' + xmlUrl);
									console.error(e);
									Meteor.formActions.errorMessage('<b>XML not parsed from server</b> <br/>' + e.error + '<br/>' + xmlUrl);
								}else if(parsedArticle){
									// console.log('parsedArticle=',parsedArticle);
									Meteor.call('preProcessArticle',mongoId,parsedArticle,function(ee,processedArticle){
										if(ee){
											console.error('Could not process article data for form. Mongo ID = ' + mongoId);
											console.error(ee);
											Meteor.formActions.errorMessage('<b>Could not process article data for form<b> <br/>' + xmlUrl);
										}else if(processedArticle){
											// console.log('processedArticle',processedArticle);
											Session.set('article',processedArticle);
										}
									});
								}else{
									console.error('Could not process article data for form. Mongo ID = ' + mongoId);
								}
							});
						}
					});
				}
			});
		}else{
			Meteor.formActions.errorMessage('XML required');
		}
	}
});

// Institutions
// ----------------
Template.AdminInstitution.events({
        'click .del-btn': function(e,t){
            Meteor.call('removeInstitution', this['_id'], function(error, result){
                });
        }
});
Template.AdminInstitutionAdd.events({
        'submit form': function(e,t){
            var formType = Session.get('formType');

            e.preventDefault();
            //        Meteor.formActions.saving();

            //commont to insert and update
            obj = {
                institution: $('[name=institution]').val()
                ,address: $('[name=address]').val()
            };

            Meteor.call('addInstitution', obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });
        }

});
Template.AdminInstitutionForm.onCreated(function() {
	this.showIPFields = new ReactiveVar( false );
});

Template.AdminInstitutionForm.events({
        'click .edit-btn': function(e){
            $(".institution-form").show();
        }
        ,'click .del-btn': function(e,t){
            var mongoId = t.data.institution._id;
            Meteor.call('removeInstitution', mongoId, function(error, result){
                });
        }
        ,'click .add-ip-btn': function(e,t){
            t.showIPFields.set(true);
        }
        ,'click .cancel-new-ip-btn': function(e,t) {
            t.showIPFields.set(false);
        }
        ,'click .save-new-ip-btn': function(e,t) {
            var mongoId = t.data.institution._id;

            var obj = {
                'IPRanges': {startIP: $('.add-startIP').val(), endIP: $('.add-endIP').val()}
            };

            Meteor.call('addIPRangeToInstitution', mongoId, obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                        t.showIPFields.set(false);
                    }
                });

        }
        ,'click .del-ip-btn': function(e,t) {
            var mongoId = t.data.institution._id;
            console.log(this);
            console.log(mongoId);

            obj = {
                'IPRanges': this
            };

            Meteor.call('removeInstitutionIPRange', mongoId, obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });

        }
        ,'submit form': function(e,t){
            var formType = Session.get('formType');

            e.preventDefault();
            //        Meteor.formActions.saving();

            //commont to insert and update
            obj = {
                institution: $('[name=institution]').val()
                ,address: $('[name=address]').val()
            };

            var mongoId = t.data.institution._id;

            obj.IPRanges = [];

            $('.iprange-start').each(function(a,b,c) {
                    obj.IPRanges[a] = {startIP: $(this).val()};
                });

            $('.iprange-end').each(function(a,b,c) {
                    obj.IPRanges[a]['endIP'] = $(this).val();
                });


            Meteor.call('updateInstitution', mongoId, obj, function(error, result){
                    if(error){
                        console.log('ERROR');
                        console.log(error);
                        Meteor.formActions.error();
                    }else{
                        Meteor.formActions.success();
                    }
                });
        }
});

// Recommend
// ----------------
Template.AdminRecommendationUpdate.events({
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var inputs = {};
		if(!$('#institution_contact').prop('disabled')){
			inputs['contacted'] = $('#institution_contact').prop('checked');
		}

		inputs['correspondence_notes'] = $('#correspondence_notes').val();

		Meteor.call('updateRecommendation', inputs, this._id, function(error, result){
			if(error){
				console.log('ERROR - updateRecommendation');
				console.log(error);
			}else{
				console.log(result);
				Meteor.formActions.success();
			}
		});
	}
});
