module.exports.register = function (handlebars) {

	console.log('register helper : ');
	handlebars.registerHelper('name', () => {

		console.log('test: ');
		return 'John Doe';
	})
};