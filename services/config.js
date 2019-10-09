((configRepo, dotenv)=>{
  dotenv.config();
  configRepo.SetConfig = (paypal)=>{
    var config = {
      host: process.env.HOST,
      port: "",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    };
    paypal.configure(config);
  };
})
(
  module.exports,
  require('dotenv')
)