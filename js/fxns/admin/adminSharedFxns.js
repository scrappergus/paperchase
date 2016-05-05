Meteor.adminShared = {
    formGetData: function (e) {
        var forDb = {}

        // Section title
        // ---------------
        var title = $('.section-title').code();
        // console.log(title);
        title = Meteor.formActions.cleanWysiwyg(title);
        if(title != ''){
            forDb.title = title;
        }

        // Section content
        // ---------------
        var section = $('.section-content').code();
        // section = Meteor.formActions.cleanWysiwyg(section);
        if(section != ''){
            forDb.content = section;
        }

        // Display
        // ---------------
        forDb.display = $('#section-display').is(':checked');

        return forDb;
    }
}


Meteor.s3 = {
    upload: function(files,folder,cb){
        var journalShortName = journalConfig.findOne().journal.short_name;
        var journalBucket = 'paperchase-' + journalShortName;

        S3.upload({
            Bucket: journalBucket,
            files: files,
            path: folder,
            unique_name: false
        },function(err,res){
            if(err){
                console.error('S3 upload error',err);
                cb(err);
            }else if(res){
                cb(null, res);
            }
        });
    }
}