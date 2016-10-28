/**
 * Created by juliomiyares on 10/23/16.
 */
'use strict';
module.change_code = 1;

var _ = require('lodash');
var rp = require('request-promise');
var ENDPOINT = 'http://localhost:8000/v1/';

function FaviosMomHelper() {
}
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
 * invoke the menuitems api
 */
FaviosMomHelper.prototype.getMenuItems = function(menuItem) {

    var options = {

        method: 'GET',

        uri: ENDPOINT + "menuitems" + "/" + menuItem,

        resolveWithFullResponse: true,

        json: true

    };

    return rp(options);
};

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
      slotMenuItem = req.slot('MENUITEM');
      slotPortions = (req.slot('PORTIONS') ? req.slot('PORTIONS') : 1);
      console.log("in add to Cart");
      console.log("value of slotMenItem = " + slotMenuItem);

      return this.getMenuItem(slotMenuItem).then( function(response) {
          var current_order = (res.session('order') ? res.session('order') : []);
          console.log(JSON.stringify(current_order));
           console.log(JSON.stringify(response.body));
           if (response.body['statuscode'] == "200" && response.body['rows'] == 1) {
               menuItem = response.body['result'];
               menuItem[0].portions = slotPortions;
               //calculate total order price
               current_order.push(menuItem[0]);
               for (var i =0; i <current_order.length;i++) {
                   total_order_price += current_order[i].portions * current_order[i].price;
               }
               current_order.total_order_price = total_order_price;
              // current_order = JSON.parse(JSON.stringify(current_order));
               res.session('order', current_order);
               res.session('total_order_price', total_order_price);

           }
      });
}

FaviosMomHelper.prototype.formatAddToCart = function() {
    var response;

    response = "Add item to cart - TEST";
    return response;
}
module.exports = FaviosMomHelper;
