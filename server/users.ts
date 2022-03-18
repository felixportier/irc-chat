import { Schema, model, connect, Document } from 'mongoose'
import {CurrentDate,ConnectDb } from './helpers'

//handles User registration to the Database and User schema

//Define types for the user interface , represents mongoDB document
interface User {
    userName: string
    createdAt?: string

    //email to implement
    //picture to implement

}


//Create a new Schema corresponding to interface
//Use dropdups to drop duplicates and unique:true to set index as unique
const schema = new Schema<User>({
    userName: { type: String, required: true, unique: true, dropDups: true },
    createdAt: { type: String}
    //TO IMPLEMENT : email,picture,createdAt

})

//Create a model
export const  UserModel = model<User>('User', schema);



export async function SaveUser(user:User): Promise<void> {
    
    //Connect to database
    //TODO PUT IN ENV ;) 
    try {
        await connect('mongodb+srv://IRCAdmin:IRCAdmin@irc.3byir.mongodb.net/irchat?retryWrites=true&w=majority')
    } catch (err) {
        console.log(err)
    }

    const document = new UserModel({
        userName: user.userName,
        createdAt:CurrentDate()
    })


    //Save document to db
    await document.save(function(err){
        if (err) console.log(err)
    });
    console.log("Trying to save " + document.userName + " to db!")
}


export function FindUserByName(userName:string):any {
     //Connect to database
    //TODO PUT IN ENV ;) 
    ConnectDb()

      UserModel.findOne({'userName' : userName},function(err:any,user:User):any{
        if (err){
            console.log(err)
            err
        }
        else if(user){
            console.log("Result : ", user);
            return user
        }else{
            console.log('No user found');
            return 'No user found'
        }

       
     })



}


//Saves the current channel the user is in
export async function SaveCurrentChannel(channel: string, userName: string): Promise<void> {
    try {
        await connect('mongodb+srv://IRCAdmin:IRCAdmin@irc.3byir.mongodb.net/irchat?retryWrites=true&w=majority')
    } catch (err) {
        console.log(err)
    }

    const document = await UserModel.findOne({ userName: userName })

    if (document) {
        console.log("Trying to save current channel to user")
       // document.channels.channelName = channel;
        await document.save()
    }


}


export default User