import { Request, Response } from "express";
import { WrapperResponse } from "../helper/wrapResponse";
import "dotenv/config"
import axios from "axios";

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