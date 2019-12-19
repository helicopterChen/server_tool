/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-03-29 09:27:19
 * @LastEditTime: 2019-04-12 13:55:24
 */

(function(window) {
    let FB_TOKEN = "EAAcl0ZAnNVHwBAKLteSLhqAdMeBltCJJCxmiFWiVfqnAv7s6CWJzR9IZAjlrz6aNYgYHtabhgmCqOklCtm2WIyoMLQayZCyk5wrZCoDwBFvJE2v8Qau7iLij9fXWGICjSUhKrNBKI2bISVvGXjXG6B2jBXZAXEkPUSicvRWQmmcWWDAoP61fW";
    let FACEBOOK_PATH = "https://graph.facebook.com/v3.2/2011906995737724/adnetworkanalytics/?metrics=['fb_ad_network_imp','fb_ad_network_filled_request','fb_ad_network_cpm','fb_ad_network_request','fb_ad_network_click','fb_ad_network_revenue']&since=2019-03-26&until=2019-03-26&breakdowns=['platform','country','placement']&access_token="+FB_TOKEN;
    let FACEBOOK_RESULT_QUERY = "https://graph.facebook.com/v3.2/2011906995737724/adnetworkanalytics_results/?query_ids=['"
    let ADMOB_PATH="http://www.cwpro.xyz/details";

    function unicode2Chr(str) {
        return unescape(str.replace(/\\/g, "%"))
    }

    let T_RequestOption={
        Facebook:{
            url:FACEBOOK_PATH,
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'Accept':'application/json'     
            }
        },
        Admob:{
            url:ADMOB_PATH,
            method: 'GET',
            headers:{
                'Content-Type': 'application/json',
                'Accept':'application/json'     
            }
        }
    }

    let T_DataParser={
        Facebook:function(sBody){
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
        },
        Admob:function(sBody){
            let tRow = sBody.split('\n');
            let tMap = [];
            let tHeads = [
                "Date","AppId","GameName","Platform","AdUnitName","AdUnit","Country","AdRequests","Views","Clicks","Revenue","FillRate"
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
                        tData[tHeads[j]] = sVal.substring(3)
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
                tConvertedData["REQUEST"] = tData["Adrequests"];
                tConvertedData["CLICKED"] = tData["Clicks"];
                tConvertedData["VIEWS"] = tData["Views"];
                tConvertedData["AVALABLE"] = tData["FillRate"];
                tConvertedData["DATE"] = tData["Date"];
                tMap.push(tConvertedData);
            }
            return tMap
        }
    }

    function DoRequest(tOptions){
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            if(tOptions.method=="POST"){
                xhr.open("POST",encodeURI(tOptions.url), true);
            }else{
                xhr.open("GET",encodeURI(tOptions.url), true);
            }

            // xhr.setRequestHeader("access-control-allow-origin",'*');
            // xhr.setRequestHeader("Access-Control-Allow-Credentials",'true');
            // xhr.setRequestHeader("Access-Control-Allow-Headers",'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type');
            if( tOptions.headers ){
                for(let sHeader in tOptions.headers){
                    xhr.setRequestHeader(sHeader,tOptions.headers[sHeader]);
                }
            }
            xhr.onreadystatechange = function(){
                let XMLHttpReq = xhr;
                if (XMLHttpReq.readyState == 4) {
                    if (XMLHttpReq.status == 200) {                
                        let data = XMLHttpReq.responseText;
                        let sData = unicode2Chr(data);
                        resolve(sData);
                    }else{
                        reject();
                    }
                }
            };
            xhr.send({});
        });
    }

    async function RequestData(sType,tDate,pCallback){
        let tOption = T_RequestOption[sType];
        let pDataParser = T_DataParser[sType];
        if(!tOption||!pDataParser){
            return;
        }
        if(sType=="Facebook"){
            let sData = await DoRequest(tOption)
            let tData = JSON.parse(sData);
            if(tData){
                let tQueryResultOptions={
                    url: FACEBOOK_RESULT_QUERY+tData.query_id+"']&access_token="+FB_TOKEN, 
                    method: 'GET', 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept:'application/json'
                }
                setTimeout( async()=>{ 
                    let sResultData = await DoRequest(tQueryResultOptions)
                    pCallback(pDataParser(sResultData));
                }, 5000);
            }
        }else{
            let sData = await DoRequest(tOption)
            pCallback(pDataParser(sData))
        }
    }

    function FillToGrid(tData,oGrid){
        oGrid.clear();
        oGrid.columns =
        [
            { field: 'recid', caption: 'recid', size: '100px', sortable: true, attr: 'align=center' },
            { field: 'DATE', caption: 'DATE', size: '140px', sortable: true, resizable: true  },
            { field: 'APP_ID', caption: 'APP_ID', size: '350px', sortable: true, resizable: true  },
            { field: 'PLATFORM', caption: 'PLATFORM', size: '140px', sortable: true, resizable: true  },
            { field: 'AD_UNIT', caption: 'AD_UNIT', size: '250px', sortable: true, resizable: true  },
            { field: 'COUNTRY', caption: 'COUNTRY', size: '140px', sortable: true, resizable: true  },
            { field: 'REQUEST', caption: 'REQUEST', size: '140px', sortable: true, resizable: true  },
            { field: 'AVALABLE', caption: 'AVALABLE', size: '140px', sortable: true, resizable: true  },
            { field: 'REVENUE', caption: 'REVENUE', size: '140px', sortable: true, resizable: true  },
            { field: 'VIEWS', caption: 'VIEWS', size: '140px', sortable: true, resizable: true  },
            { field: 'COMPLETES', caption: 'COMPLETES', size: '140px', sortable: true, resizable: true  },            
            { field: 'CLICKED', caption: 'CLICKED', size: '140px', sortable: true, resizable: true  },
            { field: 'ECPM', caption: 'ECPM', size: '140px', sortable: true, resizable: true  },
        ];
        let nIdx = 1;
        for(let tLineData of tData){
            tLineData.recid = nIdx;
            tLineData.REVENUE=parseFloat(tLineData.REVENUE);
            tLineData.VIEWS=parseInt(tLineData.VIEWS);
            tLineData.REQUEST=parseInt(tLineData.REQUEST);
            tLineData.AVALABLE=parseInt(tLineData.AVALABLE);
            tLineData.CLICKED=parseInt(tLineData.CLICKED);
            tLineData.COMPLETES=parseInt(tLineData.COMPLETES);
            tLineData.ECPM=parseFloat(tLineData.ECPM);
            oGrid.records.push(tLineData);
            ++nIdx;
        }
        oGrid.render();
    }


if (typeof exports !== "undefined") {
    exports.RequestData = RequestData
    exports.FillToGrid = FillToGrid
}
else {
    window.RequestData = RequestData
    window.FillToGrid=FillToGrid

    if (typeof define === "function" && define.amd) {
        define(function() {
            return {
                RequestData: RequestData,
                FillToGrid:FillToGrid
            }
        })
    }
}
})(typeof window === "undefined" ? this : window);