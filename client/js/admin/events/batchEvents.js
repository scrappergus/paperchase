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
            Meteor.call('batchArticlesWith', search, function(e,r){
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
        });
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
        });
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
        });
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
        });
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
    },
    'click #batch-corresponding': function(e){
        e.preventDefault();
        Meteor.call('batchUpdateCorrespViaXml', function(error,result){
            if(error){
                console.error('batchUpdateCorrespViaXml',error);
            }else{
                console.log(result);
            }
        });
    },
    'click #batch-supp': function(e){
        e.preventDefault();
        Meteor.call('batchUpdateSuppViaXml', function(error,result){
            if(error){
                console.error('batchUpdateSuppViaXml',error);
            }else{
                console.log(result);
            }
        });
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
