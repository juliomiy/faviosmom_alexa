'use strict';
/**
 * Created by jmiyares on 11/10/16.
 */

module.change_code = 1;

var winston = require('winston');
winston.add(
    winston.transports.File, {
        filename: 'faviosmom-alexa.log',
        level: 'info',
        json: true,
        //  eol: 'n', // for Windows, or `eol: ‘n’,` for *NIX OSs
        timestamp: true
    }
);
function Utility() {
    var prompt = {
        "HelpIntent": {
            "prompt": "Favio's Mom allows you to order various Cuban culinary staples",
            "reprompt": "Ask for Menu List"
        },
        "SessionEnded": {
            "prompt": "Goodbye! Come back soon to Favios's Mom.",
            "reprompt": null
        },
        "commit_order_no_items": {
            "prompt": "No items in your cart to order",
            "reprompt": "What would you like to do?"
        },
        "add_to_cart": {
            "prompt": null,
            "reprompt": "Complete order and proceed to payment or keep on adding to the cart"
        },
        "menuitems_not_found": {
            "prompt": " Menu Item not found",
            "reprompt":null
        }
    }

    this.log = function (log_level, section, key_value) {
        winston.log(log_level, section, key_value);
    };

    this.prompt = function(index) {
        try {
            return prompt[index];
        } catch (err) {
            return {
                "prompt": "internal Error occurred",
                "reprompt": "internal Error occurred"
            };
        }
    }
}


module.exports = new Utility();


