/**
 * Created by juliomiyares on 10/23/16.
 */
'use strict';
module.change_code = 1;

//var config = require('config').has('Faviosmom');
var config = require('config');

var _ = require('lodash');
var rp = require('request-promise');
var ENDPOINT = (config ? (config.has('apiConfig.endpoint')) ? config.get('apiConfig.endpoint') : "http://104.155.167.140:8000/v1/" : "http://104.155.167.140:8000/v1/") ;

//var ENDPOINT = 'http://ec2-52-90-1-68.compute-1.amazonaws.com:8000/v1/';

function FaviosMomHelper() {
}

FaviosMomHelper.prototype.requestOpenForBusiness = function(req,res) {

};
/*
invoked by Alexa to retrieve menu
 */
FaviosMomHelper.prototype.requestMenu = function(type) {

    return this.getMenu(type).then(

        function(response) {
            return response.body;
        }
    );
};
/**
 * Invoke the menu api
 */
FaviosMomHelper.prototype.getMenu = function(type ) {

    var path = "menu";

    if (type) {
        path += "/" + type;
    }

    var options = {

        method: 'GET',

        uri: ENDPOINT + path,

        resolveWithFullResponse: true,

        json: true

    };

    return rp(options);

};
/**
 *
 * @param menu; a json response of the menu API
 * @returns {string for reading by Alexa}
 */
FaviosMomHelper.prototype.formatMenu = function(menu) {
    var menuArray;
    var response = "";
    var item = '';

    if (menu !== null && menu.result.length) {
        menuArray = menu.result;
        var cnt = 0;
        for (var i in menuArray) {
            item = menuArray[i].name;
            response +=  (cnt > 0 ? "," : "") + item;
            cnt++;
        }
        response = "Available today are " + response;
    } else {
        response = "No available menu items at the moment. Try again later";
    }
    return(response);
}
FaviosMomHelper.prototype.requestMenuItem = function(menuItem) {

    return this.getMenuItems(menuItem).then(

        function(response) {
            return response.body;
        }
    );
};
/**
 * invoke the menuitems api. This api is intended to get a list of items
 */
FaviosMomHelper.prototype.getMenuItems = function(menuItem) {

    var path = "menuitems/";
    if (menuItem) path += menuItem;

    var options = {

        method: 'GET',

        uri: ENDPOINT + path,

        resolveWithFullResponse: true,

        json: true

    };

    return rp(options);
};
/**
 * Intended to do a lookup of a specific , at most one MenuItem
 */
FaviosMomHelper.prototype.getMenuItem = function(menuItem) {

    var options = {

        method: 'GET',

        uri: ENDPOINT + "menuitem" + "/" + menuItem,

        resolveWithFullResponse: true,

        json: true

    };

    return rp(options);
};

FaviosMomHelper.prototype.formatMenuItem = function(slotMenuItem, menuItem) {
    var menuArray;
    var response = "";
    var item = '';

    if (menuItem !== null && menuItem.result.length) {
        menuArray = menuItem.result;
        var cnt = 0;
        var price, portion;
        for (var i in menuArray) {
            item = menuArray[i].name;
            price =  menuArray[i].price;
            portion = menuArray[i].portion_size;
            response +=  (cnt > 0 ? "," : "") + item;
            cnt++;
        }
        response = "Available today are " + response;
    } else {
        response = slotMenuItem + " not available at the moment. Try again later";
    }
    return(response);
}
/*
Invokes the persisting of an order. The order information is stored in Session variables .

TODO - need to tie in Customer record and security as well as payment methods or Cash on Delivery
 */
FaviosMomHelper.prototype.processOrder = function (req, res) {
//    debugger;
    console.log("In Process Order ");
    return this.commitOrder(req,res).then(

        function(response) {
            return response.body;
        }
    );

}

FaviosMomHelper.prototype.commitOrder = function(req,res) {
//    debugger;
//    debugger;
    console.log("in commitOrder");
    //console.log(JSON.stringify(order));
    var order = req.session('order');
    var total_order_price = req.session('total_order_price');

    var options = {

        method: 'POST',

        uri: ENDPOINT + "order" + "/" ,

        body: {
            order: order,
            total_order_price: total_order_price
        },
        resolveWithFullResponse: true,

        json: true

    };

    return rp(options);
};
/*
Takes the reponse from commitOrder and styles for Alexa
 { statuscode: 200,
 rows: 1,
 api: 'order',
 result:
 { orderID: 1477444225263,
 total_order_price: '27.56' } }
 */
FaviosMomHelper.prototype.formatProcessOrder = function(order) {
    var response;
    try {
        var tmp = JSON.stringify(order);
        var orderJsonResponse = JSON.parse(tmp);
        if (orderJsonResponse['statuscode']  == "200" && orderJsonResponse['rows'] == 1) {
            response = "Order " + orderJsonResponse['result']['orderID'] + " successfully processed";
        } else {
            response = "Error Processing Order. Call Customer Support";
        }

    } catch (e) {
        response = "Error Processing Order - invalid JSON. Call Customer Support";
    }
    return response;
}

FaviosMomHelper.prototype.addToCart = function(req,res) {
      var slotMenuItem, slotPortions, menuItem, total_order_price = 0;
      var updated_order = [];
      var menuitem_id;

      slotMenuItem = req.slot('MENUITEM');
      slotPortions = (req.slot('PORTIONS') ? req.slot('PORTIONS') : 1);

      return this.getMenuItem(slotMenuItem).then( function(response) {
          var current_order = (res.session('order') ? res.session('order') : []);
           if (response.body['statuscode'] == "200" && response.body['rows'] == 1) {
               menuItem = response.body['result'];
               menuItem[0].portions = slotPortions;
               //calculate total order price - also merge duplicate entries for the same menu_item
               var t = merge_order(current_order,menuItem[0]);
               if (t)
                 current_order.push(menuItem[0]);
               for (var i =0; i <current_order.length;i++) {
                   menuitem_id = current_order[i].id;
                   filter(updated_order, menuitem_id);
                   total_order_price += current_order[i].portions * current_order[i].price;
               }
               current_order.total_order_price = total_order_price;
               res.session('order', current_order);
               res.session('total_order_price', total_order_price);
               return menuItem[0];
           }
           return menuItem[0];
      });
}

FaviosMomHelper.prototype.formatAddToCart = function(add_to_cart_item) {


    if (add_to_cart_item) {
        var portions = parseInt(add_to_cart_item.portions);
        response.prompt = "Added " + ((portions > 1) ? portions + " portions":" one portion") + " of " + add_to_cart_item.name + " to cart.";
        response.reprompt = "Complete order and proceed to payment or keep on adding to the cart";
    }
    return response;
}

FaviosMomHelper.prototype.confirmCart = function(req,res) {
     return req.session('order') ? req.session('order') : [];
}

FaviosMomHelper.prototype.formatConfirmCart = function(order) {
    var current_order_price = 0 , menuitem_price;
    var response = { "prompt": "",
        "reprompt": ""};

    if (!order || !order.length) {
        response.prompt = "No items in your cart";
    } else {
        for (var i=0; i<order.length;i++) {
            menuitem_price = parseInt(order[i].price);
            response.prompt +=  (i ? "," : "") + order[i].portions + " Portions of " + order[i].name;
            current_order_price += menuitem_price * order[i].portions;
        }
        if (response.prompt) response.prompt = "You have " + response.prompt + " at total price of " + current_order_price;
    }
    return response;
}
function merge_order(array, menuItem) {
    for (var i=0; i<array.length;i++) {
        if (menuItem.id != array[i].id) continue;
        array[i].portions = parseInt(array[i].portions) + parseInt(menuItem.portions );
        return;
    }
    return menuItem;
}

function filter(array,value) {
     for (var i=0; i<array.length;i++) {
        if (array[i].id == value) return array[i];
     }
 return undefined;
}



module.exports = FaviosMomHelper;
