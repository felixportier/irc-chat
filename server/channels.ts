import { Schema, model, connect, Document } from 'mongoose'
import {CurrentDate} from './helpers'


//handles channel logging


//Define types for the channel interface , represent MongoDB doc
interface Channel {
    channelName:string
    createdAt:string
    channelId:string
    messages:object[]
    connectedUsers:object[]
}


//create a new schema
const schema = new Schema<Channel>({
    channelName: {type:String,required:true,unique:true,dropDups:true},
    channelId:{type:String,required:true,unique:true,dropDups:true},
    messages:{type:[]},
    connectedUsers:{type:[]}
})

//Create new model

export const ChannelModel = model<Channel>('Channel',schema)


export default Channel