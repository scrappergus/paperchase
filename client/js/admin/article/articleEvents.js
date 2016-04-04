// Articles
// ----------------
Template.AdminArticlesDashboard.events({
	'click #doi-register-check': function(e){
		e.preventDefault();
		///article/:journalname/:pii/doi_status
		Meteor.call('batchDoiRegisteredCheck',function(error,result){
			if(error){
				console.error('ERROR: Batch DOI check',error);
				Meteor.formActions.error();
			}else if(result){
				Meteor.formActions.successMessage(result);
			}
		});
	},
	'click #ojs-batch-update': function(e){
		e.preventDefault();
		// just for Oncotarget
		// TODO: move to server. problem with method within a method. if this click was to call a method that then uses the update method.
		// TODO: include a paperchase owns flag, and skip that article in the batch update. for when an article was edited via paperchase.
		Meteor.call('batchUpdate');
	}
});

// Article
// ----------------
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
			article = Session.get('article-form');
		if($(e.target).prop('checked')){
			checked = true;
		}
		article.authors[authorIndex]['affiliations_list'][affIndex]['checked'] = checked;

		Session.set('article-form',article);
	},
	'click #add-author' : function(e,t){
		e.preventDefault();
		var article = Session.get('article-form');
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

		Session.set('article-form',article);
	},
	'click .remove-author': function(e,t){
		e.preventDefault();
		var article = Session.get('article-form');
		var authorIndex = $(e.target).closest('li').index();
		article.authors.splice(authorIndex,1);
		Session.set('article-form',article);
	},
	// Affiliations
	// -------
	'click #add-affiliation': function(e,t){
		e.preventDefault();
		var article = Session.get('article-form');
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

		Session.set('article-form',article);

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
		var article = Session.get('article-form');
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
		Session.set('article-form',article);
	},
	// Keywords
	// -------
	'click #add-kw': function(e,t){
		e.preventDefault();
		var article = Session.get('article-form');
		if(!article.keywords){
			article.keywords = [];
		}
		article.keywords.push('');
		Session.set('article-form',article);
		if($('.kw-li:last-child').length != 0){
			$('html, body').animate({
				scrollTop: $('.kw-li:last-child').find('input').position().top
			}, 500);
		}
	},
	'click .remove-kw': function(e,t){
		e.preventDefault();
		var article = Session.get('article-form');
		var kwIndex = $(e.target).closest('li').index();
		article.keywords.splice(kwIndex,1);
		Session.set('article-form',article);
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
		var article = Session.get('article-form');
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
						Session.set('article-form',article); // need to set session also here because of timinig problem with methods on server
					}
				});
			}else{
				Meteor.call('getSavedPii',article['_id'],function(error,savedPii){
					if(error){
						console.error('Get PII', error);
					}else if(savedPii){
						// console.log(savedPii);
						article['ids'][type] = savedPii;
						Session.set('article-form',article);// need to set session also here because of timinig problem with methods on server
					}else{
						article['ids'][type] = ''; // TODO: if not found, then article doc exists but no pii.. add new pii via getNewPii method
					}
				});
			}
		}else{
			article['ids'][type] = '';
		}

		Session.set('article-form',article);
		Meteor.adminArticle.articleListButton('ids');
	},
	'click .remove-id': function(e){
		var idType = $(e.target).attr('id').replace('remove-','');
		if(idType != 'pii'){
			Meteor.adminArticle.removeKeyFromArticleObject('ids',e);
		}else if(idType === 'pii'){
			alert('PII cannot be removed from article');
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

		article = Session.get('article-form');
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
					if(typeof result == 'object'){
						Meteor.formActions.errorMessage('Duplicate Article Found: ' + '<a href="/admin/article/' + result._id + '">' + result.title + '</a>');
					}else{
						if(!mongoId){
							mongoId = result;
						}
						Router.go('AdminArticleOverview',{_id : mongoId});
					}
				}
			});
		}
	}
});

// Article Files
// ----------------
Template.s3Upload.events({
	'click button.upload': function(e){
		e.preventDefault();
		Meteor.formActions.saving();
		var article,
			xmlUrl,
			s3Folder,
			articleIds;
		var articleMongoId = $(e.target).closest('button').attr('data-id');
		var files = $('input.file_bag')[0].files;
		var file = files[0];
		// Uploader only allows 1 file at a time.
		// Versioning is based on file name, which is based on MongoID. Filename is articleMongoID.xml
		if(files){
			if(file['type'] == 'text/xml'){
				Meteor.articleFiles.verifyXml(articleMongoId,files);
			}else if(file['type'] == 'application/pdf'){
				Meteor.articleFiles.uploadArticleFile(articleMongoId,'pdf',files);
			}else{
				Meteor.formActions.errorMessage('Uploader is only for PDF or XML');
			}
		}else{
			Meteor.formActions.errorMessage('Please select a PDF or XML file to upload.');
		}
	}
});
Template.AdminArticleFiles.events({
	'submit #files-form': function(e){
		e.preventDefault();
		Meteor.formActions.saving();
		var articleMongoId = $('#article-mongo-id').val();

		var fileSettings = Session.get('article').files;
		var updateObj = {
			pdf: {
				file : fileSettings.pdf.file,
				display: false
			},
			xml: {
				file : fileSettings.xml.file,
				display: false
			}
		}
		//dotted update causing problems with update, so just pass filename with display settings for now

		if($('#display-xml').prop('checked')){
			updateObj.xml.display = true;
		};
		if($('#display-pdf').prop('checked')){
			updateObj.pdf.display  = true;
		};
		Meteor.call('updateArticle',articleMongoId, {files: updateObj}, function(error,result){
			if(error){
				Meteor.formActions.errorMessage();
			}else if(result){
				Meteor.formActions.successMessage('File settings updated');

			}
		});
	}
});
Template.AdminArticleXmlVerify.events({
	'click .upload': function(e){
		var articleMongoId = Session.get('article')._id;
		var files = $('input.file_bag')[0].files;
		Meteor.articleFiles.uploadArticleFile(articleMongoId,'xml',files);
	}
});
Template.AdminArticleFigures.events({
	'click .article-figure-edit': function(e){
		e.preventDefault();
		var figId = $(e.target).closest('button').attr('data-id');
		// console.log(figId);
		Session.set('figureEditing',figId);
		var article = Session.get('article');
		var files = article.files;
		var figures = files.figures;
		figures.forEach(function(fig){
			if(fig.id == figId){
				fig.editing = true;
			}
		});
		article.files.figures = figures;
		Session.set('article',article);
	},
	'click .article-figure-cancel': function(e){
		e.preventDefault();
		var figId = $(e.target).closest('button').attr('data-id');
		// console.log(figId);
		Session.set('figureEditing',figId);
		var article = Session.get('article');
		var files = article.files;
		var figures = files.figures;
		figures.forEach(function(fig){
			if(fig.id == figId){
				fig.editing = false;
			}
		});
		article.files.figures = figures;
		Session.set('article',article);
	}
});
Template.s3FigureUpload.events({
	'click button.upload': function(e){
		// TODO: require FigID
		// TODO: letter handling in fig id
		// TODO: unique FigID

		e.preventDefault();
		Meteor.formActions.saving();
		var xmlUrl,
			s3Folder,
			articleIds;
		var articleMongoId = $('#article-mongo-id').val();

		var s3Folder = 'paper_figures';

		var originalFigId = $(e.target).closest('button').attr('data-id');
		var newFigId = $('#fig-input-' + originalFigId).val();
		if(!newFigId){
			newFigId = originalFigId;
		}
		var files = $('input.file_bag')[0].files;
		var file = files[0];

		if(file){
			var fileNamePieces = file.slice('_');
			// Upload figure to s3
			Meteor.s3.upload(files,s3Folder,function(error,result){
				if(error){
					console.error('Upload File Error', error);
					Meteor.formActions.errorMessage('Figure not uploaded');
				}else if(result){
					// Rename figure to standard convention, mongoid_figid
					Meteor.call('renameArticleFigure', result.file.name, newFigId, articleMongoId, function(error,newFileName){
						if(error){

						}else if(newFileName){
							// Update the figures collection
							var articleInfo = articles.findOne({_id : articleMongoId});
							var articleFigures = Session.get('article').files.figures;
							articleFigures.forEach(function(fig){
								if(fig.id == originalFigId){
									fig.id = newFigId;
									fig.file = newFileName;
								}
								delete fig.editing;
								delete fig.url;
							});
							Meteor.call('updateArticle', articleMongoId, {'files.figures' : articleFigures}, function(error,result){
								if(error){
									Meteor.formActions.errorMessage('Error. Figure uploaded but could not update database.');
								}else if(result){
									Meteor.formActions.successMessage('Figure uploaded.');

									// delete uploaded file, if not equal to MongoID_figId
									if(articleMongoId != fileNamePieces[0]){
										S3.delete('paper_figures/' + file.name,function(error,result){
											if(error){
												console.error('Could not delete original file: ' + file.name);
											}
										});
									}
								}
							});
						}
					});
				}
			});
		}else{
			Meteor.formActions.errorMessage('Please select a figure file to upload.');
		}
	}
});
