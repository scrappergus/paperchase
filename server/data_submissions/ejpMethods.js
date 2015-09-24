Meteor.methods({
	'getEjpAccepted' : function(){
		console.log('..getAccepted');
		var cookie_value,
			msIdKey,
			ms,
			agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
			requestURL = ejpCred.url,
			username = ejpCred.username,
			password = ejpCred.password,
			journalEjpId = ejpCred.journalEjpId,
			authCredString = username + ':' + password;


		//Set initial cookie, get ms_id_key
		var res = Meteor.http.get(requestURL + 'cgi-bin/main.plex', {
           	headers: {
				'Accept' : '*/*',
				'Connection' : 'Keep-Alive',
				'User-Agent' : agent
          	}
		});		
		if(res.statusCode == 200){
			//find ms_id_key in the login form
			var resHtml = res.content;
			// console.log(resHtml.find('ms_id_key'));
			// console.log(resHtml.lastIndexOf('id=\'ms_id_key\'')+1);
			var keyStart = resHtml.lastIndexOf('id=\'ms_id_key\'')+22;
			var keyEnd = keyStart + 28;
			ms = resHtml.substring(keyStart, keyEnd);
			console.log('ms_id_key=====' + ms + '=====');

			console.log('res HEADERS =====');
			console.log(res.headers);

			//SET COOKIES
			var cookieObject = {};
			if(res['headers']['set-cookie']){
				var cookies = res['headers']['set-cookie'];
				for(var c = 0 ; c < cookies.length ; c++){
					var cookiePieces = cookies[c].split('=');
					console.log('cookie  =====');
					console.log(cookies[c]);
					cookieObject[cookiePieces[0]] = cookiePieces[1];
				}
			}
			console.log(cookieObject);

		
			//LOGIN
			var result = Meteor.http.post(requestURL + 'cgi-bin/main.plex', {
				// auth : authCredString,
				params: {
					timeout: 30000,
					form_type: 'login_results',
					j_id : journalEjpId,
					login: username,
					password: password,
					ms_id_key: ms
				},
	           	headers: {
					'Accept' : '*/*',
					'Connection' : 'Keep-Alive',
					'User-Agent' : agent,
					'Cookies' : cookieObject
	          	}
			});


			//GET - get manuscripts
			if (result.statusCode == 200) {
				//SET COOKIES
				if(result['headers']['set-cookie']){
					var cookies = result['headers']['set-cookie'];
					for(var c = 0 ; c < cookies.length ; c++){
						var cookiePieces = cookies[c].split('=');
						console.log('cookie  =====');
						console.log(cookies[c]);
					}
				}
				console.log('login HEADERS =====');
				console.log(result.headers);

				// var res;
				// res = Meteor.http.get(requestURL,{
				// 	auth : authCredString,
				// 	params: {
				// 		timeout: 30000
				// 	},
				// 	headers: { 
				// 		'Accept' : '*/*',
				// 		'Connection' : 'Keep-Alive',
				// 		'User-Agent' : agent
				// 	},
				// 	auth : authCredString
				// });
				// if(res){
				// 	console.log('get manuscripts res = ');
				// 	// console.log(res.content);	
				// }
			}		
		}


	}
});