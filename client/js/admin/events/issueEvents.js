// Issue
// ----------------
Template.AdminIssue.events({
    'click .anchor': function(e){
        Meteor.general.scrollAnchor(e);
    },
    'click #delete-issue': function(e){
        e.preventDefault();
        $('#delete-request').addClass('hide');
        $('#delete-verify').removeClass('hide');
    },
    'click #delete-confirmation': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var input = $('#issue-delete-input').val();
        Meteor.call('deleteIssue', Session.get('issue')._id, input, function(error,result){
            if(error){
                console.error('deleteIssue',error);
                Meteor.formActions.errorMessage('Could not delete the issue.<br>' + error.error);
            }else if(result){
                Session.set('articles-updated',result);
                Router.go('AdminIssueDeleted');
            }
        });
    }
});
Template.AdminIssueForm.events({
    'submit form': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        var mongoId = $('#mongo-id').attr('data-id');
        var pubDate = $('.datepicker').val();

        issueData = {
            volume: null,
            issue: null,
            pub_date: null,
            date_settings: {},
            display: false
        };

        // Date
        if(pubDate){
            pubDate = new Date(pubDate);
            issueData.pub_date = pubDate;
        }

        // Date settings
        $('.date-setting').each(function(){
            var type = $(this).attr('id').replace('display-','');
            issueData.date_settings[type] = false;
            if($(this).prop('checked')){
                issueData.date_settings[type] = true;
            }
        });

        // Volume/Issue
        if($('#issue-volume').val()){
            issueData.volume = parseInt($('#issue-volume').val());
        }
        if($('#issue-issue').val()){
            issueData.issue = $('#issue-issue').val();
        }

        // Display Issue
        if($('#display-issue').prop('checked')){
            issueData.display = true;
        }

        Meteor.call('validateIssue', mongoId, issueData, function(error, result){
            if(error){
                console.error('validateIssue',error);
            }else if(result && result.duplicate){
                Meteor.formActions.errorMessage('Duplicate Issue Found: ' + '<a href="/admin/issue/v' + result.volume + 'i' + result.issue + '">Volume ' + result.volume + ', Issue ' + result.issue + '</a>');
            }else if(result && result.invalid_list){
                Meteor.formActions.invalid(result.invalid_list);
            }else if(result && result.saved){
                if(!mongoId){
                    mongoId = result.article_id;
                }
                Meteor.formActions.successMessage('Issue Updated');
                // Router.go('AdminIssue',{volume : issueData.volume, issue: issueData.issue});
            }
        });
    }
});
Template.IssueCoverUploader.events({
    'click .upload': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        var uploadedFilename;
        var issueMongoId = Session.get('issue')._id;
        var files = $('input.file_bag')[0].files;

        if(files[0]){
            Meteor.s3.upload(files,'covers',function(error,result){
                if(error){
                    console.error(error);
                    Meteor.formActions.errorMessage('Cover not upload.');
                }else if(result){
                    uploadedFilename = result.file.name;
                    Meteor.call('afterUploadCover', issueMongoId, uploadedFilename, function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage(error.error);
                        }else if(result){
                            Meteor.formActions.successMessage(result);
                            // only delete original if it wasn't named using issueMongoId
                            uploadedFilenamePieces = uploadedFilename.split('.');
                            if(issueMongoId != uploadedFilenamePieces[0]){
                                S3.delete('covers/' + uploadedFilename,function(error,result){
                                    if(error){
                                        console.error('Could not delete original cover file: ' + updatedFilename);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }else if(!files[0]){
            Meteor.formActions.errorMessage('Please select a cover file to upload.');
        }
    }
});