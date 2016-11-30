Meteor.methods({
        getEthics: function(){
            var sorted  = sorters.findOne({ 'name': 'ethics' });
            if (sorted && sorted.ordered) {
                return sorted.ordered;
            }
        }
    });
