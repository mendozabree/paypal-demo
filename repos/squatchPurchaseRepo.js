((squatchPurchaseRepo, paypal, ObjectID, mongoService, paymentService, subService) => {

  squatchPurchaseRepo.BuySingle = (purchaseName, purchasePrice, taxPrice,
    shippingPrice, itemCount, description, cb) => {
    var transactionsArray = [];

    for (var i = 0; i < itemCount; i++) {
      var itemObj = paymentService.CreateItemObj(purchaseName, purchasePrice, 1)
      transactionsArray.push(itemObj)
    }

    var transactionItemObj = [paymentService.CreateTransactionObj(
      taxPrice, shippingPrice, description, transactionsArray
    )];

    paymentService.CreateWithPaypal(transactionItemObj,
      "http://127.0.0.1:8000/success",
      "http://127.0.0.1:8000/cancel", (err, results) => {
        if (err) {
          return cb(err)
        } else {
          return cb(null, results)
        }
      })
  }

  squatchPurchaseRepo.ExecuteOrder = (payerID, orderID, cb) => {
    paymentService.ExecutePayment(payerID, orderID, (err, response) => {
      return cb(err, response)
    })
  }

  squatchPurchaseRepo.CancelOrder = (orderID, cb) => {
    mongoService.Delete("paypal_orders", {_id: new ObjectID(orderID)}, (err, results) => {
      return cb(err, results)
    })
  }

  squatchPurchaseRepo.GetOrder = (orderID, cb)=>{
    mongoService.Read("paypal_orders", { _id: new ObjectID(orderID) }, (order_error, paymentObj) =>{
      if(order_error){
        return cb(order_error)
      } else {
        paymentService.GetPayment(paymentObj[0].OrderDetails.id, (err, results)=>{
          return cb(err, results)
        })
      }
    })
  }

  squatchPurchaseRepo.RefundOrder = (orderID, cb) => {
    squatchPurchaseRepo.GetOrder(orderID, (order_error, order)=>{
      if(order_error){
        return cb(order_error)
      }

      var saleID = order.transactions[0].related_resources[0].sale.id
      var refundPrice = Number(order.transactions[0].amount.total)

      paymentService.RefundPayment(saleID, refundPrice, (err, refund)=>{
        cb(err, refund)
      })
    })
  }

  squatchPurchaseRepo.BuyRecurring = (planName, description, setUp, cb)=>{
    var planObj = {
      PlanID: ""
    }

    mongoService.Create('paypal_plans', planObj, (err, results)=>{
      var returnUrl = "http://localhost:8000/recurring_success/"+ results.InsertedIds[0]
      var cancelUrl = "http://localhost:8000/recurring_cancel/"+ results.InsertedIds[0]

      var chargeModels = [
        subService.CreateChargeModelObj(0, "TAX"),
        subService.CreateChargeModelObj(0, "SHIPPING")
      ]

      var paymentDefinitionsArray = [
        subService.CreatePaymentDefinitionsObj(
          "Squatch Maintained Habitat Rental",
          10, "REGULAR", chargeModels, 12, "MONTH", 1
        )
      ]
      var billingPlanAtrributes = subService.CreateBillingPlanAttributesObj(
        planName, description, "YES", cancelUrl, returnUrl,
        "fixed", 0, paymentDefinitionsArray
      )

      subService.CreatePlan(billingPlanAtrributes, (err, newPlan)=>{
        mongoService.Update('paypal_plans', { _id: new ObjectID(results.InsertedIds[0]) },
        { PlanID: newPlan.id }, (err, results)=>{
          subService.UpdatePlanState(newPlan.id, "ACTIVE", (err, results)=>{
            var shippingObj = subService.CreateBillingShippingObj(
              "1 Boulder", "", "Boulder", "CO", 80301, "US"
            )

            var agreementObj = subService.CreateBillingAgreementAttributesObj(
              "Squatch Maintained Agreement",
              "Maintained Squatch Habitat",
              new Date(Date.now() + (5000*50)),
              newPlan.id,
              "PAYPAL",
              shippingObj
            )

            subService.CreateAgreement(agreementObj, (err, response)=>{
              for(var i=0; i < response.links.length; i++){
                if(response.links[i].rel == "approval_url"){
                  return cb(err, response.links[i].href);
                }
              }
            })
          })
        })
      })
    })
  }

  squatchPurchaseRepo.ExecuteRecurring = (token, cb)=>{
    subService.ExecuteAgreement(token, (err, results)=>{
      return cb(err, results)
    })
  }

  squatchPurchaseRepo.GetRecurringDetails = (agreementID, cb) => {
    subService.GetAgreement(agreementID, (err, results)=>{
      return cb(err, results)
    })
  }
})
  (
    module.exports,
    require('paypal-rest-sdk'),
    require('mongodb').ObjectId,
    require('../services/mongoService.js'),
    require('../services/paymentService.js'),
    require('../services/subscriptionService.js')
  )