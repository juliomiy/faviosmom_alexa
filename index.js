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
        //if (req.sessionDetails.application.applicationId!="amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000d00ebe") {
        //if (req.sessionDetails.application.applicationId!="arn:aws:lambda:us-east-1:318466891062:function:FaviosMom_Nodejs") {
        //if (req.sessionDetails.application.applicationId!="arn:aws:lambda:us-east-1:318466891062:function:FaviosMom_Nodejs") {
            // Fail ungracefully
       //     console.log("calling Fail in Pre App");
        //    res.fail("Invalid applicationId");
      //  }
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
        res.card({
            type:    "Simple",
            title:   "My Cool Card",  //this is not required for type Simple
            content: "This is the\ncontent of my card"
        });
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

    app.intent('open-for-business',
        {
            'slots': {
                "DAY" : "AMAZON.DATE",
            },
            'utterances': [ "{are you|} open {|today|tomorrow|this weekend|} {-|DAY}"]
        }, function(req,res) {
             var faviosMomHelper = new FaviosMomHelper();

             return false;
        });

    app.intent('menu', {

        'slots': {
            'TYPE':'MENU_TYPE',
         },
        'utterances': ['{tell me|what is|} {-|TYPE} menu' ]
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
    "utterances":[ "{place|commit} {|order}" ]
     },
     function(req,res) {
         console.log("In commit Order");
         var prompt;
         var faviosMomHelper = new FaviosMomHelper();

         // 1st make sure there are items in the cart
         if (!req.session('order')) {
             prompt = "No items in your cart to order";
             res.say(prompt).reprompt("What would you like to do?").shouldEndSession(false).send();
             return false;
         }
         faviosMomHelper.processOrder(req, res).then( function (order) {

             res.clearSession('order');
             res.clearSession('total_order_price');

             res.say(faviosMomHelper.formatProcessOrder(order)).shouldEndSession(false).send();
         }).catch(function (err) {
             prompt = 'Error processing Order';
             res.say(prompt).reprompt("What would you like to do?").shouldEndSession(false).send();

         });
         return false;
     });

/**
 * An intent that orally confirms the customers order which is represented by what is in the cart.
 * This method will start to use the "response" as a json object that contains both the "prompt" and the "reprompt"
 */
    app.intent('confirm_cart', {
        "slots": {

         },
        "utterances": ["{|tell me|what is|what's} {|my|the} {order|cart}" ]
         },
         function(req,res) {
             var faviosMomHelper = new FaviosMomHelper();
             var order = faviosMomHelper.confirmCart(req,res);
             var response = faviosMomHelper.formatConfirmCart(order);
             res.say(response.prompt).reprompt(response.reprompt).shouldEndSession(false).send();

             return false;
         });



    app.intent('add_to_cart', {
        'slots': {

            "MENUITEM": "MENUITEMS",
            "PORTIONS": "AMAZON.NUMBER"

        },
        "utterances":[ "{add|order|} {-|PORTIONS} {|of} {-|MENUITEM}" ]
    },
    function (req,res) {
        var faviosMomHelper = new FaviosMomHelper();

        faviosMomHelper.addToCart(req,res).then( function(response) {
            var reprompt = "Would you like to add more items to cart?"
            res.say(faviosMomHelper.formatAddToCart(response)).reprompt(reprompt).shouldEndSession(false).send();
        }).catch(function(err) {
            var prompt = 'Error occurred in Adding to Cart';
            res.say(prompt).reprompt(prompt).shouldEndSession(false).send();
            }
        );
       // res.say("Item added to cart").shouldEndSession(false).send();
       return false;
    });

//hack to support custom utterances in utterance expansion string
var utterancesMethod = app.utterances;
app.utterances = function() {
    return utterancesMethod().replace(/\{\-\|/g, '{');
};

module.exports = app;
