Meteor.methods({
        getForAuthors: function(){
            var sorted  = sorters.findOne({ 'name': 'forAuthors' });
            if (sorted && sorted.ordered) {
                return sorted.ordered;
            }
        }
    });
