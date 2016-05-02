Meteor.methods({
    siteControlUpdate: function(updateObj){
        var mainSideNavigationDone,
            sectionSideNavigationDone,
            sortersDone;
        var fut = new future();

        // Update 3 collections - config, sorters, sections
        // Config - for setting main side navigation ORDER and DISPLAY (Home, Archive etc)
        // Sorters - for setting ORDER of section side navigation (created by users)
        // Section - for setting DISPLAY of sections

        var configDocId = journalConfig.findOne()._id;


        // Main Side Navigation
        // COLLECTION: config
        var mainSideNavigationDone = journalConfig.update({_id : configDocId} , {$set: {'site.side_nav' : updateObj.side_nav }});

        // Section Side Navigation
        // COLLECTION: sections
        // TODO: better tracking of if updated, instead of just setting true on last item
        // DISPLAY
        for(var i=0 ; i<updateObj.section_side_nav.length ; i++){
            var sectionMongoId = updateObj.section_side_nav[i]['_id'];
            var sectionDisplay = updateObj.section_side_nav[i]['display'];
            var sectionUpdated = sections.update({_id : sectionMongoId} , {$set: {display : sectionDisplay}});
            if(sectionUpdated && i == parseInt(updateObj.section_side_nav.length-1)){
                // ORDER
                // COLLECTION: sorters
                sectionSideNavigationDone = Meteor.call('updatePaperSectionsOrder',updateObj.section_side_nav);
            }
        }


        if(mainSideNavigationDone && sectionSideNavigationDone){
            return true;
        }
        return fut.wait();
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

