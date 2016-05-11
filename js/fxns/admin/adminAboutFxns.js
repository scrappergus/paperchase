Meteor.adminAbout = {
    readyForm: function(){
        // About Section title
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
        var forDb = Meteor.adminShared.formGetData();

        // console.log(forDb);
        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = about.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem', 'about', success);
        }else{
            // Update
            success = about.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showAboutForm',false);
            Session.set('aboutSectionId',null);
        }
    }
}