Meteor.adminEthics = {
    readyForm: function(){
        // Ethics Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData forAuthors');
        e.preventDefault();

        var updateType = 'update',
            mongoId,
            forDb;

        forDb = Meteor.adminShared.formGetData();

        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();

        if(!mongoId){
            updateType = 'add';
        }

        Meteor.call('updateEthics', mongoId, forDb, function(error,result){
            if(error){
                console.error('updateEthics',error);
                Meteor.formActions.errorMessage('Could not ' + updateType + ' about section.<br>' + error.reason);
            }
            else if(result){
                Meteor.formActions.successMessage('Ethics section updated');
                Session.set('showEthicsForm',false);
                Session.set('ethicsSectionId',null);
                // update template data

            }
        });
        // }
    }
};
