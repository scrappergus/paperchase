Meteor.methods({
    getListWithData: function(listName){
        var sorterData,
            collectionData,
            itemsById = {},
            result = [];

        sorterData = sorters.findOne({name : listName});

        if(sorterData && sorterData.order){
            collectionData = global[listName].find({'_id':{'$in':sorterData.order}}).fetch();

            if(collectionData){

                collectionData.forEach(function(itemData){
                    itemsById[itemData._id] = itemData;
                });

                sorterData.order.forEach(function(itemId){
                    if(itemsById[itemId]){
                        result.push(itemsById[itemId])
                    }else{
                        console.error('could not find ID in data list: ', listName, itemId);
                    }
                });
            }
        }

        return result;
    }
});
