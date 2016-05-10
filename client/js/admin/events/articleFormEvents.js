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
        article.authors[authorIndex].affiliations_list[affIndex].checked = checked;

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
        newAuthor.ids.mongo_id = temp_id;
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

        Meteor.general.scrollTo('affiliations');

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
    // Correspondence
    'click #add-correspondence': function(e,t){
        e.preventDefault();
        var article = Session.get('article-form');
        article.correspondence = Meteor.adminArticleFormGet.correspondence();
        if(!article.correspondence){
            article.correspondence = [];
        }
        article.correspondence.push({});

        Session.set('article-form',article);

        Meteor.general.scrollTo('affiliations');
    },
    'click .remove-correspondence': function(e,t){
        // console.log('------------------------- remove-correspondence');
        e.preventDefault();
        var article = Session.get('article-form');
        var correspondenceIndex = $(e.target).attr('data-index');
        // console.log('correspondenceIndex',correspondenceIndex);

        article.correspondence.splice(correspondenceIndex, 1);
        Session.set('article-form',article);
    },
    // -------
    // Affiliations
    // -------
    'click #add-affiliation': function(e,t){
        e.preventDefault();
        var article = Session.get('article-form');
        // first update the data (in case user edited input), then add empty string as placeholder for all article affiliations
        article.affiliations = Meteor.adminArticleFormGet.affiliations();
        if(!article.affiliations){
            article.affiliations = [];
        }
        article.affiliations.push(' ');

        // add new affiliation object to all author affiliations list array
        if(article.authors){
            for(var i = 0 ; i < article.authors.length ; i++){
                var author_mongo_id = article.authors[i].ids.mongo_id;
                if(!article.authors[i].affiliations_list){
                    article.authors[i].affiliations_list = [];
                }
                article.authors[i].affiliations_list.push({'checked':false,'author_mongo_id':author_mongo_id});
            }
        }

        Session.set('article-form',article);

        Meteor.general.scrollTo('dates');
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
            var authorAffList = article.authors[i].affiliations_list;

            for(var a = 0 ; a < authorAffList.length ; a++){
                var newAuthAffiliations = article.affiliations.splice(affiliationIndex, 1);
                //save checked
                if(authorAffList[a].checked){
                    authorAffiliationsStrings.push(article.affiliations[a]);
                }

                //resets
                authorAffList[a].index = a;
                authorAffList[a].checked = false;

                //remove if this is the one we are looking for
                if(a === parseInt(affiliationIndex)){
                    authorAffList.splice(a,1);
                }

                //update data object
                article.authors[i].affiliations_list = authorAffList;
            }

            // add checked back in
            for(var s = 0 ; s < authorAffiliationsStrings.length ; s++){
                var affString = authorAffiliationsStrings[s];
                var affIndex = article.affiliations.indexOf(affString);
                if(affIndex != affiliationIndex && article.authors[i].affiliations_list[affIndex]){
                    article.authors[i].affiliations_list[affIndex].checked = true;
                    //else, this was the affiliation that was removed
                }
            }
        }
        article.affiliations.splice(affiliationIndex, 1);
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
        if(!article.ids){
            article.ids = {};
        }
        // Special handling for PII. This is required to add/update article. Need to auto increment this ID
        if(type == 'pii'){
            // first make sure that the PII was not removed and then added in same form session.
            // If so, then the PII could already be assigned to the article
            if(!article._id){
                Meteor.call('getNewPii',function(error,newPii){
                    if(error){
                        console.error(error);
                    }else if(newPii){
                        article.ids.pii = newPii;
                        Session.set('article-form',article); // need to set session also here because of timinig problem with methods on server
                    }
                });
            }else{
                Meteor.call('getSavedPii',article._id,function(error,savedPii){
                    if(error){
                        console.error('Get PII', error);
                    }else if(savedPii){
                        article.ids[type] = savedPii;
                        Session.set('article-form',article);// need to set session also here because of timinig problem with methods on server
                    }else{
                        article.ids[type] = '';
                    }
                });
            }
        }else{
            article.ids[type] = '';
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
        var article,
            articleUpdateObj,
            invalid = [];

        article = Session.get('article-form');
        mongoId = article._id;

        articleUpdateObj = Meteor.adminArticleFormGet.all()

        // VALIDATION and SAVE
        // -------
        // result is used for: duplicate article found, invalid inputs found, or if saved. Use result flag to determine (duplicate, invalid, saved).
        if(articleUpdateObj){
            console.log('articleUpdateObj',articleUpdateObj);
            Meteor.call('validateArticle', mongoId, articleUpdateObj, function(error,result){
                if(error){
                    console.error('validateArticle',error);
                }else if(result && result.duplicate){
                    Meteor.formActions.errorMessage('Duplicate Article Found: ' + '<a href="/admin/article/' + result._id + '">' + result.title + '</a>');
                }else if(result && result.invalid_list){
                    Meteor.formActions.invalid(result.invalid_list);
                }else if(result && result.saved){
                    if(!mongoId){
                        mongoId = result.article_id;
                    }
                    Router.go('AdminArticleOverview',{_id : mongoId});
                }
            });
        }else{
             Meteor.formActions.errorMessage('Unable to save form');
        }
    }
});