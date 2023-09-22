import { Request, Response } from "express";
import { WrapperResponse } from "../helper/wrapResponse";
import "dotenv/config"
import axios from "axios";
import __string from "../data/html/sampl1";

export const getNotionAuthUrlController = async (request: Request, response: Response)=>{
    

    return WrapperResponse("success", {
        message: "Auth URL",
        status: "success",
        payload: {
            url: process.env.NOTION_AUTH_URL
        }
    }, response)
}

export const getTokenController = async (request: Request, response: Response)=>{
    
    try{
        const {code} = request.body;
        
        const auth_header = Buffer.from(`${process.env.NOTION_CLIENT}:${process.env.NOTION_SECRET}`).toString("base64");
        console.log(auth_header)

        const res = await axios.post("https://api.notion.com/v1/oauth/token", {
            code,
            grant_type: "authorization_code",
            redirect_uri: process.env.NOTION_CALLBACK_URL
        }, {
            headers: {
                Authorization: `Basic ${auth_header}`
            }
        });

        // get default quick note 
        const allPagesRaw = await axios.post("https://api.notion.com/v1/search", {

        }, {
            headers: {
                Authorization: `Bearer ${res.data.access_token}`,
                "Notion-Version": "2022-06-28"
            }
        });

        const firstPage = (allPagesRaw?.data?.results || []).find(item =>{
            return (item.object == 'page');
        });



        return WrapperResponse("success", {
            message: "Auth Successful",
            status: "success",
            payload: {
                user_data: {
                    data: res.data,
                    first_page: firstPage
                }
            }
        }, response)
    }
    catch(e){
        console.log(e)
        return WrapperResponse("error", {
            message: "Token is Invalid",
            status: "failed"
        }, response)
    }
}

export const craeteNotionNoteController = async (request: Request, response: Response)=>{
    
    try {

        const {access_token, page_id} = request.body;

        const { convert } = require('html-to-text');

        const options = {
            wordwrap: 130,
            // ...
        };
        const html = __string;
        const text: string = convert(html, options);
        console.log(text); // Hello World

        const newString = [];

        if((text.length / 2000) >= 1){
            for (let i = 0; i < (text.length / 2000); i++) {
                
                if(i == 0){
                    newString.push(text.slice(0, 2000));
                }else{
                    newString.push(text.slice(2000 * i, (2000 * i) + 2000));
                }
            }
        }else{
            newString.push(text);
        }


        const payload = {
            "parent": {
                "type": "page_id",
                page_id
            },
          "icon": {
              "type": "external",
              "external": {
                  "url": "https://www.skedu.me/_next/image?url=%2Fimages%2Fskedu-logo.png&w=128&q=75"
              }
            },
            "cover": {
                "external": {
                    "url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
                }
            },
            "properties": {
                "title": {
                "id": "title",
                "type": "title",
                "title": [
                    {
                    "type": "text",
                    "text": {
                        "content": "Meeting: Skedu BE / FE Updates",
                        "link": null
                    },
                    "annotations": {
                        "bold": false,
                        "italic": false,
                        "strikethrough": false,
                        "underline": false,
                        "code": false,
                        "color": "default"
                    },
                    "plain_text": "",
                    "href": null
                    }
                ]
                }
            },
            "children": 
            newString.map(item => {
                return {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": item
                                }
                            }
                        ]
                    }
                }
            })
            // [
            //     {
            //         "object": "block",
            //         "type": "paragraph",
            //         "paragraph": {
            //             "rich_text": [
            //                 {
            //                     "type": "text",
            //                     "text": {
            //                         "content": html
            //                     }
            //                 }
            //             ]
            //         }
            //     }
            // ]
        };

        const resp = await axios.post("https://api.notion.com/v1/pages", payload, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Notion-Version": "2022-06-28"
            }
        });
    
        return WrapperResponse("success", {
            message: "Success",
            status: "success",
            payload: {
                resp: resp.data.toString()
            }
        }, response)

    } catch (e) {
        console.log(e)
        return WrapperResponse("error", {
            message: "Error",
            status: "failed",
            payload: {
                error: e
            }
        }, response)   
    }
}