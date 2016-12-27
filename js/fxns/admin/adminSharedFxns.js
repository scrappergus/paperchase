Meteor.adminShared = {
    formGetData: function (e) {
        var forDb = {};

        // Section title
        // ---------------
        var title = $('.section-title').code();
        // console.log(title);
        title = Meteor.clean.cleanWysiwyg(title);
        if(title !== ''){
            forDb.title = title;
        }

        // Section content
        // ---------------
        var section = $('.section-content').code();
        // section = Meteor.clean.cleanWysiwyg(section);
        if(section !== ''){
            forDb.content = section;
        }

        // Display
        // ---------------
        forDb.display = $('#section-display').is(':checked');

        return forDb;
    }
};


Meteor.s3 = {
    upload: function(files, folder, cb){
        S3.upload({
            files: files,
            path: folder,
            unique_name: false
        },function(err,res){
            if (err) {
                console.error('S3 upload error',err);
                cb(err);
            } else if (res){
                cb(null, res);
            }
        });
    }
};
