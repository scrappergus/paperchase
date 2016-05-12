Meteor.methods({
    siteControlUpdate: function(updateObj){
        console.log('siteControlUpdate',updateObj);

        var configDocId;
        var fut = new future();

        // Update 3 collections - config, sorters, sections
        // Config - for setting main side navigation ORDER and DISPLAY (Home, Archive etc)
        // Sorters - for setting ORDER of section side navigation (created by users)
        // Section - for setting DISPLAY of sections

        configDocId = journalConfig.findOne()._id;


        // Main Side Navigation
        // COLLECTION: config
        journalConfig.update({_id : configDocId} , {$set: {'site.side_nav' : updateObj.side_nav , 'site.section_side_nav' : updateObj.section_side_nav} }, function(error,result){
            if(error){
                throw new Meteor.Error(error);
            }else if(result){
                // Section Side Navigation
                // COLLECTION: sorters
                // COLLECTION: sections
                async.each(updateObj.section_side_nav, function (section, cb) {
                    Meteor.call('updateSectionViaSiteControl',section, function(error,result){
                        if(error){
                            console.error('updateSectionViaSiteControl',error);
                        }else if(result){
                            cb();
                        }
                    });
                }, function (err) {
                    if (err) {
                        throw new Meteor.Error(err);
                    }else{
                        Meteor.call('updatePaperSectionsOrder', updateObj.section_side_nav, function(error,result){
                            if(error){
                                throw new Meteor.Error(error);
                            }else if(result){
                                fut.return(true);
                            }
                        });
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    updateSectionViaSiteControl: function(section){
        var fut = new future();
        // console.log('updateSectionViaSiteControl',section)
        Meteor.call('updateSection', section._id, {display: section.display}, function(error,result){
            if(error){
                throw new Meteor.Error(error);
            }else if(result){
                fut.return(true);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    updatePaperSectionsOrder: function(updateArray){
        // console.log('..updatePaperSectionsOrder');
        // console.log(updateArray);
        // just take the Mongo ID from object
        var newOrder = [];
        for(var i=0 ; i<updateArray.length ; i++ ){
            if(updateArray[i]['display']){
                newOrder.push(updateArray[i]['_id']);
            }
        }
        // console.log(newOrder);
        return Meteor.call('updateList','sections', newOrder);
    }
});

