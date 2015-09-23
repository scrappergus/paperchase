Template.Admin.events({
	'click .edit-btn': function(e){
		e.preventDefault();
		$('.overview').addClass('hide');
		$('.edit').removeClass('hide');
	}
});
Template.AdminUser.events({
	'click .edit-user': function(e){
		e.preventDefault();
		$('.user-overview').addClass('hide');
		$('.user-edit').removeClass('hide');
	},
	'click .role-cb': function(e){
		Meteor.adminUser.clickedRole(e);
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

/*
FORMS
*/
Template.successMessage.events({
	'click #close-success-msg': function(e){
		e.preventDefault();
		$('.success').addClass('hide');
	}
});

/*
Issue
*/
Template.adminIssue.events({
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

/*
ARTICLE
*/
Template.adminArticle.events({
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var mongoId = t.data.article._id;
		var articleUpdateObj = {};

		//feature
		if($('#feature-checkbox').prop('checked')){
			articleUpdateObj['feature'] = true;
		}else{
			articleUpdateObj['feature'] = false;	
		}

		//advance
		if($('#advance-checkbox').prop('checked')){
			articleUpdateObj['advance'] = true;
		}else{
			articleUpdateObj['advance'] = false;
		}

		//save to db
		Meteor.call('updateArticle', mongoId, articleUpdateObj, function(error,result){
			if(error){
				alert(error.message);
				Meteor.formActions.error();
			}else{
				Meteor.formActions.success();
			}
		});
	}
});

Template.AdminDataSubmissions.events({
	'keydown input': function(e,t){
		var tag = '<div class="chip">Tag<i class="material-icons">close</i></div>'
		if(e.which == 13) {
			e.preventDefault();
			var pii = $(e.target).val();

			//first check if already present
			var piiList = Meteor.dataSubmissions.getPiiList();

			if(piiList.indexOf(pii) === -1){
				$('#search_pii_list').append('<span class="data-submission-pii chip grey lighten-2 left" id="chip-' + pii + '" data-pii="' + pii + '">' + pii + ' <i class="zmdi zmdi-close-circle-o" data-pii="' + pii + '"></i></span>');
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
		Session.set('data-submission-type', 'pii');
		
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
		Session.set('data-submission-data',piiList);
	},
	'submit .form-issue': function(e,t){
		e.preventDefault();
		var issueId = $('#submissions_search_issue').val();
		Session.set('data-submission-type', 'issue');
		Session.set('data-submission-data',issueId);
	},
	'click .clear': function(e){
		e.preventDefault();
		Session.set('data-submission-type', '');
		Session.set('data-submission-data', '');
		//remove all pii list
		$('.data-submission-pii').remove();
	}
})

Template.adminArticleXmlProcess.events({
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

Template.adminBatchXml.events({
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
	}
});
