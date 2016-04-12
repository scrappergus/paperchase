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
    'click .submit': function(e){
        console.log('save!');
        Meteor.formActions.saving();
        Meteor.adminNews.formGetData(e);
    },
    'click .add-news-tag': function(e){
        Meteor.adminNews.showAddNewTag(e);
    },
    'click .cancel-news-tag': function(e){
        Meteor.adminNews.hideAddNewTag(e);
    },
    'click .add-to-tags': function(e){
        e.preventDefault();
        var newTag = $('.news-tag-input').code();
        newTag = Meteor.formActions.cleanWysiwyg(newTag);
        var newsData = Session.get('newsData');
        if(!newsData){
            newsData = {};
        }
        if(!newsData.tags){
            newsData.tags = [];
        }
        newsData.tags.push(newTag);
        Session.set('newsData',newsData);
        $('.news-tag-input').code('');
        Meteor.adminNews.hideAddNewTag(e);
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
                Session.set('article-form',result);
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

// Batch
// ----------------
Template.AdminBatch.events({
    'click #fill-in-pmcid-pmid': function(e){
        e.preventDefault();
        Meteor.call('getMissingPmidPmcViaPii', function(e,r){
            if(e){
                console.error(e);
            }else if(r){
                console.log(r);
            }
        });
    },
    'click #fill-in-pmid' : function(e){
        e.preventDefault();
        Meteor.call('getMissingPubMedIds', function(e,r){
            if(e){
                console.error(e);
            }else if(r){
                console.log(r);
            }
        });
    },
    'click #get-missing-files' : function(e){
        e.preventDefault();
        Meteor.call('getMissingFiles', function(e,r){
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
    'click #xml-audit-csv': function(e){
        e.preventDefault();
        Meteor.formActions.searching();
        Meteor.call('batchRealXml', 'xml', function(e,r){
            if(e){
                console.error(e);
            }else if(r){
                console.log('r',r);
                Meteor.formActions.resultMessage(r);
                // this.redirect('xmlAudit',{data:r});
            }
        });
    },
    'submit #search-xml': function(e){
        e.preventDefault();
        Meteor.formActions.searching();
        var search;
        search = $('#search-for').val();
        if(search){
            Meteor.call('batcharticlesWith', search, function(e,r){
                if(e){
                    Meteor.formActions.errorMessage(e);
                    console.error(e);
                }else if(r){
                    console.log(r);
                    Meteor.formActions.resultMessage(r.toString());
                }
            });
        }else{
            Meteor.formActions.errorMessage('Search is empty. Please enter something to search for in the input.');
        }

    },
    'click #check-all-xml': function(e){
        e.preventDefault();
        Meteor.call('checkAllArticlesFiles', 'xml', function(e,r){
            if(e){
                console.error(e);
            }else if(r){
                console.log(r);
            }
        });
    },
    'click #check-all-pdf': function(e){
        e.preventDefault();
        Meteor.call('checkAllArticlesFiles', 'pdf', function(e,r){
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
    'click #fill-in-article-pubmed-info': function(e){
        // console.log('..get-articles-volume-issue');
        e.preventDefault();
        window.scrollTo(0, 0);
        Meteor.call('getPubMedInfo',function(e,r){
            if(e){
                console.error(e);
                Meteor.formActions.error();
            }else if(r){
                Meteor.formActions.successMessage(r);
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
    //  // match PMID by title
    //  e.preventDefault();
    //  Meteor.call('findDuplicatesAtPubMed',function(error,result){
    //  // Meteor.call('getDateForAopArticles',function(error,result){
    //      if(error){
    //          console.error(error);
    //      }
    //      if(result){
    //          console.log('result');
    //          console.log(result);
    //      }
    //  });
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
    //  //For DOI project
    //  console.log('clicked');
    //  e.preventDefault();
    //  Meteor.call('getDoiForAopArticles',function(error,result){
    //  // Meteor.call('getDateForAopArticles',function(error,result){
    //      if(error){
    //          console.error(error);
    //      }
    //      if(result){
    //          console.log('result');
    //          console.log(result);
    //      }
    //  });
    // },
    // 'click #all-articles-status' : function(e){
    //  //For DOI project
    //  console.log('clicked');
    //  e.preventDefault();
    //  Meteor.call('getPubStatusForAllArticles',function(error,result){
    //      if(error){
    //          console.error(error);
    //      }
    //      if(result){
    //          console.log('result');
    //          console.log(result);
    //      }
    //  });
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
    // 'click #advance-order-update' : function(e){
    //  Deprecated
    //  e.preventDefault();
    //  console.log('clicked');
    //  Meteor.call('batchUpdateAdvanceOrderByPii',function(e,r){
    //      if(e){
    //          console.log('ERROR');
    //          console.log(e);
    //      }else{
    //          console.log('DONE');
    //          console.log(r);
    //      }
    //  });
    // },
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
        //  if(e){
        //      console.log('ERROR');
        //      console.log(e);
        //  }else{
        //      console.log('DONE');
        //      console.log(r);
        //  }
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
