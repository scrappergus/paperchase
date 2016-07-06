// Issue
// ----------------
Template.AdminIssueEdit.events({
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
    },
    'click #page-spans': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
        Meteor.call('updateIssuePages', Session.get('issue')._id, function(error, result){
            if(error){
                console.error('updateIssuePages',error);
                Meteor.formActions.errorMessage('Could not update issue pages.<br>' + error.error);
            }
            else if(result){
                Meteor.formActions.successMessage('Pages updated');
            }
        });
    }
});
Template.AdminIssueForm.events({
    'submit form': function(e,t){
        // console.log('...click AdminIssueForm');
        e.preventDefault();
        Meteor.formActions.saving();
        var mongoId = $('#mongo-id').attr('data-id');
        var pubDate = $('.datepicker').val();

        issueData = {
            volume: null,
            issue: null,
            pub_date: null,
            date_settings: {},
            display: false,
            current: false
        };

        // Date
        // -------
        if(pubDate){
            pubDate = new Date(pubDate);
            issueData.pub_date = pubDate;
        }

        // Date settings
        // -------
        $('.date-setting').each(function(){
            var type = $(this).attr('id').replace('display-','');
            issueData.date_settings[type] = false;
            if($(this).prop('checked')){
                issueData.date_settings[type] = true;
            }
        });

        // Volume/Issue
        // -------
        if($('#issue-volume').val()){
            issueData.volume = parseInt($('#issue-volume').val());
        }
        if($('#issue-issue').val()){
            issueData.issue = $('#issue-issue').val();
        }

        // Display Issue
        // -------
        if($('#display-issue').prop('checked')){
            issueData.display = true;
        }

        // Current Issue
        // -------
        if($('#current-issue').prop('checked')){
            issueData.current = true;
        }

        // Cover Caption
        // -------
        caption = $('.issue-caption').code();
        caption = Meteor.clean.cleanWysiwyg(caption);
        issueData.caption = caption;

        Meteor.call('validateIssue', mongoId, issueData, function(error, result){
            if(error){
                console.error('validateIssue',error);
            }
            else if(result && result.duplicate){
                Meteor.formActions.errorMessage('Duplicate Issue Found: ' + '<a href="/admin/issue/v' + result.volume + 'i' + result.issue + '">Volume ' + result.volume + ', Issue ' + result.issue + '</a>');
            }
            else if(result && result.invalid_list){
                Meteor.formActions.invalid(result.invalid_list);
            }
            else if(result && result.saved){
                if(!mongoId){
                    mongoId = result.article_id;
                }
                $('.lean-overlay').remove();
                Router.go('AdminIssue', {vi : 'v' + issueData.volume + 'i' + issueData.issue});
                // Meteor.formActions.successMessage('Issue Updated');
                Meteor.call('getIssueAndFiles', issueData.volume, issueData.issue, true, function(error,result){
                    if(error){
                        console.error('ERROR - getIssueAndFiles',error);
                    }
                    else if(result){
                        Session.set('issue',result);
                    }
                    else{
                        Session.set('admin-not-found',true);
                    }
                });
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
                    Meteor.formActions.errorMessage('Cover not uploaded.');
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
