/**
 * Bamazon Customer 
 * run by writing `node bamazonCustomer.js` in your console
 */

var mysql = require("mysql");
var inquirer = require('inquirer');

//connect to mysql db
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
});

//initialize the connection
connection.connect(function (err) {
    if (err) throw err;
    console.log("\n**WELCOME TO THE STORE!**  Here is a list of items for sale:\n\n" +
        "Item Id | Product Name | Department | Price | Number in Stock\n" +
        "-------------------------------------------------------------\n");
    printProducts();
});

//print a list of products in the store 
function printProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        //loop through each result and display it in a friendly format 
        for (var i = 0; i < res.length; i++) {
            //I like using template literals rather than concatenation 
            console.log(
                `${res[i].item_id} | ${res[i].product_name} |  ${res[i].department_name} | $${res[i].price} | ${res[i].stock_quantity} \n`
            );
        }
        promptUser(res)
    });
}


//Prompt the user with 2 messages
function promptUser(res) {
    inquirer.prompt(
        //1. Ask them the ID of the product they would like to buy.
        {
            name: 'product',
            type: 'input',
            message: 'What is the Item Number for the product you would like to purchase?',
            validate: function (value) {
                if (parseInt(value) > 0 && value < res.length + 1) {
                    return true;
                }
                return 'Please enter a valid Item Number';
            }
        }
    ).then(answer => {
        var id = parseInt(answer.product) - 1;
        var name = res[id].product_name;
        var price = res[id].price;
        var inStock = res[id].stock_quantity;
        console.log(`You have chosen ${name} for $${price} each`);

        //2. Ask how many units of the product they would like to buy.
        inquirer.prompt(
            {
                name: 'quantity',
                type: 'input',
                message: 'How many items would you like to purchase?',
                validate: function (value) {
                    if (parseInt(value) > 0 && value < (inStock + 1)) {
                        return true;
                    }
                    return "Insufficient quantity! We only have " + res[id].stock_quantity + " left.";
                }
            }
        ).then(answer => {
            var qty = answer.quantity;
            //Used toFixed to limit number to 2 decimal places 
            var total = parseFloat(qty * price).toFixed(2);;
            orderReceipt(res);


            function orderReceipt(res) {
                console.log('\n-----Purchase receipt:-----');
                console.log(`${qty} ${name} $${price} each = $${total}`);
                console.log('---------------------------');
                updateStock(res)
            };
            function updateStock(res) {
                var updatedStockQty = res[id].stock_quantity - qty
            
                connection.query ("UPDATE products SET stock_quantity = " + updatedStockQty + " WHERE product_name = '" + name +"';", function (err, res2) {
                    console.log(`\nAfter your purchase, we now have ${updatedStockQty} ${name}(s) left.`);
                    endTransaction();
                })
            };

            function endTransaction(res) {
                console.log('Thank you come again!');
                connection.end()
            };
        });
    });
};
