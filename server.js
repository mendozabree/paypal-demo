((express, server, bodyParser, fs, squatchPurchaseRepo) => {
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(express.static("pub"));

  server.get('/', (req, res) => {
    fs.readFile("./templates/home.html", (err, results) => {
      res.send(results.toString());
    });
  });

  server.get('/success/:orderID', (req, res) => {
    var orderID = req.params.orderID;
    var payerID = req.query.PayerID;

    squatchPurchaseRepo.ExecuteOrder(payerID, orderID, (err, successID)=>{
      if(err){
        res.send("<h3>Oooops!</h3> Sorry there was an error trying to complete your transaction. Please try any of the following" +
        "<ul><li>1. Confirm you have enough money on your account</li><li>2. Try doing the purchase again</li>"+
        "<li>3. If problem persists, email us at help@sasquatch.com with details and we get to you in less than 24 hours</li></ul>")
      } else {
        res.send("<h1>Order Placed</h1>Please save your order confirmation number: <h3>" + successID + "</h3>")
      }
    })
  });

  server.get('/orderdetails/:orderID', (req, res)=>{
    var orderID = req.params.orderID;

    squatchPurchaseRepo.GetOrder(orderID, (err, results)=>{
      if(err){
        res.json(err);
      } else {
        res.json(results)
      }
    })
  })

  server.post('/buysingle', (req, res) => {
    var quantity = req.body.Quantity;
    var purchaseName = "Single Squatch Habitat";
    var purchasePrice = 10.00;
    var taxPrice = 0;
    var shippingPrice = 0;
    var description = "Single Habitat Sasqutch Starter Kit";

    squatchPurchaseRepo.BuySingle(purchaseName, purchasePrice, taxPrice,
      shippingPrice, quantity, description, (err, url) => {
        if (err) {
          res.json(err)
        } else {
          res.redirect(url);
        }
      })
  });

  server.get('/cancel/:orderID', (req, res) => {
    var orderID = req.params.orderID;

    squatchPurchaseRepo.CancelOrder(orderID, (err, results)=>{
      if(err){
        res.send("There was an error removing this order")
      } else{
        res.redirect("/")
      }
    })
  })

  server.get('/refund/:orderID', (req, res) => {
    var orderID = req.params.orderID;

    squatchPurchaseRepo.RefundOrder(orderID, (err, refund)=>{
      if(err){
        res.json(err)
      } else {
        res.json(refund)
      }
    })
  });

  server.get('/recurring_cancel/:planID', (req, res) => {
    var planID = req.params.planID;
  });

  server.get('/buyrecurring', (req, res) => {
    squatchPurchaseRepo.BuyRecurring(
      "Squatch Plan",
      "RecurringSquatch Plan",
      0, (err, plan)=>{
        if(err){
          res.json(err)
        } else {
          res.redirect(plan);
        }
      }
    )
  });

  server.get('/recurring_success/:planID', (req, res) => {
    var planID = req.params.planID;
    var toekn = req.query.token;

    squatchPurchaseRepo.ExecuteRecurring(planID, token, (err, results)=>{
      if(err){
        res.json(err)
      }else{
        res.json(results)
      }
    })
  });

  server.get('/recurring_oderdetails/:agreementID', (req, res) => {
    var agreementID = req.params.argreementID;

    squatchPurchaseRepo.GetRecurringDetails(agreementID, (err, recurring_orderdeatils)=>{
      if(err){
        res.json(err)
      } else {
        res.json(recurring_orderdeatils)
      }
    })
  });

  server.listen(8000, "localhost", (err) => {
    console.log(err || "Server Online: localhost:8000");
  });
})
  (
    require('express'),
    require('express')(),
    require('body-parser'),
    require('fs'),
    require('./repos/squatchPurchaseRepo.js')
  );