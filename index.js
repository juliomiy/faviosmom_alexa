'use strict';

	module.change_code = 1;

	var _ = require('lodash');

	var Alexa = require('alexa-app');

	var app = new Alexa.app('faviosmom');

	var FaviosMomHelper = require('./faviosmom_helper');

/*

 */
    app.pre = function(req,res,type) {
        console.log("In Pre App - calling type " + type);
        if (req.sessionDetails.application.applicationId!="amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000d00ebe") {
            // Fail ungracefully
            console.log("calling Fail in Pre App");
            res.fail("Invalid applicationId");
        }
    };

    app.post = function(req,res,type,exception) {
        // Always turn an exception into a successful response
        if (exception) {
            res.clear().say("An error occured: " + exception).send();
        }
    };
/**
 * Launch application. The first event run when a skill is asked for by user.
 * TODO Remove hardcoded Order Session introduced to test out Commit_order event
 */
	app.launch(function(req, res) {

	  var prompt = "Welcome to Favios's Mom, Ask me to List Menu, Order Items.";
        res.session('customer', 'julio');
      /*  res.session('order', {"order": [
            { "name": "Black Beans",
                "menu_id": 456,
                "portion": "pot",
                "price": "2x5" }
        ],
            "total_order_price": "27.56"
        }); */
	  res.say(prompt).reprompt(prompt).shouldEndSession(false);

	});

    app.sessionEnded(function(req, res) {
        console.log("In session Ended Intent");
        var prompt = "Goodbye! Come back soon to Favios's Mom.";

        res.say(prompt).reprompt(prompt).shouldEndSession(true);

    });

    app.dictionary = {"menuItems":["Pot of Black Beans","green","blue"]};

    app.intent('menu', {

        'slots': {
            'TYPE': 'LITERAL'
         },
        'utterances': ['{|tell me|what is} menu {vegetarian|ham|pork|TYPE}']
    },
        function(req, res) {
            console.log("In menu Intent");
            var faviosMomHelper = new FaviosMomHelper();
            var slotType = req.slot("TYPE");

            faviosMomHelper.requestMenu(slotType).then(function(menu) {

                console.log('from requestMenu ');
                console.log(JSON.stringify(menu));

                res.say(faviosMomHelper.formatMenu(menu)).shouldEndSession(false).send();

            }).catch(function(err) {

                console.log(err.statusCode);

                var prompt = 'I didn\'t find menu information';

                res.say(prompt).reprompt("What would you like to do?").shouldEndSession(false).send();

            });

            return false;
        }
    );

    app.intent('menuitems', {
            'slots': {

                'MENUITEM': 'MENUITEMS'
            },
            "utterances":[ "{|tell me about|what is} {-|MENUITEM}" ]
            //'utterances': ['{|tell me|what is} menu'],
        },
        function(req, res) {
            console.log("In menuItems Intent");
            var slotMenuItem = req.slot('MENUITEM');
            var faviosMomHelper = new FaviosMomHelper();

            faviosMomHelper.requestMenuItem(slotMenuItem).then( function(menuItem) {
                console.log('from requestMenuItem ');
                console.log(JSON.stringify(menuItem));
                res.say(faviosMomHelper.formatMenuItem(slotMenuItem, menuItem)).shouldEndSession(false).send();
            }).catch(function(err) {
                var prompt = 'I didn\'t find menu item ' + slotMenuItem;
                res.say(prompt).reprompt("What would you like to do?").shouldEndSession(false).send();
            });
            return false;
        });

     app.intent('commit_order', {
    'slots': {
     },
    "utterances":[ "{place|commit|} {-|Order}" ]
     },
     function(req,res) {
         console.log("In commit Order");
         var faviosMomHelper = new FaviosMomHelper();
         faviosMomHelper.processOrder(req, res).then( function (order) {

             res.clearSession('order');
             res.clearSession('total_order_price');

             res.say(faviosMomHelper.formatProcessOrder(order)).shouldEndSession(false).send();
         }).catch(function (err) {
             var prompt = 'Error processing Order';
             res.say(prompt).reprompt("What would you like to do?").shouldEndSession(false).send();

         });
         return false;
     });



    app.intent('add_to_cart', {
        'slots': {

            'MENUITEM': 'MENUITEMS',
            'PORTIONS':'NUMBER'

        },
        "utterances":[ "{add|order|} {1-100|PORTIONS} {-|MENUITEM}" ]
    },
    function (req,res) {
        var faviosMomHelper = new FaviosMomHelper();

        faviosMomHelper.addToCart(req,res).then( function(response) {
            res.say(faviosMomHelper.formatAddToCart()).shouldEndSession(false).send();
        }).catch(function(err) {
            var prompt = 'Error occurred in Adding to Cart';
            res.say(prompt).reprompt(prompt).shouldEndSession(false).send();
            }
        );
       // res.say("Item added to cart").shouldEndSession(false).send();
       return false;
    });
/*
       app.intent('airportinfo', {

	 'slots': {

	    'AIRPORTCODE': 'FAACODES'

	  },

	  'utterances': ['{|flight|airport} {|delay|status} {|info} {|for} {-|AIRPORTCODE}']

	},

	  function(req, res) {
		  //get the slot

		  var airportCode = req.slot('AIRPORTCODE');

		  var reprompt = 'Tell me an airport code to get delay information.';

		  if (_.isEmpty(airportCode)) {

			  var prompt = 'I didn\'t hear an airport code. Tell me an airport code.';

			  res.say(prompt).reprompt(reprompt).shouldEndSession(false);

			  return true;

		  } else {

			  var faaHelper = new FAADataHelper();

			  faaHelper.requestAirportStatus(airportCode).then(function(airportStatus) {

				  console.log(airportStatus);

				  res.say(faaHelper.formatAirportStatus(airportStatus)).send();

			  }).catch(function(err) {

				  console.log(err.statusCode);

				  var prompt = 'I didn\'t have data for an airport code of ' + airportCode;

				  res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();

			  });

			  return false;

		  }


	  }

	);
*/
	module.exports = app;
