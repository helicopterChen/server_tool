/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-03 17:43:25
 * @LastEditTime: 2019-04-24 16:41:44
 */
let express = require('express');
let Session = require('express-session');
let request = require('request');
var bodyParser = require('body-parser');
let moment = require('moment');
let DataMgr = require('./DataMgr.js');
const {google} = require('googleapis'); 
var morgan = require('morgan');
let adsenseApi = google.adsense("v1.4");
let tGooleTokens = null;
var OAuth2 = google.auth.OAuth2;
var ClientId = "496601356493-n97c6f4p3g21qvnf01la3i51o0a1dpn5.apps.googleusercontent.com";
var ClientSecret = "XeVYyb1um5dfP3xmAevMNqrl";
var RedirectUrl = "http://ttt.cwpro.xyz/oauthCallback";

const STR_FORMAT = require('string-format');
let fs = require('fs');
var PORT = 9000;
var app = express();
let T_CONFIG = {}

app.use(morgan('short'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({type: 'text/plain'}))
app.use(bodyParser.text({ type: 'text/html' }))

app.use(Session({
    secret: 'secret-19890913007',
    resave: true,
    saveUninitialized: true
}));


app.use(express.static("./public"))
if(!fs.existsSync("./saved_data")){
    fs.mkdirSync("./saved_data");
}

/**
 * 创建OAuth客户端
 */
function getOAuthClient() {
    return new OAuth2(ClientId, ClientSecret, RedirectUrl);
}
/**
 * 生成向认证服务器申请认证的Url
 */
function getAuthurl() {
    var oauth2Client = getOAuthClient();
    // 生成一个url用来申请Googe+和Google日历的访问权限
    var scopes = [
        'https://www.googleapis.com/auth/adsense.readonly'
        // 'https://www.googleapis.com/auth/calendar'
    ];
    var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        // Optional property that passes state parameters to redirect URI
        state: { foo: 'bar' }
    });
    return url;
}

app.get("/oauthCallback", function(req, res) {
    // 获取url中code的值
    var code = req.query.code;
    var session = req.session;
    // 使用授权码code，向认证服务器申请令牌
    var oauth2Client = getOAuthClient();
    oauth2Client.getToken(code, function(err, tokens) {
        // tokens包含一个access_token和一个可选的refresh_token
        if (!err) {
            oauth2Client.setCredentials(tokens);
            tGooleTokens=tokens;
            session["tokens"] = tokens;
            res.writeHead(200,{'Content-Type':'text/html'})
            fs.readFile("./page/Login.html",(err,data)=>{
                res.end(data)
            });
            return
        } else {
            res.send(`<h3>Login failed!!</h3>`)
        }
    });
});

app.get("/refetch_sevendays", function(req, res) {
    var session = req.session;
    if(!session["tokens"]){
        let url = getAuthurl();
        res.send(`<h1>Google Play授权</h1><a href=${url}>点击授权</a>`);
        return
    }
    DataMgr.Instance.refetchSevenDay();
});

app.get("/debug",async(req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html'})
    fs.readFile("./page/Login.html",(err,data)=>{
        res.end(data)
    });
});

app.get("/main",async(req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html'})
    if(req.session.sign){
        fs.readFile("./page/ReportTool.html","utf-8",(err,data)=>{
            res.end(data)
          });
        return
    }
});

app.get("/auth",async(req,res)=>{
    var session = req.session;
    session["tokens"]=null;
    if(!session["tokens"]){
        let url = getAuthurl();
        res.send(`<h1>Google Play授权</h1><a href=${url}>点击授权</a>`);
        return
    }
    res.writeHead(200,{'Content-Type':'text/html'})
    if(req.session.sign){
        fs.readFile("./page/ReportTool.html","utf-8",(err,data)=>{
            res.end(data)
          });
        return
    }
    fs.readFile("./page/Login.html",(err,data)=>{
      res.end(data)
    });
});

app.post("/login_form",async(req,res)=>{
    if(req.session.sign){
        res.send({status:"success"});  
        return;
    }
    let tBody = req.body;
    let sAccount = tBody["record[Account]"];
    let sPassword = tBody["record[Password]"];
    let sPwd = T_CONFIG.Account[sAccount];
    if(sPwd == sPassword){
        req.session.sign=true;
        res.send({status:"success"});       
    }else{
        res.send({status:"success",err:"PWD_ERR"});  
    }
});

app.get("/", async(req, res)=> {
    fs.readFile("./page/Login.html",(err,data)=>{
        res.end(data)
      });    
});

app.get("/query_admob",(req,res)=>{
    let tBody = req.body;
    if(!tGooleTokens||!tBody){
        res.send("");
        return;
    }
    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tGooleTokens);
    adsenseApi.reports.generate({
            auth:oauth2Client,
            accountId:"pub-5287525632142158",
            startDate:tBody.Date,
            endDate:tBody.Date,
            dimension:[
                "DATE", "APP_ID", "APP_NAME", "APP_PLATFORM", "AD_UNIT_NAME", "AD_UNIT_ID", "COUNTRY_CODE"
            ],
            metric:[
                "AD_REQUESTS", "CLICKS", "INDIVIDUAL_AD_IMPRESSIONS", "EARNINGS", "MATCHED_AD_REQUESTS"
            ],
            useTimezoneReporting:true
        },
        function(err, response){
            if (!err) {
                let text = ""
                let rows = response.data.rows;
                if(rows){
                    for(let val of rows){
                        text+=val+"\n";
                    }
                }
                res.send(text);
            } else {
                res.send()
            }
        }
    )
});

app.post("/query_form", async(req, res)=> {
    let tBody = JSON.parse(req.body.request);
    if(!tBody){
        return;
    }
    if(tBody.Type=="app_list"){
        res.send({status:"success",data:T_CONFIG.Apps});
        return;
    }
    DataMgr.Instance.GetNetworkDateData(tBody.Type,tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
});

app.post("/query_network_data", async(req, res)=> {
    let tBody = req.body;
    if(!tBody){
        return;
    }
    DataMgr.Instance.GetNetworkDateData(tBody.Type,tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
});

app.post("/query_data", async(req,res)=>{
    let tBody = req.body
    if(!tBody){
        return;
    }
    DataMgr.Instance.GetDateSavedAllData(tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
})

app.get("/facebook", async(req, res)=> {
    let now = moment();
    let nFinishCount = 0;
    for(let i = 1; i<=3;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/Facebook.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetFacebookDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                        console.log("nFinishCount " + nFinishCount);
                    }
                })
            });
        }
    }
});

async function GetFacebookDateData(sDate,pCallback){
    let sURL = "https://graph.facebook.com/v3.2/{}/adnetworkanalytics/?metrics=['fb_ad_network_imp','fb_ad_network_filled_request','fb_ad_network_cpm','fb_ad_network_request','fb_ad_network_click','fb_ad_network_revenue']&since={}&until={}&breakdowns=['platform','country','placement']&access_token={}"
    let URL_STR = STR_FORMAT(sURL,T_CONFIG.Keys.Facebook.Tricky3.ID,sDate,sDate,T_CONFIG.Keys.Facebook.Tricky3.Token);
    let FACEBOOK_RESULT_QUERY = STR_FORMAT("https://graph.facebook.com/v3.2/{}/adnetworkanalytics_results/?query_ids=['",T_CONFIG.Keys.Facebook.Tricky3.ID);
    let tOptions = 
    {
        url:URL_STR,
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'Accept':'application/json'     
        }
    }
    let rep = await DoRequest(tOptions);
    let tData = JSON.parse(rep.body);
    if(tData){
        let tQueryResultOptions={
            url: FACEBOOK_RESULT_QUERY+tData.query_id+"']&access_token="+T_CONFIG.Keys.Facebook.Tricky3.Token, 
            method: 'GET', 
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept:'application/json'
        }
        setTimeout( async()=>{ 
            let result = await DoRequest(tQueryResultOptions)
            let tFacebookData = ProcessFacebookData(result.body);
            pCallback(tFacebookData);
        }, 5000);
    }
}

function ProcessFacebookData(sBody){
    let tBody = JSON.parse(sBody);
    if(!tBody||!tBody.data||!tBody.data[0]||!tBody.data[0].results){
        return;
    }
    let tDataMap = {android:{},ios:{},unknown:{}}
    let tResults = tBody.data[0].results;
    for(let tResult of tResults){
        let sPlatform = tResult.breakdowns[0].value;
        let sCountry = tResult.breakdowns[1].value;
        let nPlacementId = tResult.breakdowns[2].value;
        if(tDataMap[sPlatform][nPlacementId]==null){
            tDataMap[sPlatform][nPlacementId] = {};
        }
        if(!tDataMap[sPlatform][nPlacementId][sCountry]){
            tDataMap[sPlatform][nPlacementId][sCountry]={};
        }
        tDataMap[sPlatform][nPlacementId][sCountry][tResult.metric] = tResult.value;
    }
    for(let sPlacementId in tDataMap.unknown){
        let tPlacement = tDataMap.unknown[sPlacementId];
        let tPlatformPlacement = tDataMap.android[sPlacementId];
        if(!tPlatformPlacement){
            tPlatformPlacement = tDataMap.ios[sPlacementId];
        }
        if(tPlatformPlacement){
            for(let country in tPlacement){
                if(!tPlatformPlacement[country]){
                    tPlatformPlacement[country] = tPlacement[country];
                }else{
                    let tPlatformCountryData = tPlatformPlacement[country];
                    for(let metric in tPlacement[country]){
                        if(!tPlatformCountryData[metric]){
                            tPlatformCountryData[metric]=parseFloat(tPlacement[country][metric]);
                        }else{
                            tPlatformCountryData[metric]=parseFloat(tPlatformCountryData[metric])+parseFloat(tPlacement[country][metric]);
                        }
                    }
                }
            }
        }
    }
    let tMap = [];
    tDataMap.unknown=undefined;
    for(let sPlatform in tDataMap){
        let tPlatformData = tDataMap[sPlatform];
        for(let sPlacementId in tPlatformData){
            let tPlacementData = tPlatformData[sPlacementId];
            for( let sCountry in tPlacementData){
                let tConvertedData = {}
                let tMetricData = tPlacementData[sCountry];
                tConvertedData["APP_ID"] = "";
                tConvertedData["APP_NAME"] = "";
                tConvertedData["AD_UNIT"] = sPlacementId;
                tConvertedData["COUNTRY"] = sCountry.toUpperCase();
                tConvertedData["PLATFORM"] = sPlatform;
                tConvertedData["REVENUE"] =  tMetricData["fb_ad_network_revenue"] || 0;
                tConvertedData["REQUEST"] = tMetricData["fb_ad_network_request"] || 0;
                tConvertedData["VIEWS"] = tMetricData["fb_ad_network_imp"] || 0;
                tConvertedData["COMPLETES"] = tMetricData["fb_ad_network_filled_request"] || 0;
                tConvertedData["CLICKED"] = tMetricData["fb_ad_network_click"] || 0;
                tConvertedData["ECPM"] = tMetricData["fb_ad_network_cpm"] || 0;
                tConvertedData["DATE"] = "";
                tMap.push(tConvertedData);
            }
        }
    }
    return tMap;
}

let DoRequest = function(tOptions){
    return new Promise(function (resolve, reject) {
        if(tOptions.method=="GET"){
            request.get(tOptions, function(err, response, body){
                if(err){
                    console.log(err);
                    reject();
                }else{
                    resolve(response);
                }
            });
        }
        else if(tOptions.method=="POST"){
            request.post(tOptions, function(err, response, body){
                if(err){
                    console.log(err);
                    reject();
                }else{
                    resolve(response);
                }
            });
        }
    });
}


fs.readFile("./config.json",'utf-8', function(err, data) {  
    T_CONFIG=JSON.parse(data);
    app.listen(PORT,()=>{
        DataMgr.Instance.Init(T_CONFIG);
        DataMgr.Instance.Start();
    });
});