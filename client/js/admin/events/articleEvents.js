// Articles
// ----------------
Template.AdminArticlesDashboard.events({
    'click #doi-register-check': function(e){
        e.preventDefault();
        Meteor.formActions.processing();
        ///article/:journalname/:pii/doi_status
        Meteor.call('batchDoiRegisteredCheck',function(error,result){
            if(error){
                console.error('ERROR: Batch DOI check',error);
                Meteor.formActions.error();
            }else if(result){
                Meteor.formActions.successMessage(result);
            }
        });
    }
});

Template.OncotargetOjsBatch.events({
    'click #ojs-batch-update': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        Meteor.call('batchUpdate',function(error,result){
            if(error){

            }else if(result){

            }
        });
    },
    'click #ojs-batch-update-dates': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        Meteor.call('batchUpdateWithoutDates',function(error,result){
            if(error){

            }else if(result){

            }
        });
    }
});

// Article
// ----------------
Template.AdminArticleButtons.events({
    'click .crawl-xml': function (e) {
        e.preventDefault();
        var pii = e.target.dataset.pii;
        var mid = e.target.dataset.mongoid;
        Meteor.call('crawlXmlById', mid, function (err, res) {
            if ( err) {
                console.error('ERROR: calling crawler', error);
                return Meteor.formActions.error();
            }
            Meteor.formActions.successMessage('crawled article ' + mid);
        });
    },

    'click .crawl-pdf': function (e) {
        e.preventDefault();
        var pii = e.target.dataset.pii;
        var mid = e.target.dataset.mongoid;
        Meteor.call('crawlPdfById', mid, function (err, res) {
            if ( err) {
                console.error('ERROR: calling crawler', error);
                return Meteor.formActions.error();
            }
            Meteor.formActions.successMessage('crawled article ' + mid);
        });
    },
    'click .crawl-figures': function (e) {
        e.preventDefault();
        var pii = e.target.dataset.pii;
        Meteor.call('crawlFiguresByPii', pii, function (err, res) {
            if ( err) {
                console.error('ERROR: calling crawler', error);
                return Meteor.formActions.error();
            }
            Meteor.formActions.successMessage('crawled article ' + pii);
        });
    },
    'click .crawl-supplements': function (e) {
        e.preventDefault();
        var pii = e.target.dataset.pii;
        Meteor.call('crawlSuplementsByPii', pii, function (err, res) {
            if ( err) {
                console.error('ERROR: calling crawler', error);
                return Meteor.formActions.error();
            }
            Meteor.formActions.successMessage('crawled article ' + pii);
        });
    },
});

// Article Files
// ----------------
Template.s3ArticleFilesUpload.events({
    'click #upload-request': function(e){
        // console.log('s3ArticleFilesUpload');
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
            if(file.type == 'text/xml'){
                Meteor.articleFiles.verifyXml(articleMongoId,files);
            }else if(file.type == 'application/pdf'){
                Meteor.articleFiles.uploadArticleFile(articleMongoId,'pdf',files);
            }else{
                Meteor.formActions.errorMessage('Uploader is only for PDF or XML');
            }
        }else{
            Meteor.formActions.errorMessage('Please select a PDF or XML file to upload.');
        }
    },
    'click .btn-cancel': function(e){
        e.preventDefault();
        Session.set('article-form',null);
        Session.set('xml-verify',false);
    },
    // 'click #xml-verified': function(e){
    // now only using 1 button to save to db and upload
    //     var articleMongoId = Session.get('article')._id;
    //     var files = $('input.file_bag')[0].files;
    //     Meteor.articleFiles.uploadArticleFile(articleMongoId,'xml',files);
    // }
});
Template.s3UploadNewArticle.events({
    'click button.upload': function(e){
        // console.log('click');
        e.preventDefault();
        Meteor.formActions.saving();
        var article,
            xmlUrl,
            s3Folder,
            articleIds;
        var files = $('input.file_bag')[0].files;
        var file = files[0];
        // Uploader only allows 1 file at a time.
        // Versioning is based on file name, which is based on MongoID. Filename is articleMongoID.xml
        if(files){
            if(file.type == 'text/xml'){
                Meteor.articleFiles.verifyNewXml(files);
            }else{
                Meteor.formActions.errorMessage('Uploader is only for XML');
            }
        }else{
            Meteor.formActions.errorMessage('Please select XML file to upload.');
        }
    }
});
Template.AdminArticleFiles.events({
    'submit #files-form': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var articleMongoId = $('#article-mongo-id').val();

        var fileSettings = Session.get('article').files;

        var pdfFile,
            xmlFile;

        if(fileSettings.pdf && fileSettings.pdf.file){
            pdfFile = fileSettings.pdf.file;
        }
        if(fileSettings.xml && fileSettings.xml.file){
            xmlFile = fileSettings.xml.file;
        }

        var updateObj = {
            pdf: {
                file : pdfFile,
                display: false
            },
            xml: {
                file : xmlFile,
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
        Session.set('figureEditing',null);
        var figId = $(e.target).closest('button').attr('data-id');
        if(figId === 'new'){
            $('#article-figure-request').removeClass('hide');
            $('#article-figure-uploader').addClass('hide');
        }else{
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
    },
    'click .article-figure-delete': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var articleMongoId = Session.get('article')._id;
        var fileSettings = Session.get('article').files;
        var figId = $(e.target).closest('button').attr('data-id');
        var figures = fileSettings.figures;
        var newFigures = [],
            figToDelete;
        figures.forEach(function(fig){
            if(fig.id == figId){
                figToDelete = fig.file;
            }else{
                newFigures.push(fig);
            }
        });
        if(figToDelete){
            S3.delete('paper_figures/' + figToDelete, function(error,result){
                if(error){
                    console.error('Could not delete figure file: ' + figToDelete);
                }else{
                    Meteor.formActions.successMessage(result);
                }
            });
        }
    },
    'click .article-figure-add': function(e){
        e.preventDefault();
        $('#article-figure-request').addClass('hide');
        $('#article-figure-uploader').removeClass('hide');
    }
});
Template.s3FigureUpload.events({
    'click button.upload': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var articleMongoId = Session.get('article')._id;
        var xmlUrl,
            s3Folder,
            articleIds,
            updatedFilename,
            fileNamePieces,
            figureVerified;

        var originalFigId = $(e.target).closest('button').attr('data-id');
        var newFigId = $('#fig-input-' + originalFigId).val();
        if(!newFigId){
            newFigId = originalFigId;
        }
        var files = $('input.file_bag[data-id="' + originalFigId +'"]')[0].files;

        figureVerified = Meteor.articleFiles.verifyFigure(originalFigId,newFigId);;
        if(files[0] && figureVerified){
            Meteor.s3.upload(files,'paper_figures',function(error,result){
                if(error){
                    Meteor.formActions.errorMessage('Figure not upload.');
                }else if(result){
                    updatedFilename = result.file.name;
                    fileNamePieces = updatedFilename.split('_');
                    Meteor.call('afterUploadArticleFig', articleMongoId, updatedFilename, originalFigId, newFigId, function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage(error.error);
                        }else if(result){
                            Meteor.formActions.successMessage(result);
                            if(articleMongoId != fileNamePieces[0] && newFigId != fileNamePieces[1]){
                                S3.delete('paper_figures/' + updatedFilename,function(error,result){
                                    if(error){
                                        console.error('Could not delete original figure file: ' + updatedFilename);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }else if(!files[0]){
            Meteor.formActions.errorMessage('Please select a figure file to upload.');
        }else{
            Meteor.formActions.errorMessage('Figure ID already assigned to another figure.');
        }
    }
});

// Upload New Article XML
Template.AdminUploadArticleXml.events({
    'click #add-article': function(e){
        e.preventDefault();
        Meteor.formActions.processing();
        Meteor.call('addArticle',Session.get('new-article'),function(error,result){
            if(error){
                Meteor.formActions.errorMessage('Could not add article');
            }else if(result){
                Session.set('new-article',null);
                Router.go('AdminArticleOverview',{_id : result});
                // Meteor.formActions.successMessage();
            }
        });
    },
    'click #add-article-cancel': function(e){
        e.preventDefault();
        Session.set('new-article',null);
    }
});
