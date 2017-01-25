// These are for organizing lists of papers in section
Meteor.methods({
    preprocessSectionArticles: function(articles){
        // console.log('..preprocessSectionArticles');console.log(articles);
        var fut = new future();
        // get assets
        for(var i=0 ; i< articles.length ; i++){
            // console.log(articles[i]['_id']);
            articles[i]['assets'] = Meteor.call('availableAssests', articles[i]['_id']);
            if(i == parseInt(articles.length - 1)){
                // console.log(articles);
                articles = Meteor.organize.groupArticles(articles);
                fut['return'](articles);
            }
        }
        return fut.wait();
    },
    updateSection: function(mongoId, sectionData){
        var fut = new future();
        var errorMessage = {};
        // verify section_id is unique
        var sectionExists = sections.findOne({ section_id : sectionData.section_id, _id : {$ne: mongoId}});

        if (sectionExists) {
            console.error('updateSection: section already exists', sectionExists._id);
            errorMessage.reason = 'Section ID already exists for<br/>Section Name: ' + sectionExists.name + '<br/>Mongo ID: ' + sectionExists._id;
            fut.throw(errorMessage);
        } else {
            if (mongoId) {
                fut.return(sections.update({'_id' : mongoId} , sectionData));
            } else {
                fut.return(sections.insert(sectionData));
            }
        }


        try {
            return fut.wait();
        } catch(err) {
            throw new Meteor.Error(err);
        }
    }
});
