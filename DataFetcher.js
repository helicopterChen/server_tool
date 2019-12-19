/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-03-29 09:27:19
 * @LastEditTime: 2019-05-06 17:00:27
 */
let moment = require('moment');
let request = require('request');
let crypto = require('crypto');
const STR_FORMAT = require('string-format');

function cryptMd5(sData) {
    var md5 = crypto.createHash('md5');
    return md5.update(sData).digest('hex');
}

(function(window) {
    function DoRequest(tOptions){
        return new Promise(function (resolve, reject) {
            if(tOptions.method=="GET"){
                request.get(tOptions, function(err, response, body){
                    if(err){
                        reject();
                    }else{
                        resolve(response);
                    }
                });
            }
            else if(tOptions.method=="POST"){
                request.post(tOptions, function(err, response, body){
                    if(err){
                        reject();
                    }else{
                        resolve(response);
                    }
                });
            }
        }).catch((error) => {
        });
    }

    function ProcessAdmobData(sBody){
        if(sBody==""){
            return null;
        }
        let tRow = sBody.split('\n');
        let tMap = [];
        let tHeads = [
            "Date","AppId","GameName","Platform","AdUnitName","AdUnit","Country","AdRequests","Clicks","Views","Revenue","Avaliable"
        ];
        for(let i=0;i<tRow.length;++i){
            let tRowData = tRow[i].split(',');
            let tData = {};
            let tConvertedData = {}
            for(let j=0;j<tRowData.length;++j){
                let sVal = tRowData[j].replace(/^\"|\"$/g,'');
                if(tHeads[j]=="Date"){
                    tData[tHeads[j]]= sVal.split(' ')[0];
                }else if(tHeads[j]=="AppId"){
                    tData[tHeads[j]] = sVal.substring(2)
                }else{
                    tData[tHeads[j]]=parseFloat(sVal) || sVal;
                }
            }
            tConvertedData["APP_ID"] = tData["AppId"];
            tConvertedData["APP_NAME"] = tData["GameName"];
            tConvertedData["AD_UNIT"] = tData["AdUnit"];
            tConvertedData["COUNTRY"] = tData["Country"];
            tConvertedData["PLATFORM"] = tData["Platform"];
            tConvertedData["REVENUE"] = tData["Revenue"];
            tConvertedData["REQUEST"] = tData["AdRequests"];
            tConvertedData["CLICKED"] = tData["Clicks"];
            tConvertedData["VIEWS"] = tData["Views"];
            tConvertedData["COMPLETES"] = tData["Views"];
            tConvertedData["AVALABLE"] = tData["Avaliable"];
            tConvertedData["DATE"] = tData["Date"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            if(sAppID){
                let sCountry = tRowData.COUNTRY
                let sAdUnit = tRowData.AD_UNIT
                if(!tDayData[sAppID]){
                    tDayData[sAppID] = {}
                }
                if(!tDayData[sAppID]){
                    tDayData[sAppID] = {}
                }
                if(!tDayData[sAppID][sCountry]){
                    tDayData[sAppID][sCountry] = {}
                }
                if(!tDayData[sAppID][sCountry][sAdUnit]){
                    tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0,CLICKED:0}
                }
                let tAdDayData = tDayData[sAppID][sCountry][sAdUnit];
                tAdDayData.REQUEST+=parseInt(tRowData.REQUEST);
                tAdDayData.AVALABLE+=parseInt(tRowData.AVALABLE);
                tAdDayData.VIEWS+=parseInt(tRowData.VIEWS);
                tAdDayData.CLICKED+=parseInt(tRowData.CLICKED);
                tAdDayData.COMPLETES+=parseInt(tRowData.COMPLETES);
                tAdDayData.REVENUE+=parseFloat(tRowData.REVENUE);    
            }
        }
        return tDayData
    }

    function ProcessFacebookData(tBody){
        if(!tBody||!tBody.data||!tBody.data[0]||!tBody.data[0].results){
            return {};
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
                    tConvertedData["AD_UNIT"] = sPlacementId;
                    tConvertedData["COUNTRY"] = sCountry.toUpperCase();
                    tConvertedData["PLATFORM"] = sPlatform;
                    tConvertedData["REVENUE"] =  tMetricData["fb_ad_network_revenue"] || 0;
                    tConvertedData["REQUEST"] = tMetricData["fb_ad_network_request"] || 0;
                    tConvertedData["VIEWS"] = tMetricData["fb_ad_network_imp"] || 0;
                    tConvertedData["AVALABLE"] = tMetricData["fb_ad_network_filled_request"] || 0;
                    tConvertedData["CLICKED"] = tMetricData["fb_ad_network_click"] || 0;
                    tConvertedData["COMPLETES"] = 0;
                    tConvertedData["DATE"] = "";
                    tMap.push(tConvertedData);
                }
            }
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            let sPlatForm = tRowData.PLATFORM;
            if(!tDayData[sPlatForm]){
                tDayData[sPlatForm] = {};
            }
            if(!tDayData[sPlatForm][sCountry]){
                tDayData[sPlatForm][sCountry] = {}
            }
            if(!tDayData[sPlatForm][sCountry][sAdUnit]){
                tDayData[sPlatForm][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0,CLICKED:0}
            }
            let tAdDayData = tDayData[sPlatForm][sCountry][sAdUnit];
            tAdDayData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdDayData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdDayData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdDayData.CLICKED+=parseInt(tRowData.CLICKED);
            tAdDayData.COMPLETES+=parseInt(tRowData.COMPLETES);
            tAdDayData.REVENUE+=parseFloat(tRowData.REVENUE);    
        }
        return tDayData
    }

    async function RequestAdmobData(sDate,pCallback){
        let sURL = "http://localhost:9000/query_admob"
        let tOptions={
            url:sURL,
            method: 'GET',
            headers:{
                'Content-Type': 'application/json',
                'Accept':'application/json'     
            },
            body:JSON.stringify({
                Date:sDate
            }) 
        }
        let rep = await DoRequest(tOptions);
        let tAdmobData = ProcessAdmobData(rep.body);
        pCallback(tAdmobData);
    }
    
    async function RequestFacebookData(sDate,sToken,sID,pCallback){
        let nLimit = 1000;
        let doQueryAll=async()=>{
            let sURL = "https://graph.facebook.com/v3.2/{}/adnetworkanalytics/?metrics=['fb_ad_network_imp','fb_ad_network_filled_request','fb_ad_network_ctr','fb_ad_network_request','fb_ad_network_click','fb_ad_network_revenue']&since={}&until={}&breakdowns=['platform','country','placement']&access_token={}&limit={}"
            let URL_STR = STR_FORMAT(sURL,sID,sDate,sDate,sToken,nLimit);
            let FACEBOOK_RESULT_QUERY = STR_FORMAT("https://graph.facebook.com/v3.2/{}/adnetworkanalytics_results/?query_ids=['",sID);    
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
            if(!rep||!rep.body){
                pCallback()
                return;
            }
            let tData = JSON.parse(rep.body);
            if(tData){
                let tQueryResultOptions={
                    url: FACEBOOK_RESULT_QUERY+tData.query_id+"']&access_token="+sToken, 
                    method: 'GET', 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept:'application/json'
                }
                let doQuery = null;
                doQuery =()=>{
                    setTimeout( async()=>{ 
                        let result = await DoRequest(tQueryResultOptions)
                        let tBody = JSON.parse(result.body);
                        if(tBody.data && tBody.data[0].status != "complete"){
                            if(tBody.data[0].status == "invalid" || tBody.data[0].status == "requested" ){
                                nLimit-=100;
                                doQueryAll();
                                return
                            }
                            doQuery();
                            return;
                        }
                        let tFacebookData = ProcessFacebookData(tBody);
                        pCallback(tFacebookData);
                    }, 5000);
                }
                doQuery();
            }
        }
        doQueryAll();
    }

if (typeof exports !== "undefined") {
    exports.RequestAdmobData=RequestAdmobData;
    exports.RequestFacebookData=RequestFacebookData;
}
else {
    window.RequestAdmobData=RequestAdmobData;
    window.RequestFacebookData=RequestFacebookData;

    if (typeof define === "function" && define.amd) {
        define(function() {
            return {
                RequestAdmobData:RequestAdmobData,
                RequestFacebookData:RequestFacebookData,
            }
        })
    }
}
})(typeof window === "undefined" ? this : window);