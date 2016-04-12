**Paperchase Documentation**
========================
An academic journal platform.

App Structure
============
 - **/:** for client and server side. Some of these files will have checks for where on app part of file can be used, for ex: if `(Meteor.isClient) {}`
 - **/client:** for client side
 - **/js:** for client and server side
 - **/server:** for server side
 - **/templates:** client and admin templates
 - **/public:** static assets. (journal images, not article images)


Template Data
============
When possible, use helper files to pass data to template: `AdminHelpers.js` and `helpersData.js`

Deploy
============
 - change favicon to journal deploying (all journal favicons located in /public)
 - change settins.json
 - change /server/awsConfig.js
 -

Visitor Site
============

 - LoadingConfig template only used while config collection loads
 - config collection contains journal specific variables - main color, journal
   name, submit link etc.
 - Template variable `configLoaded` is used to show/hide visitor layout until collection is loaded.

Navigation
----------
In nav.html, the main side nav and the mobile collapsible nav will list only section links that are set to display:true and these links are listed in the order saved on Site Control

----------


Admin Site
==========

Site Control
------------
/admin/site-control
Admin control of side navigation (main page navigation and section page navigation). Options are stored as objects in an array in the config doc in DB.  Order of objects in array determines order of links listed.

    "site" : {
	    "side_nav" : [
	    {
		    "route_name" : "advance",
		    "name" : "Advance",
		    "display" : true
	    }
	}

**Display & Order**
Main page nav - display and order is stored in config collection.
Section side nav - display stored in sections collection. order stored in sorters collection.

News
----
Stored in the news collection. Doc contains - title, content, date, display, and also updates by users are tracked (just user id and date).
Session variable `newsId` used in news form helper.

**Database Publications**
newsListAll: For admin only. doesn't limit news items not displayed to public
newsListDisplay: Only news items to display to public
newsItem: Publication by Mongo ID

Section Pages
-------------

**Admin Control**
Create new sections, assign articles to sections, display section links in side nav, order of links in side nav.

**Updating**
Section Name & Display
Whenever the section doc is updated, the doc for the order of sections also gets updated.

**Section Papers Page**
List of articles comes from session variable article-list.
Session variable article-list is set in the router, onBeforeAction. Preprocessing of the list occurs in the server method preprocessSectionArticles to retrieve URLs of assets (PDFs, Figures, etc) for showing buttons.

**Add New Section**
/admin/sections-add

**All Sections**
/admin/sections
A table with: Section Name, Hidden/Display, Papers (link to papers table), Edit
Can edit 1 section at a time on this page (same form as add new section)
List sorted alphabetically (though sorters collection is used on side nav, so we can change this based on section order)

**Sections Link Order**
/admin/site-control
Order saved in sorters collection. List name = sections
Hidden links not listed
Can also hide sections from this page (but cannot display)

**Assign Section to Article**
On article form, in meta section

Article Form
----------------

This form is used in multiple places (Add Article, Edit Article, Verify XML).

**Data**

The data for the form comes from the session variable `article-form` and is not reactive.  The database data needs to be preprocessed to include all issues, all paper types etc so that the dropdown menus and buttons options (for ex, article type buttons) in the form are complete. Another session variable `article` is used to show the article nav and header. This variable is set in the router. Don't use the session variable for `article-form` because that contains extra information not needed for the nav/header, and also we can show the header while the form is still processing.

When adding PII, if the article doc had a PII in the DB then that is included in the form (for when if the user had removed PII while working on the form then wanted to add it back). If the article doc didn't have a PII, then the next incremental PII is included on the form.

**Saving**

Whether using the form to create a new article doc, or updating an existing article doc, the article information is passed to `validateArticle(mongoId, articleData)` in /client/js/admin/article/articleMethods.js. This function will first check for duplicate articles. Duplicate articles are found using `articleExistenceCheck(mongoId, articleData)`, which will query for title and IDs. If an article is found and the `_id` of the doc does not match the provided mongoId then validation is stopped and the user is notified. If no duplicate found, then the inputs are validated. Currently, only title is required and the only requirement is that it is not empty. `validateArticle()` will return an object, which has three flags checked on the event handler: duplicate, invalid, saved. If result.duplicate then the returned object is the duplicate article. If result.invalid, then the returned result contains all the invalid input IDs with messages for each. If result.saved then article was saved (updated or inserted). If saving the data, articleUpdate() is used. This will also insert and return `_id` if inserted.


Article Files Uploader
--------------------------
**XML**

 - Can upload PMC or AOP (PubMed) XML
 - Only PMC XML is uploaded to S3, which is full text XML
 - AOP XML is used only to update the DB.
 - Since the same form is used for AOP and PMC XML, there's a flag in the session variable `article-form.aop` and if set to true, the upload button is hidden but the form is still displayed.
 - xmlMethods.js: This file contains functions to parse XML to JSON, and to get that JSON in the schema for the DB. Also contains functions for comparing XML JSON with DB JSON
 - Issue handling: if volume and issue in XML, but no record in the issues collection, then insert. This happens on processing, so before the article form gets saved. The reason is because issues can be deleted/hidden easily (still a todo).
 - Duplicate article checked on processing. User is notified above article form.

----------


Article Files
-------------
**XML**

 - File naming: articleMongId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the xml folder

XML files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**PDF**

 - File naming: articleMongId.pdf
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the pdf folder

PDF files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**Figures**
 - File naming: articleMongId_figureId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the paper_figures folder

Before rendering the template, AdminArticleFigures, if the article has XML uploaded, then it's parsed for figure nodes. The ID, label, title and caption are listed below the figure uploader/editor. The data for the XML figures is stored in the session variable `xml-figures`.

Deleting: Uses template AdminArticleFigures. After clicking the edit button next to the figure, a delete button is displayed. Delete happens via client. DB updating happens on server using afterDeleteArticleFigure()

Uploading: Uses template s3FigureUpload. First the file is uploaded to the paper_figures folder on S3, which must happen on the client. Then on the server, using afterUploadArticleFig(), the uploaded figure is renamed to standard convention (articlemongoid_figureid). The original file is copied and named using articlemongoid_figureid, then the article doc in the DB is updated. After updating the DB, the original file is deleted, via the client. See articleEvents.js.

Updating/Adding New Figure: Both actions use same template event from s3FigureUpload, which will also verify that the figure ID is unique. They also use the server method afterUploadArticleFig(), which has flag in the function, `figFound`, to determine if new or existing figure updated.


Issue Form
-------------
**Validation and Duplicate Check**
Submit form event uses method ‘validateIssue()‘ to check all required inputs and make sure there are no duplicate issues (via Volume and Issue search).

Issue Deletion
-------------
Deleting an issue will delete all issue information from the database and remove all issue information for its articles. User input to confirm deletion is sent to deleteIssue(), which makes sure that the input === 'DELETE'. If so then, the issue doc is copied to the issues_deleted collection via deleteIssueDatabase() and the original doc is removed from the issues collection. Then all articles in the issue are updated (just issue information removed from article docs). TODO: Cover deleting on S3.

Issue Cover
-------------
The cover is uploaded using the template ‘IssueCoverUploader‘. The upload event is on the client, using the template events. Covers cannot be added when adding an issue. Covers can only be added to existing issues.


App Packages
============
**alanning:roles**
For adding roles to user docs in the DB

**aldeed:template-extension**
For dynamic templates

**aslagle:reactive-table**
A reactive table designed for Meteor. Used on: AdminDataSubmissions, AdminDoiStatus, and adminArticle

**accounts-password**
For users accounts

**bambattajb:sticky**
Used on the full text section navigation.

**blaze-html-templates**
Compile HTML templates into reactive UI with Meteor Blaze

**email**
Allows sending email from a Meteor app. Published by mdg.

**fourseven:scss**
Sass and SCSS support

**gadicohen:headers**
For institutaion access. In helpers getInstitutionByIP and isSubscribedIP

**gandev:server-eval**
This allows server logs to be viewed in the browser console. Could be removed for productions.

**hitchcott:panzoom**
Used on ArticleFigureViewer to zoom in/out on figures

**http**
Used to make http requests.

**iron:router**
For client and server routes

**jquery**

**lepozepo:s3**
Used for uploading files to AWS S3

**logging**
This is an internal Meteor package. Published by mdg

**matb33:collection-hooks**
For adjusting data on insert/update/delete of database collections

**materialize:materialize**
Used for front-end framework

**meteorhacks:aggregate**
A simple package to add proper aggregation support for Meteor. This is used to find duplicate articles by PII, PMID, and title, in function duplicateArticles() in articleMethods.js.

**meteorhacks:npm**
This allows us to use node.js packages. Using xml2js and xpath for XML parsing.

**mizzao:jquery-ui**
Smart package for jquery ui, which is used for sortable actions on admin site.

**momentjs:moment**
This is a smart package for moment, which is used to parse dates in JavaScript

**mongo**
Adaptor for using MongoDB and Minimongo over DDP

**ostrio:iron-router-title**
Used to change document.title via router.

**reactive-var**
A general-purpose reactive datatype for use with tracker. Published by mdg.

**reload**
The reload package handles the process of migrating an app: serializing the app's state, then shutting down and restarting the app. Published by mdg

**risul:moment-timezone**
Used to set timezone of application, so that article data processing doesn't change with timezone.

**session**
This package provide Session.Session is a special ReactiveDict whose contents are preserved across Hot Code Push.

**spacebars**
Meteor template language. Published by mdg

**standard-minifiers**
This package includes the JS and CSS standard minifiers in your Meteor project. Published by mdg.

**tracker**
Meteor Tracker is an incredibly tiny (~1k) but incredibly powerful library for transparent reactive programming in JavaScript.

**vojtechklos:materialnote**
Used on admin site for wysiwyg input.

**zimme:active-route**
Use to determine if the current route is the active one. For ex, to add active class to button groups.


