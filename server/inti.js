Meteor.startup(function () {
	UploadServer.init({
		tmpDir: process.env.PWD + '/uploads/tmp',
		uploadDir: process.env.PWD + '/uploads/',
		getDirectory: function(fileInfo, formData) {
			return formData.contentType;
		},
		mimeTypes: {
			'xml': 'application/xml'
		},
		finished: function(fileInfo, formFields) {
			console.log('finished!');
			// perform a disk operation
		},
		checkCreateDirectories: true
	})
});