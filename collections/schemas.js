// about
about.schema = new SimpleSchema({
    content: {type: String, optional: true},
    display: {type: Boolean, optional: true},
    title: {type: String, optional: false}
});
// article_types
articleTypes.schema = new SimpleSchema({
    name: {type: String},
    nlm_type: {type: String},
    plural: {type: String},
    short_name: {type: String}
});
// articles
articles.schema = new SimpleSchema({
    abstract: {type: String, optional: true},
    advance: {type: Boolean, optional: true},
    affiliations: {type: [String], optional: true},
    article_type:  {type: Object, optional: true},
    'article_type._id': {type: String, optional: true},
    'article_type.name': {type: String, optional: true},
    'article_type.nlm_type': {type: String, optional: true},
    'article_type.plural': {type: String, optional: true},
    'article_type.short_name': {type: String, optional: true},
    authors: {type: [Object], optional: true},
    'authors.$.name_first': {type: String, optional: true, label: 'First name'},
    'authors.$.name_middle': {type: String, optional: true, label: 'Middle name'},
    'authors.$.name_last': {type: String, optional: true, label: 'Last name'},
    correspondence: {type: [Object], optional: true},
    'correspondence.$.email': {type: String, optional: true},
    'correspondence.$.text': {type: String, optional: true},
    dates: {type: Object, optional: true},
    'dates.collection': {type: Date, optional: true},
    'dates.ecorrected': {type: Date, optional: true},
    'dates.epreprint': {type: Date, optional: true},
    'dates.eretracted': {type: Date, optional: true},
    'dates.epub': {type: Date, optional: true},
    'dates.epub-ppub': {type: Date, optional: true},
    'dates.pcorrected': {type: Date, optional: true},
    'dates.ppreprint': {type: Date, optional: true},
    'dates.ppub': {type: Date, optional: true},
    'dates.pretracted': {type: Date, optional: true},
    display: {type: Boolean, optional: true},
    feature: {type: Boolean, optional: true},
    files: {type: [Object], optional: true},
    history: {type: Object, optional: true},
    'history.accepted': {type: Date, optional: true},
    'history.corrected': {type: Date, optional: true},
    'history.preprint': {type: Date, optional: true},
    'history.pub': {type: Date, optional: true},
    'history.received': {type: Date, optional: true},
    'history.rev-recd': {type: Date, optional: true},
    'history.rev-request': {type: Date, optional: true},
    ids: {type: Object, optional: true},
    'ids.doi': {type: String, optional: true},
    'ids.manuscript': {type: String, optional: true},
    'ids.medline': {type: String, optional: true},
    'ids.pii': {type: String, optional: true},
    'ids.pmc': {type: String, optional: true},
    'ids.pmid': {type: String, optional: true},
    issue: {type: String, optional: true},
    issue_id: {type: String, optional: true},
    keywords: {type: [String], optional: true},
    page_end: {type: Number, optional: true, label: 'Last page'},
    page_start: {type: Number, optional: true, label: 'First page'},
    publisher: {type: String, optional: true},
    title: {type: String, optional: false},
    volume: {type: Number, optional: true, label: 'Volume'}
});
// authors
authors.schema = new SimpleSchema({
    name_first: {type: String, optional: true},
    name_middle: {type: String, optional: true},
    name_last: {type: String, optional: true},
    ids: {type: Object, optional: true},
    affiliationss: {type: [String], optional: true},
});
// config
config.schema = new SimpleSchema({
    journal: {type: Object, optional: false},
    'journal.name': {type: String, optional: false},
    'journal.short_name': {type: String, optional: false},
    'journal.issn': {type: String, optional: false},
    'journal.doi': {type: String, optional: true},
    'journal.url': {type: String, optional: false},
    'journal.logo': {type: Object, optional: false},
    'journal.logo.banner': {type: String, optional: false},
    'journal.publisher': {type: Object, optional: true},
    'journal.publisher.name': {type: String, optional: true},
    'assets': {type: String, optional: true},
    site: {type: Object, optional: false},
    'site.spec': {type: Object, optional: false},
    'site.spec.color': {type: Object, optional: false},
    'site.spec.color.main_hex': {type: String, optional: false},
    'site.spec.color.main_rgb': {type: String, optional: false},
    'site.side_nav': {type: [Object], optional: false},
    'site.side_nav.$.route_name': {type: String, optional: false},
    'site.side_nav.$.name': {type: String, optional: false},
    'site.side_nav.$.display': {type: Boolean, optional: false},
    edboard_roles: {type: [Object], optional: false},
    'email_lib_recommendation': {type: Object, optional: false},
    'email_lib_recommendation.address': {type: String, optional: false},
    'email_lib_recommendation.pw': {type: String, optional: false},
    submission: {type: Object, optional: false},
    'submission.url': {type: String, optional: false},
    'submission.user': {type: String, optional: true},
    'submission.pw': {type: String, optional: true},
    impact_factor: {type: Object, optional: true},
    legacy_platform: {type: Object, optional: true},
    'legacy_platform.name': {type: String, optional: true},
    'legacy_platform.short_name': {type: String, optional: true},
    'legacy_platform.mini_api': {type: String, optional: true},
    api: {type: Object, optional: false},
    'api.crawler': {type: String, optional: false},
    'api.doi': {type: String, optional: false},
});

// contact
// edboard
// for_authors
// institutions
// issues
// news
// roles
// sections
// sorters
// users
// volume

// NOTE: if nested object required, parent object must be too