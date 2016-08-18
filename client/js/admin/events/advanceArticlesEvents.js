// Advance Articles
// ----------------
Template.AdminAdvanceArticlesResearch.events({
    'submit form': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var researchPapers = {};
        var regular = [];
        $('.recent-research').each(function(){
            if($(this).prop('checked')) {
                researchPapers[$(this).attr('data-article-id')] = true;
            }else{
                researchPapers[$(this).attr('data-article-id')] = false;
            }
        });
        Meteor.call('updateAdvanceResearch', researchPapers, function(error,result){
            if(error){

            }else if(result){
                // console.log('result',result);
                Meteor.formActions.successMessage(result.recent + ' Recent Articles<br>' + result.updated + ' Articles Updated');
            }
        });
    }
});

Template.AdminAdvanceArticles.events({
    'submit form': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        Session.set('savingOrder',true);

        var sectionsOrder = Meteor.advance.getSectionsOrderViaAdmin();

        Meteor.call('makeNewOrder',sectionsOrder,function(error,result){
            if(error){
                Meteor.formActions.errorMessage('Section order not saved');
            }else if(result){
                Session.set('savingOrder',false);
                Session.set('advanceAdmin',null);
                Meteor.call('advancePublish', function(error,result) {
                    if(error){
                        Meteor.formActions.errorMessage('Could not publish');
                    }else if(result){
                        Meteor.formActions.successMessage('Advance was published');
                    }
                });
            }
        });
    },
    'click #save-advance-order': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        Session.set('savingOrder',true);
        var sectionsOrder = Meteor.advance.getSectionsOrderViaAdmin();
        Meteor.call('makeNewOrder',sectionsOrder,function(error,result){
            if(error){
                console.error('makeNewOrder',error);
                Meteor.formActions.errorMessage('Section order not saved');
            }else if(result){
                Session.set('savingOrder',false);
                Session.set('advanceAdmin',null);
                Meteor.formActions.successMessage('Section order saved');
            }
        });
    },
});

Template.AdminAdvanceArticlesDiff.events({
    'click #add-all-ojs': function(e){
        Meteor.formActions.saving();
        e.preventDefault();
        var diff = Session.get('advanceDiff');
        var beforeOjs = diff.ojsOnly;
        var afterOjs = [];
        Meteor.call('ojsAddMissingAdvance',beforeOjs, function(error,addedResult){
            if(error){
                console.error('ojsAddMissingAdvance',error);
                Meteor.formActions.errorMessage('Could not add articles to Paperchase');
            } else if(addedResult) {
                // do not use compareWithLegacy() because takes too long. Instead use result of updated to update session variable
                beforeOjs.forEach(function(ojsArticle){
                    if(addedResult.indexOf(ojsArticle.pii) === -1){
                        afterOjs.push(ojsArticle);
                    }
                });

                diff.ojsOnly = afterOjs;
                diff.paperchaseCount = parseInt(diff.paperchaseCount + addedResult.length);
                Session.set('advanceDiff',diff);
                Meteor.formActions.successMessage(addedResult.length + ' articles added to advance');
            }
        });
    },
    'click #remove-all-paperchase': function(e){
        Meteor.formActions.saving();
        e.preventDefault();
        var diff = Session.get('advanceDiff');
        var removeMongoIds = diff.paperchaseOnly.map(function(article){
            return article._id;
        });

        Meteor.call('batchSorterRemoveItem','advance', removeMongoIds, function(error,removedResult){
            if(removedResult){
                Meteor.call('compareWithLegacy', function(error,result){
                    if(result){
                        Session.set('advanceDiff',result)
                    }
                    if(removedResult.length == removeMongoIds.length){
                        Meteor.formActions.successMessage(removeMongoIds.length + ' Articles Removed');
                    }else{
                        Meteor.formActions.successMessage(removeMongoIds.length + ' Articles Removed. Some were not removed.<br>Requested: ' + removeMongoIds.length + '<br>Removed: ' + removedResult.length);
                    }
                });
            }else{
                message = 'Could not remove articles';
                Meteor.formActions.errorMessage(message);
            }
        });
    }
});

// Advance - remove articles
Template.AdvanceRemoveArticle.events({
    'click .delete-article': function(e){
        Meteor.formActions.saving();
        e.preventDefault();
        var id = $(e.target).attr('data-delete-id');
        Meteor.call('sorterRemoveItem', 'advance', id, function(error,result){
            if(error){
                Meteor.formActions.errorMessage();
            } else if(result) {
                Meteor.formActions.successMessage('Article Removed');
                var legacyArticles = Session.get('advanceLegacy');
                if(legacyArticles){
                    Meteor.call('compareWithLegacy', legacyArticles, function(error,result){
                        if(result){
                            // Meteor.formActions.successMessage('Article Removed');
                            Session.set('advanceDiff',result);
                        }
                    });
                }
            }
        });
    }
});
Template.AdminAdvanceBatchDelete.events({
    'click #advance-batch-delete': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();

        var removeMongoIds = [];
        var removePii = [];
        $('.remove-article').each(function(){
            if($(this).prop('checked')) {
                // console.log('remove: ' + $(this).attr('data-article-id'));
                removeMongoIds.push($(this).attr('data-article-id'));
                removePii.push($(this).attr('data-article-pii'));
            }
        });
        Meteor.call('batchSorterRemoveItem','advance', removeMongoIds, function(error,result){
            var message;
            if(result){
                if($(e.target).data('parent') == 'diff'){
                    // var legacyArticles = Session.get('advanceLegacy');
                    Meteor.call('compareWithLegacy', function(error,result){
                        if(result){
                            Session.set('advanceDiff',result);
                        }
                    });
                }
                if(result.length == removeMongoIds.length){
                    message = removeMongoIds.length + ' Articles Removed <br> ' + removePii.join(', ');
                    Meteor.formActions.successMessage(message);
                }else{
                    message = removeMongoIds.length + ' Articles Removed. Some were not removed.<br>Requested: ' + removeMongoIds.length + '<br>Removed: ' + result.length;
                    Meteor.formActions.successMessage(message);
                }
            }else{
                message = 'Could not remove articles';
                Meteor.formActions.errorMessage(message);
            }
        });
    },
});
